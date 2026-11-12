import { connection, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import getDb from '@/lib/db';

function escapeWifi(value) {
  return value.replace(/([\\;,:\"])/g, '\\$1');
}

export async function GET() {
  await connection();
  const headers = { 'Cache-Control': 'no-store' };
  try {
    const rows = getDb().prepare("SELECT key, value FROM settings WHERE key IN ('hotspot_ssid', 'hotspot_password')").all();
    const settings = Object.fromEntries(rows.map(({ key, value }) => [key, value]));
    if (!settings.hotspot_ssid || !settings.hotspot_password) {
      return NextResponse.json({ configured: false }, { headers });
    }
    const payload = `WIFI:T:WPA;S:${escapeWifi(settings.hotspot_ssid)};P:${escapeWifi(settings.hotspot_password)};;`;
    const image = await QRCode.toDataURL(payload, { width: 300, margin: 2, color: { dark: '#0f172a', light: '#f1f5f9' } });
    return NextResponse.json({ configured: true, image, ssid: settings.hotspot_ssid }, { headers });
  } catch {
    return NextResponse.json({ error: 'Could not generate hotspot QR code' }, { status: 500, headers });
  }
}
