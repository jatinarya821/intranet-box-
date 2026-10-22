import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

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
    const db = getDb();
    const { category, title, content } = await request.json();
    if (!category || !title || !content) {
      return NextResponse.json({ error: 'Category, title and content are required' }, { status: 400 });
    }
    const result = db.prepare(
      'INSERT INTO articles (category, title, content) VALUES (?, ?, ?)'
    ).run(category, title, content);
    const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
