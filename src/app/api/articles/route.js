import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { isAdminRequest } from '@/lib/auth';

const CATEGORIES = new Set(['First Aid', 'Agriculture', 'Health', 'Disaster SOPs', 'Sanitation', 'Child Safety', 'Legal Rights']);

function validateArticle(body) {
  const names = ['category', 'title', 'content', 'source_title', 'source_url', 'reviewed_by', 'review_date'];
  if (!body || names.some((key) => body[key] != null && typeof body[key] !== 'string')) {
    return { error: 'Article fields must be text' };
  }
  const data = Object.fromEntries(names.map((key) => [key, (body[key] || '').trim()]));
  if (!CATEGORIES.has(data.category) || !data.title || !data.content) return { error: 'Category, title and content are required' };
  if (data.title.length > 160 || data.content.length > 8000 || data.source_title.length > 300 ||
      data.source_url.length > 2048 || data.reviewed_by.length > 160) {
    return { error: 'One or more fields are too long' };
  }
  if (data.source_url) {
    try {
      const url = new URL(data.source_url);
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error();
    } catch {
      return { error: 'Enter a valid HTTP or HTTPS source link' };
    }
    if (!data.source_title) return { error: 'Enter a source name with the source link' };
  }
  if (data.review_date || data.reviewed_by) {
    const date = new Date(data.review_date + 'T00:00:00Z');
    if (!data.source_title || !data.reviewed_by || !/^\d{4}-\d{2}-\d{2}$/.test(data.review_date) ||
        Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== data.review_date ||
        data.review_date > new Date().toISOString().slice(0, 10)) {
      return { error: 'A recorded review needs a source, reviewer and valid date that is not in the future' };
    }
    if (body.review_confirmed !== true) return { error: 'Confirm that the named reviewer reviewed this version' };
  }
  return { data };
}

export async function GET(request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const id = searchParams.get('id');

    if (id) {
      const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(id);
      if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(article);
    }

    if (category) {
      const articles = db.prepare(
        'SELECT * FROM articles WHERE category = ? ORDER BY created_at DESC'
      ).all(category);
      return NextResponse.json(articles);
    }

    const articles = db.prepare('SELECT * FROM articles ORDER BY category, created_at DESC').all();
    return NextResponse.json(articles);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: 'Admin PIN required' }, { status: 401 });
    }
    const db = getDb();
    const { data, error } = validateArticle(await request.json());
    if (error) return NextResponse.json({ error }, { status: 400 });
    const result = db.prepare(
      'INSERT INTO articles (category, title, content, source_title, source_url, reviewed_by, review_date) VALUES (@category, @title, @content, @source_title, @source_url, @reviewed_by, @review_date)'
    ).run(data);
    const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    if (!isAdminRequest(request)) return NextResponse.json({ error: 'Admin PIN required' }, { status: 401 });
    const body = await request.json();
    if (!Number.isSafeInteger(body.id) || body.id <= 0) return NextResponse.json({ error: 'Valid article ID required' }, { status: 400 });
    const { data, error } = validateArticle(body);
    if (error) return NextResponse.json({ error }, { status: 400 });
    const db = getDb();
    const result = db.prepare(
      'UPDATE articles SET category = @category, title = @title, content = @content, source_title = @source_title, source_url = @source_url, reviewed_by = @reviewed_by, review_date = @review_date WHERE id = @id'
    ).run({ ...data, id: body.id });
    if (!result.changes) return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
    return NextResponse.json(db.prepare('SELECT * FROM articles WHERE id = ?').get(body.id));
  } catch {
    return NextResponse.json({ error: 'Could not save guide' }, { status: 500 });
  }
}
