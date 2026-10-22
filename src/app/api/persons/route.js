import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    if (search) {
      const persons = db.prepare(
        `SELECT * FROM persons WHERE name LIKE ? OR contact LIKE ? OR location LIKE ? ORDER BY created_at DESC`
      ).all(`%${search}%`, `%${search}%`, `%${search}%`);
      return NextResponse.json(persons);
    }

    const persons = db.prepare('SELECT * FROM persons ORDER BY created_at DESC').all();
    return NextResponse.json(persons);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const db = getDb();
    const { name, age, status, location, contact, notes } = await request.json();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    const result = db.prepare(
      'INSERT INTO persons (name, age, status, location, contact, notes) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(name, age || null, status || 'safe', location || '', contact || '', notes || '');
    const person = db.prepare('SELECT * FROM persons WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(person, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const db = getDb();
    const { id, status, location, notes } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    db.prepare(
      'UPDATE persons SET status = ?, location = ?, notes = ? WHERE id = ?'
    ).run(status, location, notes, id);
    const person = db.prepare('SELECT * FROM persons WHERE id = ?').get(id);
    return NextResponse.json(person);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
