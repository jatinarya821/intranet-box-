'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PinGate, { adminFetch, hasAdminToken } from '@/components/PinGate';

const severities = ['info', 'warning', 'critical', 'safe'];

export default function AdminAlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [form, setForm] = useState({ title: '', severity: 'info', body: '' });
  const [gateOpen, setGateOpen] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    const response = await fetch('/api/alerts');
    if (!response.ok) throw new Error('Could not load alerts');
    setAlerts(await response.json());
  };

  useEffect(() => {
    setGateOpen(!hasAdminToken());
    load().catch(() => setError('Could not load alerts.'));
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    const response = await adminFetch('/api/alerts', {
      method: 'POST',
      body: JSON.stringify(form),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || 'Could not post alert.');
      return;
    }
    setForm({ title: '', severity: 'info', body: '' });
    setMessage('Alert broadcast successfully.');
    await load();
  };

  const remove = async (id) => {
    if (!confirm('Delete this alert?')) return;
    const response = await adminFetch(`/api/alerts?id=${id}`, { method: 'DELETE' });
    if (!response.ok) {
      setError('Could not delete alert.');
      return;
    }
    await load();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 min-w-0 w-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100">🚨 Alert Operations</h1>
          <p className="text-slate-400 text-sm mt-0.5">Authorized operators can broadcast and remove alerts.</p>
        </div>
        <Link href="/alerts" className="text-sm text-blue-400 hover:text-blue-300">Public view →</Link>
      </div>

      <form onSubmit={submit} className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-slate-100">Broadcast an alert</h2>
        {error && <p className="text-sm text-red-400">{error}</p>}
        {message && <p className="text-sm text-emerald-400">{message}</p>}
        <input
          required
          maxLength={140}
          placeholder="Alert title"
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100"
        />
        <select
          value={form.severity}
          onChange={(event) => setForm({ ...form, severity: event.target.value })}
          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100"
        >
          {severities.map((severity) => <option key={severity}>{severity}</option>)}
        </select>
        <textarea
          required
          maxLength={1000}
          rows={4}
          placeholder="Alert message"
          value={form.body}
          onChange={(event) => setForm({ ...form, body: event.target.value })}
          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100"
        />
        <button className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium">
          Broadcast Alert
        </button>
      </form>

      <div className="space-y-3">
        {alerts.map((alert) => (
          <div key={alert.id} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-100">{alert.title}</p>
              <p className="text-xs text-slate-400 uppercase mt-1">{alert.severity}</p>
              <p className="text-sm text-slate-300 mt-2">{alert.body}</p>
            </div>
            <button onClick={() => remove(alert.id)} className="text-sm text-red-400 hover:text-red-300">Delete</button>
          </div>
        ))}
      </div>

      <PinGate
        open={gateOpen}
        role="operator"
        onClose={() => setGateOpen(false)}
        onUnlocked={() => setGateOpen(false)}
      />
    </div>
  );
}
