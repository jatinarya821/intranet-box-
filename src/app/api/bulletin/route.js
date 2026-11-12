import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { hasRole } from '@/lib/auth';

export async function GET() {
  try {
    const db = getDb();
    const posts = db.prepare(
      'SELECT post.*, parent.author AS reply_to_author, parent.message AS reply_to_message FROM bulletin_posts AS post LEFT JOIN bulletin_posts AS parent ON parent.id = post.reply_to_id ORDER BY post.created_at DESC, post.id DESC LIMIT 50'
    ).all();
    return NextResponse.json(posts, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const db = getDb();
    const { author, message } = await request.json();
    if (typeof message !== 'string' || !message.trim()) return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    if (message.length > 500) {
      return NextResponse.json({ error: 'Message must be 500 characters or less' }, { status: 400 });
    }
    const result = db.prepare(
      'INSERT INTO bulletin_posts (author, message) VALUES (?, ?)'
    ).run(typeof author === 'string' && author.trim() ? author.trim().slice(0, 80) : 'Anonymous', message.trim());
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
    const post = db.prepare('SELECT author_role FROM bulletin_posts WHERE id = ?').get(id);
    if (post && ['admin', 'operator'].includes(post.author_role) && !hasRole(request, ['admin', 'operator'])) {
      return NextResponse.json({ error: 'Staff access required to delete a verified post' }, { status: 403 });
    }
    db.prepare('DELETE FROM bulletin_posts WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
