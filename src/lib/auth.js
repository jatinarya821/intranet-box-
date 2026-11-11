import crypto from 'crypto';
import getDb from '@/lib/db';

const TOKEN_MS = 12 * 60 * 60 * 1000;

function setting(key) {
  const db = getDb();
  return db.prepare('SELECT value FROM settings WHERE key = ?').get(key)?.value;
}

export function hashPin(pin, salt) {
  return crypto.scryptSync(String(pin), salt, 32).toString('hex');
}

export function verifyPin(pin) {
  const salt = setting('pin_salt');
  const expected = setting('pin_hash');
  if (!salt || !expected || pin == null || String(pin).length < 4) return false;
  const actual = hashPin(pin, salt);
  const a = Buffer.from(actual, 'hex');
  const b = Buffer.from(expected, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function verifyStoredPin(pin, hashKey, saltKey) {
  const salt = setting(saltKey);
  const expected = setting(hashKey);
  if (!salt || !expected || pin == null || String(pin).length < 4) return false;
  const actual = hashPin(pin, salt);
  const a = Buffer.from(actual, 'hex');
  const b = Buffer.from(expected, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function verifyOperatorPin(pin) {
  return verifyStoredPin(pin, 'operator_pin_hash', 'operator_pin_salt');
}

export function setOperatorPin(pin) {
  const next = String(pin || '');
  if (!/^\d{4,8}$/.test(next)) return { error: 'Operator PIN must be 4 to 8 digits' };
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPin(next, salt);
  const db = getDb();
  const update = db.prepare('UPDATE settings SET value = ? WHERE key = ?');
  update.run(salt, 'operator_pin_salt');
  update.run(hash, 'operator_pin_hash');
  return { ok: true };
}

export function issueToken(role = 'admin') {
  const db = getDb();
  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = Date.now() + TOKEN_MS;
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());
  db.prepare('INSERT INTO sessions (token, expires_at, role) VALUES (?, ?, ?)').run(token, expiresAt, role);
  return { token, expiresAt, role };
}

export function getSession(request) {
  const header = request.headers.get('authorization') || '';
  const token = header.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  const db = getDb();
  const row = db.prepare('SELECT token, expires_at, role FROM sessions WHERE token = ?').get(token);
  if (!row || row.expires_at < Date.now()) return null;
  return row;
}

export function isAdminRequest(request) {
  return getSession(request)?.role === 'admin';
}

export function hasRole(request, roles) {
  const role = getSession(request)?.role;
  return Boolean(role && roles.includes(role));
}

export function changePin(currentPin, newPin) {
  if (!verifyPin(currentPin)) return { error: 'Current PIN is wrong' };
  const next = String(newPin || '');
  if (!/^\d{4,8}$/.test(next)) return { error: 'New PIN must be 4 to 8 digits' };
  const db = getDb();
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPin(next, salt);
  const update = db.prepare('UPDATE settings SET value = ? WHERE key = ?');
  const apply = db.transaction(() => {
    update.run(salt, 'pin_salt');
    update.run(hash, 'pin_hash');
    db.prepare('DELETE FROM sessions').run();
  });
  apply();
  return { ok: true, ...issueToken() };
}
