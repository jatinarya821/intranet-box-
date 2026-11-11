'use client';

import { useState } from 'react';

const KEY = 'intranet_admin_token';

export function adminHeaders(extra = {}) {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem(KEY) : '';
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

export function clearAdminToken() {
  sessionStorage.removeItem(KEY);
}

export function hasAdminToken() {
  return Boolean(sessionStorage.getItem(KEY));
}

export function saveAdminToken(token) {
  sessionStorage.setItem(KEY, token);
}

export async function adminFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: adminHeaders(options.headers),
  });
  if (res.status === 401) clearAdminToken();
  return res;
}

export default function PinGate({ open, onClose, onUnlocked }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Wrong PIN');
        return;
      }
      saveAdminToken(data.token);
      setPin('');
      onUnlocked();
    } catch {
      setError('Could not reach the server');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl">
        <h2 className="text-lg font-bold text-slate-100">Admin PIN</h2>
        <p className="text-sm text-slate-400 mt-1">This action is limited to camp operators. The default PIN is 1234 until it is changed in Settings.</p>
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={pin}
          onChange={(event) => setPin(event.target.value)}
          className="mt-4 w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 tracking-widest focus:outline-none focus:border-blue-500"
          placeholder="PIN"
          required
        />
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-medium"
          >
            {busy ? 'Checking…' : 'Unlock'}
          </button>
        </div>
      </form>
    </div>
  );
}
