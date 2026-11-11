# ============================================================
#  Intranet Box - One-Click Server Restart
# ============================================================
#  Kills any running node instances, clears stale locks,
#  and starts the local intranet server on 0.0.0.0:3000.
# ============================================================

$Port = 3000
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "Restarting Intranet Box server..." -ForegroundColor Cyan

# 1. Clean stale Next.js dev lock
$lockFile = Join-Path $scriptDir ".next\dev\lock"
if (Test-Path $lockFile) {
    Remove-Item -Path $lockFile -Force -ErrorAction SilentlyContinue
    Write-Host "  Cleared stale lock." -ForegroundColor DarkGray
}

# 2. Kill process listening on port 3000
$occupied = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($occupied) {
    $busyPid = $occupied.OwningProcess | Select-Object -First 1
    Write-Host "  Freeing port $Port (stopping PID $busyPid)..." -ForegroundColor Yellow
    taskkill /PID $busyPid /F 2>&1 | Out-Null
    Start-Sleep -Seconds 1
}

# 3. Detect IP address
$ipAddresses = Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.IPAddress -ne "127.0.0.1" -and $_.PrefixOrigin -ne "WellKnown" } |
    Select-Object -ExpandProperty IPAddress

$hotspotIp = $null
foreach ($ip in $ipAddresses) {
    if ($ip -match "^192\.168\.(137|43|0|1)\." -or $ip -match "^192\.168\.") {
        $hotspotIp = $ip
        break
    }
}
if (-not $hotspotIp -and $ipAddresses.Count -gt 0) { $hotspotIp = $ipAddresses[0] }
if (-not $hotspotIp) { $hotspotIp = "localhost" }

Write-Host "=============================================" -ForegroundColor Green
Write-Host "  INTRANET SERVER RESTARTED" -ForegroundColor Green
Write-Host "  Access URL: http://${hotspotIp}:${Port}" -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""

$env:HOSTNAME = "0.0.0.0"
npx next dev -p $Port -H 0.0.0.0
