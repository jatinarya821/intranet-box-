import { NextResponse } from 'next/server';
import getDb, { reseedOperational } from '@/lib/db';
import { isAdminRequest } from '@/lib/auth';

export async function POST(request) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: 'Admin PIN required' }, { status: 401 });
    }
    const { action } = await request.json();
    const db = getDb();

    if (action === 'export') {
      const dump = {
        exported_at: new Date().toISOString(),
        alerts: db.prepare('SELECT * FROM alerts').all(),
        articles: db.prepare('SELECT id, category, title, created_at FROM articles').all(),
        persons: db.prepare('SELECT * FROM persons').all(),
        resources: db.prepare('SELECT * FROM resources').all(),
        bulletin_posts: db.prepare('SELECT * FROM bulletin_posts').all(),
        map_pins: db.prepare('SELECT * FROM map_pins').all(),
        resource_log: db.prepare('SELECT * FROM resource_log ORDER BY id DESC LIMIT 200').all(),
        settings: db.prepare(
          "SELECT key, value FROM settings WHERE key NOT IN ('pin_hash', 'pin_salt', 'operator_pin_hash', 'operator_pin_salt', 'hotspot_password')"
        ).all(),
      };
      return NextResponse.json(dump);
    }

    if (action === 'reset') {
      reseedOperational();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
