import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { isAdminRequest } from '@/lib/auth';

export async function GET() {
  try {
    const db = getDb();
    const resources = db.prepare('SELECT * FROM resources ORDER BY category, name').all();
    return NextResponse.json(resources);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const db = getDb();
    const { name, category, quantity, unit, location } = await request.json();
    if (!name || !category) {
      return NextResponse.json({ error: 'Name and category are required' }, { status: 400 });
    }
    const result = db.prepare(
      'INSERT INTO resources (name, category, quantity, unit, location) VALUES (?, ?, ?, ?, ?)'
    ).run(name, category, quantity || 0, unit || 'units', location || '');
    const resource = db.prepare('SELECT * FROM resources WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(resource, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const db = getDb();
    const { id, quantity, location } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    const current = db.prepare('SELECT * FROM resources WHERE id = ?').get(id);
    if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const nextQty = Number(quantity);
    db.prepare(
      'UPDATE resources SET quantity = ?, location = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(nextQty, location, id);
    if (current.quantity !== nextQty) {
      db.prepare(
        'INSERT INTO resource_log (resource_id, name, old_qty, new_qty) VALUES (?, ?, ?, ?)'
      ).run(id, current.name, current.quantity, nextQty);
    }
    const resource = db.prepare('SELECT * FROM resources WHERE id = ?').get(id);
    return NextResponse.json(resource);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: 'Admin PIN required' }, { status: 401 });
    }
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    db.prepare('DELETE FROM resources WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
