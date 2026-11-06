#!/bin/bash
# ============================================================
#  Disaster-Ready Offline Intranet in a Box — Linux/Pi Startup
# ============================================================
#  This script:
#    1. Configures hostapd (Wi-Fi Access Point)
#    2. Configures dnsmasq (DHCP + DNS for connected devices)
#    3. Sets a static IP on the wireless interface
#    4. Starts the Intranet Box server
#
#  HOW TO USE:
#    chmod +x start-intranet.sh
#    sudo ./start-intranet.sh
#
#  REQUIREMENTS:
#    - Raspberry Pi (or Linux with Wi-Fi adapter)
#    - hostapd and dnsmasq installed:
#      sudo apt install hostapd dnsmasq
#    - Node.js installed
# ============================================================

set -e

# Configuration — change these as needed
SSID="EMERGENCY-NET"
PASSWORD="disaster123"
WIFI_INTERFACE="wlan0"
HOTSPOT_IP="192.168.4.1"
DHCP_RANGE_START="192.168.4.10"
DHCP_RANGE_END="192.168.4.100"
PORT=3000
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo -e "${RED}=============================================${NC}"
echo -e "${RED}  DISASTER-READY OFFLINE INTRANET IN A BOX${NC}"
echo -e "${RED}=============================================${NC}"
echo ""

# Check root
if [ "$EUID" -ne 0 ]; then
    echo -e "${YELLOW}[!] Please run as root: sudo ./start-intranet.sh${NC}"
    exit 1
fi

# ----------------------------
# Step 1: Check dependencies
# ----------------------------
echo -e "${CYAN}[1/5] Checking dependencies...${NC}"

for cmd in hostapd dnsmasq node npm; do
    if ! command -v $cmd &> /dev/null; then
        echo -e "${RED}  [!] '$cmd' not found.${NC}"
        if [ "$cmd" = "hostapd" ] || [ "$cmd" = "dnsmasq" ]; then
            echo -e "${YELLOW}  Installing: sudo apt install hostapd dnsmasq${NC}"
            apt-get update -qq && apt-get install -y -qq hostapd dnsmasq
        else
            echo -e "${RED}  Please install Node.js: https://nodejs.org${NC}"
            exit 1
        fi
    fi
done
echo -e "${GREEN}  [OK] All dependencies found.${NC}"

# ----------------------------
# Step 2: Stop conflicting services
# ----------------------------
echo -e "${CYAN}[2/5] Stopping conflicting services...${NC}"
systemctl stop hostapd 2>/dev/null || true
systemctl stop dnsmasq 2>/dev/null || true
# Kill any existing wpa_supplicant on our interface
killall wpa_supplicant 2>/dev/null || true
sleep 1

# ----------------------------
# Step 3: Configure Wi-Fi Access Point
# ----------------------------
echo -e "${CYAN}[3/5] Configuring Wi-Fi Access Point (${SSID})...${NC}"

# Set static IP on wireless interface
ip link set $WIFI_INTERFACE down 2>/dev/null || true
ip addr flush dev $WIFI_INTERFACE 2>/dev/null || true
ip link set $WIFI_INTERFACE up
ip addr add ${HOTSPOT_IP}/24 dev $WIFI_INTERFACE

# Create hostapd config
HOSTAPD_CONF="/tmp/intranet-hostapd.conf"
cat > "$HOSTAPD_CONF" << EOF
interface=${WIFI_INTERFACE}
driver=nl80211
ssid=${SSID}
hw_mode=g
channel=7
wmm_enabled=0
macaddr_acl=0
auth_algs=1
ignore_broadcast_ssid=0
wpa=2
wpa_passphrase=${PASSWORD}
wpa_key_mgmt=WPA-PSK
wpa_pairwise=TKIP
rsn_pairwise=CCMP
EOF

# Create dnsmasq config (DHCP + redirect all DNS to this device)
DNSMASQ_CONF="/tmp/intranet-dnsmasq.conf"
cat > "$DNSMASQ_CONF" << EOF
interface=${WIFI_INTERFACE}
bind-interfaces
dhcp-range=${DHCP_RANGE_START},${DHCP_RANGE_END},255.255.255.0,24h
# Redirect ALL DNS queries to this device (captive portal effect)
address=/#/${HOTSPOT_IP}
EOF

echo -e "${GREEN}  [OK] hostapd configured: SSID=${SSID}, Password=${PASSWORD}${NC}"

# ----------------------------
# Step 4: Start hotspot services
# ----------------------------
echo -e "${CYAN}[4/5] Starting Wi-Fi hotspot...${NC}"

# Start dnsmasq
dnsmasq -C "$DNSMASQ_CONF" --no-daemon --log-queries &
DNSMASQ_PID=$!

# Start hostapd
hostapd "$HOSTAPD_CONF" -B
HOSTAPD_PID=$!

sleep 2

# Check if hostapd is running
if kill -0 $HOSTAPD_PID 2>/dev/null; then
    echo -e "${GREEN}  [OK] Wi-Fi hotspot '${SSID}' is broadcasting!${NC}"
else
    echo -e "${RED}  [!] hostapd failed to start.${NC}"
    echo -e "${YELLOW}  Common fixes:${NC}"
    echo -e "${YELLOW}    - Disable built-in Wi-Fi management: sudo nmcli radio wifi off${NC}"
    echo -e "${YELLOW}    - Try a different channel (edit this script)${NC}"
    echo -e "${YELLOW}    - Check: sudo rfkill unblock wifi${NC}"
    kill $DNSMASQ_PID 2>/dev/null || true
    exit 1
fi

# Enable IP forwarding (in case there's an ethernet uplink)
echo 1 > /proc/sys/net/ipv4/ip_forward

# ----------------------------
# Step 5: Start the Intranet portal
# ----------------------------
echo ""
echo -e "${CYAN}[5/5] Starting Intranet Box server...${NC}"

cd "$SCRIPT_DIR"

# Build if not already built
if [ ! -f ".next/BUILD_ID" ]; then
    echo -e "${YELLOW}  Building production app (first time only)...${NC}"
    npm run build
fi

echo ""
echo -e "${GREEN}=============================================${NC}"
echo -e "${GREEN}  INTRANET BOX IS READY!${NC}"
echo -e "${GREEN}=============================================${NC}"
echo ""
echo -e "  Wi-Fi Network:  ${SSID}"
echo -e "  Wi-Fi Password: ${PASSWORD}"
echo ""
echo -e "${YELLOW}  Portal URL:${NC}"
echo -e "${YELLOW}  ========================================${NC}"
echo -e "${CYAN}  http://${HOTSPOT_IP}:${PORT}${NC}"
echo -e "${YELLOW}  ========================================${NC}"
echo ""
echo -e "  INSTRUCTIONS FOR USERS:"
echo -e "  1. Connect phone/laptop to Wi-Fi: '${SSID}'"
echo -e "  2. Open browser and go to: http://${HOTSPOT_IP}:${PORT}"
echo -e "  3. OR just open any website — captive portal will redirect!"
echo ""
echo -e "  Press Ctrl+C to stop everything."
echo ""

# Cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down Intranet Box...${NC}"
    kill $DNSMASQ_PID 2>/dev/null || true
    killall hostapd 2>/dev/null || true
    ip addr flush dev $WIFI_INTERFACE 2>/dev/null || true
    echo -e "${GREEN}Done. Stay safe.${NC}"
    exit 0
}
trap cleanup INT TERM

# Start Next.js server (binds to all interfaces)
npx next start -p $PORT -H 0.0.0.0
