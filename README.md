# 🚨 Disaster-Ready Offline Intranet in a Box

A portable local emergency information server. During disasters or connectivity failures, citizens connect to its Wi-Fi hotspot and access preloaded educational, emergency, agricultural, and healthcare information — **without any internet connectivity**.

```
┌───────────────────────────────────────────────────────────┐
│          YOUR DEVICE (Laptop / Raspberry Pi)              │
│                                                           │
│   ┌──────────────┐     ┌─────────────────────────────┐    │
│   │  Wi-Fi        │     │  Next.js Server              │    │
│   │  Hotspot      │────▶│  http://192.168.x.x:3000     │    │
│   │  "EMERGENCY-  │     │  ┌────────┐ ┌────────────┐  │    │
│   │   NET"        │     │  │ SQLite  │ │ Knowledge  │  │    │
│   └──────────────┘     │  │ DB      │ │ Base       │  │    │
│                         │  └────────┘ └────────────┘  │    │
│                         └─────────────────────────────┘    │
└──────────┬──────────────────┬──────────────┬──────────────┘
           │ Wi-Fi             │ Wi-Fi         │ Wi-Fi
        📱 Phone          📱 Phone        💻 Laptop
       (browser)          (browser)       (browser)
```

## 🚀 Quick Start

### Option 1: Windows (Laptop)

```powershell
# From the disaster_management folder, enter the app folder first.
Set-Location .\intranet_box

# 1. Install dependencies (first time only)
npm.cmd install

# 2. Run the one-click startup script (opens hotspot settings + starts server)
powershell -ExecutionPolicy Bypass -File .\start-intranet.ps1
```

**Or manually:**
1. **Enable Mobile Hotspot:** Settings → Network & Internet → Mobile Hotspot → Turn ON
2. Note the IP shown (usually `192.168.137.1`)
3. In `intranet_box`, run `npm.cmd run build`. Once the build succeeds, run `npm.cmd start`.
4. Others connect to your hotspot and open `http://192.168.137.1:3000`

For development, run `npm.cmd run dev` from `intranet_box`. Use `npm.cmd` in Windows PowerShell to avoid relying on its permission to run the `npm.ps1` shim. Stop any previous server with `Ctrl+C` before switching between development and production.

### Option 2: Raspberry Pi / Linux

```bash
# 1. Install system packages
sudo apt install hostapd dnsmasq nodejs npm

# 2. Install app dependencies
npm install

# 3. Run the startup script (creates hotspot + starts server)
chmod +x start-intranet.sh
sudo ./start-intranet.sh
```

This will:
- Create a Wi-Fi network called **EMERGENCY-NET** (password: `disaster123`)
- Start the portal at **http://192.168.4.1:3000**
- Redirect any website access to the portal (captive portal)

### Option 3: Any Device (Manual Hotspot)

```bash
# 1. Enable your phone/laptop's hotspot manually
# 2. Connect this device to its own hotspot (or use built-in)
# 3. Start the server:
npm run build
npx next start -p 3000 -H 0.0.0.0

# 4. Find your IP:
#    Windows:  ipconfig  → look for "IPv4 Address"
#    Linux:    hostname -I
#    Typical:  192.168.43.1 (Android hotspot)
#              192.168.137.1 (Windows hotspot)
```

## 📱 How Users Connect

1. **Join the Wi-Fi:** Connect phone/laptop to the hotspot (e.g., `EMERGENCY-NET`)
2. **Open browser:** Navigate to `http://<server-ip>:3000` (shown on the server screen)
3. **Or scan QR:** Visit `/connect` on the portal for a scannable QR code

> **No internet, no app install, no account needed.** Any device with a browser and Wi-Fi works.

## 📦 Modules

| Module | Route | What it does |
|--------|-------|-------------|
| 🏠 Dashboard | `/` | Live stats, system status, quick links to all modules |
| 🚨 Emergency Alerts | `/alerts` | Broadcast critical alerts (auto-refreshes on all devices) |
| 📚 Knowledge Base | `/knowledge` | 11 preloaded offline guides: first aid, agriculture, health, SOPs |
| 🗺️ Offline Map | `/map` | Shelter locations, medical camps, water points, danger zones |
| 👤 Person Registry | `/registry` | Register survivors, search for missing persons |
| 📦 Resource Inventory | `/inventory` | Track food, water, medicine, equipment with low-stock alerts |
| 💬 Bulletin Board | `/bulletin` | Community notice board (anyone on network can post) |
| 📱 Connect / QR | `/connect` | QR code to share the portal URL + Wi-Fi join QR |

## 🛠 Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | Next.js 16 (App Router) + React 19 + Tailwind CSS 4 |
| Backend | Next.js API Routes (server-side) |
| Database | SQLite via better-sqlite3 (WAL mode, zero config) |
| QR Codes | qrcode package (client-side, fully offline) |

**Key design decisions:**
- **Zero external CDN** — all assets served locally
- **SQLite** — single-file database, no server process needed
- **Polling** — alerts refresh every 10s, bulletin every 15s (no WebSocket needed)
- **Mobile-first** — responsive UI designed for phone screens

## 📁 Project Structure

```
intranet_box/
├── start-intranet.ps1     ← Windows one-click startup
├── start-intranet.sh      ← Linux/Pi one-click startup
├── data/
│   └── intranet.db        ← SQLite database (auto-created on first run)
├── src/
│   ├── app/
│   │   ├── page.js              ← Dashboard
│   │   ├── alerts/page.js       ← Emergency alerts
│   │   ├── knowledge/page.js    ← Knowledge base
│   │   ├── map/page.js          ← Offline map
│   │   ├── registry/page.js     ← Person registry
│   │   ├── inventory/page.js    ← Resource inventory
│   │   ├── bulletin/page.js     ← Bulletin board
│   │   ├── connect/page.js      ← QR code + connect guide
│   │   └── api/                 ← REST API routes
│   ├── components/
│   │   ├── Sidebar.js           ← Navigation sidebar
│   │   └── AlertBanner.js       ← Auto-polling alert strip
│   └── lib/
│       └── db.js                ← Database init + seed data
└── package.json
```

## 🔧 Configuration

Edit the startup scripts to customize:

| Setting | Default | Where |
|---------|---------|-------|
| Wi-Fi SSID | `EMERGENCY-NET` | `start-intranet.ps1` / `.sh` |
| Wi-Fi Password | `disaster123` | `start-intranet.ps1` / `.sh` |
| Server Port | `3000` | `start-intranet.ps1` / `.sh` |
| Hotspot IP (Linux) | `192.168.4.1` | `start-intranet.sh` |

## 🎯 Hardware Recommendations (Field Deployment)

| Item | Specification | Purpose |
|------|--------------|---------|
| Raspberry Pi 4 | 2GB+ RAM | Main server |
| MicroSD Card | 32GB Class 10 | OS + app storage |
| USB Power Bank | 20,000mAh+ | 12+ hours field power |
| Solar Charger | 20W panel | Extended operation |

## 📄 License

MIT
