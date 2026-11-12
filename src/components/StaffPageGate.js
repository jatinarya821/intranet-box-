'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { adminHeaders } from '@/components/PinGate';

export default function StaffPageGate({ children, allowedRoles, title }) {
  const [session, setSession] = useState({ status: 'checking' });

  useEffect(() => {
    let active = true;
    const checkAccess = () => {
      fetch('/api/auth', { headers: adminHeaders(), cache: 'no-store' })
        .then((response) => {
          if (!response.ok) throw new Error('Could not check access');
          return response.json();
        })
        .then((data) => {
          if (active) setSession({ status: 'ready', role: data.role });
        })
        .catch(() => {
          if (active) setSession({ status: 'error' });
        });
    };
    checkAccess();
    window.addEventListener('access-role-changed', checkAccess);
    return () => {
      active = false;
      window.removeEventListener('access-role-changed', checkAccess);
    };
  }, []);

  if (session.status === 'checking') {
    return <p className="text-sm text-slate-400">Checking access…</p>;
  }

  if (session.status === 'error') {
    return <p className="text-sm text-red-400" role="alert">Could not check access. Check your connection and refresh the page.</p>;
  }

  if (!allowedRoles.includes(session.role)) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-slate-700 bg-slate-800/60 p-6">
        <h1 className="text-xl font-bold text-slate-100">{title}</h1>
        <p className="mt-2 text-sm text-slate-400">Sign in with an authorized staff PIN to open this page.</p>
        <Link href="/access" className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">Choose a role</Link>
        <Link href="/" className="ml-4 text-sm text-slate-300 hover:text-white">Back to dashboard</Link>
      </div>
    );
  }

  return children;
}
