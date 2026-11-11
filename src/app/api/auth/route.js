import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { changePin, issueToken, isAdminRequest, setOperatorPin, verifyOperatorPin, verifyPin } from '@/lib/auth';

export async function GET(request) {
  return NextResponse.json({ unlocked: isAdminRequest(request) });
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (body.action === 'change') {
      const result = changePin(body.currentPin, body.newPin);
      if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json({ token: result.token, expiresAt: result.expiresAt });
    }
    if (body.action === 'set-operator' && isAdminRequest(request)) {
      const result = setOperatorPin(body.pin);
      if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json({ success: true });
    }

    const role = body.role === 'operator' ? 'operator' : 'admin';
    const valid = role === 'operator' ? verifyOperatorPin(body.pin) : verifyPin(body.pin);
    if (!valid) {
      return NextResponse.json({ error: 'Wrong PIN' }, { status: 401 });
    }
    const session = issueToken(role);
    return NextResponse.json(session);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Admin PIN required' }, { status: 401 });
  }
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  getDb().prepare('DELETE FROM sessions WHERE token = ?').run(token);
  return NextResponse.json({ success: true });
}
