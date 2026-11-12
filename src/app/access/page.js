'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import PinGate, { adminHeaders, clearAdminToken } from '@/components/PinGate';

const roles = [
  {
    id: 'public',
    label: 'Civilian',
    icon: '👤',
    description: 'Community access for everyone connected to the network.',
    details: ['Read alerts, guides, maps and registry records', 'Check in people and update their status', 'Post notices and add or update inventory'],
    href: '/',
    linkLabel: 'Open dashboard',
  },
  {
    id: 'operator',
    label: 'Alert operator',
    icon: '📢',
    description: 'Staff access for emergency communications.',
    details: ['All civilian actions', 'Broadcast and delete emergency alerts', 'Sign in with the operator PIN'],
    href: '/admin/alerts',
    linkLabel: 'Open alert operations',
  },
  {
    id: 'admin',
    label: 'Administrator',
    icon: '🛡️',
    description: 'Staff access for managing the intranet.',
    details: ['All civilian and alert operator actions', 'Manage settings, map pins, guides and inventory deletion', 'Download a backup, reset data and manage PINs'],
    href: '/admin',
    linkLabel: 'Open camp settings',
  },
];

export default function AccessPage() {
  const router = useRouter();
  const [currentRole, setCurrentRole] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const loadRole = useCallback(() => {
    fetch('/api/auth', { headers: adminHeaders(), cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((session) => {
        setCurrentRole(roles.some((role) => role.id === session.role) ? session.role : 'public');
        setError('');
      })
      .catch(() => {
        setCurrentRole(null);
        setError('Could not check the current access role. Check your connection and try again.');
      });
  }, []);

  useEffect(() => {
    loadRole();
    window.addEventListener('access-role-changed', loadRole);
    return () => window.removeEventListener('access-role-changed', loadRole);
  }, [loadRole]);

  const useCivilianAccess = async () => {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/auth', { method: 'DELETE', headers: adminHeaders() });
      if (!response.ok && response.status !== 401) throw new Error();
      clearAdminToken();
      router.push('/');
    } catch {
      setError('Could not end the staff session. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-red-400">Access roles</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-100">Choose how you use the intranet</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">Everyone starts as a civilian. Staff can enter a PIN to unlock their role on this browser.</p>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-4" aria-live="polite">
        <p className="text-xs uppercase tracking-wider text-slate-400">Current access</p>
        <p className="mt-1 font-semibold text-slate-100">
          {currentRole === null ? 'Checking access…' : roles.find((role) => role.id === currentRole)?.label}
        </p>
        {error && <p className="mt-2 text-sm text-red-400" role="alert">{error}</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {roles.map((role) => (
          <section key={role.id} className={`flex flex-col rounded-xl border p-5 ${currentRole === role.id ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 bg-slate-800/60'}`}>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-slate-100"><span aria-hidden="true">{role.icon}</span> {role.label}</h2>
              {currentRole === role.id && <span className="text-xs font-semibold text-blue-300">Current</span>}
            </div>
            <p className="mt-2 text-sm text-slate-400">{role.description}</p>
            <ul className="my-4 flex-1 space-y-2 text-sm text-slate-300">
              {role.details.map((detail) => <li key={detail} className="flex gap-2"><span aria-hidden="true" className="text-emerald-400">✓</span><span>{detail}</span></li>)}
            </ul>
            {currentRole === role.id ? (
              <Link href={role.href} className="rounded-lg border border-slate-600 px-4 py-2 text-center text-sm font-medium text-slate-100 hover:bg-slate-700">{role.linkLabel} →</Link>
            ) : role.id === 'public' ? (
              <button disabled={busy || currentRole === null} onClick={useCivilianAccess} className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700 disabled:opacity-50">{busy ? 'Ending session…' : 'Switch to civilian'}</button>
            ) : (
              <button disabled={currentRole === null} onClick={() => setSelectedRole(role.id)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50">Sign in as {role.label}</button>
            )}
          </section>
        ))}
      </div>

      <p className="text-xs leading-relaxed text-slate-400">Current access also permits connected users to delete bulletin posts. Registry records, including contact details and notes, are visible to connected users. Share this network accordingly.</p>
      <PinGate
        key={selectedRole || 'closed'}
        open={selectedRole !== null}
        role={selectedRole || 'admin'}
        onClose={() => setSelectedRole(null)}
        onUnlocked={() => {
          const destination = roles.find((role) => role.id === selectedRole)?.href;
          setSelectedRole(null);
          if (destination) router.push(destination);
        }}
      />
    </div>
  );
}
