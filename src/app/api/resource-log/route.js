import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
  try {
    const rows = getDb().prepare(
      'SELECT * FROM resource_log ORDER BY id DESC LIMIT 12'
    ).all();
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
