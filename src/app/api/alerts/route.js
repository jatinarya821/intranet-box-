import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { hasRole } from '@/lib/auth';

export async function GET() {
  try {
    const db = getDb();
    const alerts = db.prepare('SELECT * FROM alerts ORDER BY created_at DESC').all();
    return NextResponse.json(alerts);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    if (!hasRole(request, ['admin', 'operator'])) {
      return NextResponse.json({ error: 'Alert operator access required' }, { status: 403 });
    }
    const db = getDb();
    const { title, severity, body } = await request.json();
    if (!title || !body) {
      return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
    }
    if (String(title).length > 140 || String(body).length > 1000) {
      return NextResponse.json({ error: 'Title or message is too long' }, { status: 400 });
    }
    const result = db.prepare(
      'INSERT INTO alerts (title, severity, body) VALUES (?, ?, ?)'
    ).run(title, severity || 'info', body);
    const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(alert, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    if (!hasRole(request, ['admin', 'operator'])) {
      return NextResponse.json({ error: 'Alert operator access required' }, { status: 403 });
    }
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    db.prepare('DELETE FROM alerts WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
