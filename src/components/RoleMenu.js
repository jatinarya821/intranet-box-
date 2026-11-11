'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { adminHeaders, clearAdminToken, hasAdminToken } from '@/components/PinGate';

const roles = {
  public: { label: 'Civilian access', icon: '👤', color: 'text-slate-300' },
  operator: { label: 'Alert operator', icon: '📢', color: 'text-amber-300' },
  admin: { label: 'Administrator', icon: '🛡️', color: 'text-red-300' },
};

export default function RoleMenu() {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState('public');
  const menuRef = useRef(null);
  const current = roles[role];

  useEffect(() => {
    const loadRole = () => {
      fetch('/api/auth', { headers: adminHeaders() })
        .then((response) => response.json())
        .then((data) => setRole(data.role || 'public'))
        .catch(() => setRole('public'));
    };
    loadRole();
    window.addEventListener('access-role-changed', loadRole);
    return () => window.removeEventListener('access-role-changed', loadRole);
  }, []);

  useEffect(() => {
    const close = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const signOut = async () => {
    await fetch('/api/auth', { method: 'DELETE', headers: adminHeaders() });
    clearAdminToken();
    setRole('public');
    setOpen(false);
  };

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        onClick={() => setOpen(!open)}
        aria-label="Open access profile menu"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-1.5 sm:px-2.5 py-1.5 text-left hover:bg-slate-700 transition-colors"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-sm">{current.icon}</span>
        <span className={`hidden sm:block text-xs font-semibold ${current.color}`}>{current.label}</span>
        <span className="text-xs text-slate-400">⌄</span>
      </button>

      {open && (
        <div className="fixed right-2 top-14 z-[70] w-[calc(100vw-1rem)] max-w-64 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-2xl sm:absolute sm:right-0 sm:top-full sm:mt-2">
          <div className="border-b border-slate-800 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Current access</p>
            <p className={`mt-1 text-sm font-semibold ${current.color}`}>{current.icon} {current.label}</p>
          </div>
          <Link href="/alerts" onClick={() => setOpen(false)} className="mt-1 block rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">
            👤 Civilian / public view
            <span className="block text-xs text-slate-500">Read alerts, guides, map, and registry</span>
          </Link>
          <Link href="/admin/alerts" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-amber-300 hover:bg-slate-800">
            📢 Alert operator
            <span className="block text-xs text-slate-500">Broadcast and manage alerts</span>
          </Link>
          <Link href="/admin" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-red-300 hover:bg-slate-800">
            🛡️ Administrator
            <span className="block text-xs text-slate-500">PIN, settings, backup, and reset</span>
          </Link>
          {hasAdminToken() && (
            <button onClick={signOut} className="mt-1 w-full border-t border-slate-800 px-3 pt-2 text-left text-xs text-slate-400 hover:text-white">
              Lock this access session
            </button>
          )}
        </div>
      )}
    </div>
  );
}
