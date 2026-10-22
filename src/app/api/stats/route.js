import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const alertCount = db.prepare('SELECT COUNT(*) as count FROM alerts').get().count;
    const personCount = db.prepare('SELECT COUNT(*) as count FROM persons').get().count;
    const missingCount = db.prepare("SELECT COUNT(*) as count FROM persons WHERE status = 'missing'").get().count;
    const resourceCount = db.prepare('SELECT COUNT(*) as count FROM resources').get().count;
    const bulletinCount = db.prepare('SELECT COUNT(*) as count FROM bulletin_posts').get().count;
    const latestAlert = db.prepare('SELECT * FROM alerts ORDER BY created_at DESC LIMIT 1').get();

    return NextResponse.json({
      alertCount,
      personCount,
      missingCount,
      resourceCount,
      bulletinCount,
      latestAlert,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
