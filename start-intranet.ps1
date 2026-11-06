# ============================================================
#  Disaster-Ready Offline Intranet in a Box — Windows Startup
# ============================================================
#  This script:
#    1. Enables Windows Mobile Hotspot
#    2. Detects your hotspot IP address
#    3. Starts the Intranet Box server
#    4. Shows the URL others can use to connect
#
#  HOW TO USE:
#    Right-click this file → "Run with PowerShell"
#    (or run from Admin PowerShell: .\start-intranet.ps1)
#
#  REQUIREMENTS:
#    - Windows 10/11 with Wi-Fi adapter
#    - Node.js installed
#    - Run as Administrator (for hotspot control)
# ============================================================

param(
    [string]$HotspotName = "EMERGENCY-NET",
    [string]$HotspotPassword = "disaster123",
    [int]$Port = 3000
)

$ErrorActionPreference = "Continue"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "=============================================" -ForegroundColor Red
Write-Host "  DISASTER-READY OFFLINE INTRANET IN A BOX"   -ForegroundColor Red
Write-Host "=============================================" -ForegroundColor Red
Write-Host ""

# ----------------------------
# Step 1: Check if running as admin
# ----------------------------
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[!] Not running as Administrator." -ForegroundColor Yellow
    Write-Host "    Hotspot will NOT be auto-configured." -ForegroundColor Yellow
    Write-Host "    Please enable Mobile Hotspot manually:" -ForegroundColor Yellow
    Write-Host "      Settings -> Network & Internet -> Mobile Hotspot" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host "[1/4] Configuring Wi-Fi Hotspot..." -ForegroundColor Cyan

    # Try Windows 10/11 Mobile Hotspot via netsh
    # Note: Windows 10 1607+ uses a different API for Mobile Hotspot
    # We try the legacy hosted network approach first
    $hostedNetResult = netsh wlan set hostednetwork mode=allow ssid="$HotspotName" key="$HotspotPassword" 2>&1
    $startResult = netsh wlan start hostednetwork 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Hosted network '$HotspotName' started!" -ForegroundColor Green
        Write-Host "  [OK] Password: $HotspotPassword" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "  [!] Could not auto-start hosted network." -ForegroundColor Yellow
        Write-Host "      This is normal on newer Windows versions." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "  >>> PLEASE ENABLE HOTSPOT MANUALLY <<<" -ForegroundColor Red
        Write-Host ""
        Write-Host "  Option A - Windows Settings (Recommended):" -ForegroundColor Cyan
        Write-Host "    1. Press Win+I to open Settings" -ForegroundColor White
        Write-Host "    2. Go to: Network & Internet -> Mobile Hotspot" -ForegroundColor White
        Write-Host "    3. Turn ON the toggle" -ForegroundColor White
        Write-Host "    4. Click 'Edit' to set name/password:" -ForegroundColor White
        Write-Host "       Name:     $HotspotName" -ForegroundColor Green
        Write-Host "       Password: $HotspotPassword" -ForegroundColor Green
        Write-Host ""

        # Try to open Windows Mobile Hotspot settings
        try {
            Start-Process "ms-settings:network-mobilehotspot" -ErrorAction SilentlyContinue
            Write-Host "  [OK] Opened Mobile Hotspot settings for you." -ForegroundColor Green
        } catch {
            Write-Host "  Could not auto-open settings." -ForegroundColor Yellow
        }

        Write-Host ""
        Write-Host "  Press ENTER after you have enabled the hotspot..." -ForegroundColor Yellow
        Read-Host
    }
}

# ----------------------------
# Step 2: Detect IP addresses
# ----------------------------
Write-Host ""
Write-Host "[2/4] Detecting network IP addresses..." -ForegroundColor Cyan

$ipAddresses = Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.IPAddress -ne "127.0.0.1" -and $_.PrefixOrigin -ne "WellKnown" } |
    Select-Object -ExpandProperty IPAddress

$hotspotIp = $null
foreach ($ip in $ipAddresses) {
    # Common hotspot IP ranges
    if ($ip -match "^192\.168\.(137|43|0|1)\." -or $ip -match "^192\.168\.") {
        $hotspotIp = $ip
        break
    }
}

if (-not $hotspotIp -and $ipAddresses.Count -gt 0) {
    $hotspotIp = $ipAddresses[0]
}

if ($hotspotIp) {
    Write-Host "  [OK] Detected IP: $hotspotIp" -ForegroundColor Green
} else {
    Write-Host "  [!] Could not detect IP. Using localhost." -ForegroundColor Yellow
    $hotspotIp = "localhost"
}

Write-Host "  All detected IPs: $($ipAddresses -join ', ')" -ForegroundColor DarkGray

# ----------------------------
# Step 3: Build (if needed) and start server
# ----------------------------
Write-Host ""
Write-Host "[3/4] Starting Intranet Box server..." -ForegroundColor Cyan

Set-Location $scriptDir

# Check if production build exists
$nextDir = Join-Path $scriptDir ".next"
if (-not (Test-Path $nextDir)) {
    Write-Host "  Building production app (first time only)..." -ForegroundColor Yellow
    npm run build 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [!] Build failed. Starting in dev mode instead." -ForegroundColor Yellow
        Write-Host ""
    }
}

# ----------------------------
# Step 4: Display connection info
# ----------------------------
Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host "  INTRANET BOX IS READY!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Wi-Fi Network:  $HotspotName" -ForegroundColor White
Write-Host "  Wi-Fi Password: $HotspotPassword" -ForegroundColor White
Write-Host ""
Write-Host "  Portal URL:" -ForegroundColor Yellow
Write-Host "  ========================================" -ForegroundColor Yellow
Write-Host "  http://${hotspotIp}:${Port}" -ForegroundColor Cyan
Write-Host "  ========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "  INSTRUCTIONS FOR USERS:" -ForegroundColor White
Write-Host "  1. Connect phone/laptop to Wi-Fi: '$HotspotName'" -ForegroundColor White
Write-Host "  2. Open browser and go to: http://${hotspotIp}:${Port}" -ForegroundColor White
Write-Host "  3. Or scan the QR code at: http://${hotspotIp}:${Port}/connect" -ForegroundColor White
Write-Host ""
Write-Host "  Press Ctrl+C to stop the server." -ForegroundColor DarkGray
Write-Host ""

# Start the server (binds to all interfaces so LAN devices can reach it)
$env:HOSTNAME = "0.0.0.0"
if (Test-Path (Join-Path $nextDir "BUILD_ID")) {
    npx next start -p $Port -H 0.0.0.0
} else {
    npx next dev -p $Port -H 0.0.0.0
}
