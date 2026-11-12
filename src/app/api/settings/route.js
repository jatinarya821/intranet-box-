import { NextResponse } from 'next/server';
import { isIP } from 'node:net';
import getDb from '@/lib/db';
import { isAdminRequest } from '@/lib/auth';

const PUBLIC_KEYS = ['camp_name', 'hotspot_ip', 'hotspot_ssid'];

export async function GET() {
  try {
    const db = getDb();
    const rows = db.prepare(
      `SELECT key, value FROM settings WHERE key IN (${PUBLIC_KEYS.map(() => '?').join(',')})`
    ).all(...PUBLIC_KEYS);
    const settings = Object.fromEntries(rows.map((row) => [row.key, row.value]));
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: 'Admin PIN required' }, { status: 401 });
    }
    const body = await request.json();
    const db = getDb();
    const update = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
    const allowed = {
      camp_name: String(body.camp_name || '').trim().slice(0, 80),
      hotspot_ip: String(body.hotspot_ip || '').trim().slice(0, 64),
      hotspot_ssid: String(body.hotspot_ssid || '').trim(),
    };
    if (!allowed.camp_name) {
      return NextResponse.json({ error: 'Camp name is required' }, { status: 400 });
    }
    if (!allowed.hotspot_ssid || Buffer.byteLength(allowed.hotspot_ssid, 'utf8') > 32) {
      return NextResponse.json({ error: 'Enter a hotspot name of up to 32 bytes' }, { status: 400 });
    }
    if (body.hotspot_password !== undefined && body.hotspot_password !== '') {
      if (typeof body.hotspot_password !== 'string' || !/^[\x20-\x7e]{8,63}$/.test(body.hotspot_password)) {
        return NextResponse.json({ error: 'Hotspot password must be 8–63 printable ASCII characters' }, { status: 400 });
      }
      allowed.hotspot_password = body.hotspot_password;
    }
    if (allowed.hotspot_ip && (isIP(allowed.hotspot_ip) !== 4 || allowed.hotspot_ip.startsWith('127.') || allowed.hotspot_ip === '0.0.0.0')) {
      return NextResponse.json({ error: 'Enter a valid LAN IPv4 address, or leave it blank for automatic detection' }, { status: 400 });
    }
    const apply = db.transaction(() => {
      for (const [key, value] of Object.entries(allowed)) update.run(key, value);
    });
    apply();
    delete allowed.hotspot_password;
    return NextResponse.json(allowed);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
