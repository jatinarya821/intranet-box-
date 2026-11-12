import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request) {
  try {
    const role = getSession(request)?.role;
    if (!['admin', 'operator'].includes(role)) {
      return NextResponse.json({ error: 'Sign in as an administrator or operator to post as staff.' }, { status: 401 });
    }
    const { message, replyToId } = await request.json();
    if (typeof message !== 'string' || !message.trim() || message.length > 500) {
      return NextResponse.json({ error: 'Enter a message of up to 500 characters.' }, { status: 400 });
    }
    const db = getDb();
    let replyId = null;
    if (replyToId != null) {
      if (!Number.isSafeInteger(replyToId) || replyToId <= 0 ||
          !db.prepare('SELECT id FROM bulletin_posts WHERE id = ?').get(replyToId)) {
        return NextResponse.json({ error: 'The notice you are replying to no longer exists.' }, { status: 400 });
      }
      replyId = replyToId;
    }
    const author = role === 'admin' ? 'Administrator' : 'Operator';
    const result = db.prepare(
      'INSERT INTO bulletin_posts (author, message, author_role, reply_to_id) VALUES (?, ?, ?, ?)'
    ).run(author, message.trim(), role, replyId);
    return NextResponse.json({ id: Number(result.lastInsertRowid) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Could not post the staff message.' }, { status: 500 });
  }
}
