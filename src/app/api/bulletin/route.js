import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const posts = db.prepare('SELECT * FROM bulletin_posts ORDER BY created_at DESC LIMIT 50').all();
    return NextResponse.json(posts);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const db = getDb();
    const { author, message } = await request.json();
    if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    const result = db.prepare(
      'INSERT INTO bulletin_posts (author, message) VALUES (?, ?)'
    ).run(author || 'Anonymous', message);
    const post = db.prepare('SELECT * FROM bulletin_posts WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    db.prepare('DELETE FROM bulletin_posts WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
