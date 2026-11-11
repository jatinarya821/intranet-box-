import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { isAdminRequest } from '@/lib/auth';

const TYPES = new Set(['shelter', 'medical', 'food', 'water', 'danger', 'hq']);

export async function GET() {
  try {
    const db = getDb();
    const pins = db.prepare('SELECT * FROM map_pins ORDER BY id').all();
    return NextResponse.json(pins);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: 'Admin PIN required' }, { status: 401 });
    }
    const body = await request.json();
    const label = String(body.label || '').trim().slice(0, 120);
    const type = String(body.type || '');
    const x = Number(body.x_pct);
    const y = Number(body.y_pct);
    if (!label || !TYPES.has(type) || Number.isNaN(x) || Number.isNaN(y)) {
      return NextResponse.json({ error: 'Label, type, and map position are required' }, { status: 400 });
    }
    const db = getDb();
    const result = db.prepare(
      `INSERT INTO map_pins (label, type, x_pct, y_pct, notes, capacity, current_count)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      label,
      type,
      Math.min(100, Math.max(0, x)),
      Math.min(100, Math.max(0, y)),
      String(body.notes || '').slice(0, 500),
      body.capacity ? Number(body.capacity) : null,
      Number(body.current_count) || 0
    );
    const pin = db.prepare('SELECT * FROM map_pins WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(pin, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: 'Admin PIN required' }, { status: 401 });
    }
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    getDb().prepare('DELETE FROM map_pins WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
