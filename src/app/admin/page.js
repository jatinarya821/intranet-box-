'use client';

import { useEffect, useState } from 'react';
import PinGate, { adminFetch, clearAdminToken, hasAdminToken, saveAdminToken } from '@/components/PinGate';

export default function AdminPage() {
  const [settings, setSettings] = useState({ camp_name: '', hotspot_ip: '', hotspot_ssid: '' });
  const [pinForm, setPinForm] = useState({ currentPin: '', newPin: '', confirm: '' });
  const [operatorPin, setOperatorPin] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [gateOpen, setGateOpen] = useState(false);
  const [pending, setPending] = useState(null);
  const [unlocked, setUnlocked] = useState(false);

  const load = async () => {
    const res = await fetch('/api/settings');
    const data = await res.json();
    setSettings({
      camp_name: data.camp_name || '',
      hotspot_ip: data.hotspot_ip || '',
      hotspot_ssid: data.hotspot_ssid || '',
    });
    setUnlocked(hasAdminToken());
  };

  useEffect(() => { load(); }, []);

  const guard = (action) => {
    if (!hasAdminToken()) {
      setPending(() => action);
      setGateOpen(true);
      return;
    }
    action();
  };

  const saveSettings = (event) => {
    event.preventDefault();
    guard(async () => {
      setError('');
      setMessage('');
      const res = await adminFetch('/api/settings', { method: 'PATCH', body: JSON.stringify(settings) });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not save settings');
        if (res.status === 401) setUnlocked(false);
        return;
      }
      setMessage('Camp settings saved.');
      setUnlocked(true);
    });
  };

  const changePin = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (pinForm.newPin !== pinForm.confirm) {
      setError('New PIN and confirmation do not match');
      return;
    }
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'change', currentPin: pinForm.currentPin, newPin: pinForm.newPin }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Could not change PIN');
      return;
    }
    saveAdminToken(data.token);
    setPinForm({ currentPin: '', newPin: '', confirm: '' });
    setMessage('PIN updated. This browser stays unlocked.');
    setUnlocked(true);
  };

  const changeOperatorPin = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    const res = await adminFetch('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'set-operator', pin: operatorPin }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Could not set operator PIN');
      return;
    }
    setOperatorPin('');
    setMessage('Alert operator PIN updated.');
  };

  const exportData = () => {
    guard(async () => {
      setError('');
      const res = await adminFetch('/api/admin', { method: 'POST', body: JSON.stringify({ action: 'export' }) });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Export failed');
        return;
      }
      const dump = await res.json();
      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `intranet-backup-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setMessage('Backup downloaded.');
    });
  };

  const resetData = () => {
    if (!confirm('Wipe alerts, people, inventory, notices, and map pins, then restore the starter data?')) return;
    guard(async () => {
      const res = await adminFetch('/api/admin', { method: 'POST', body: JSON.stringify({ action: 'reset' }) });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Reset failed');
        return;
      }
      setMessage('Operational data was reset. Camp name and PIN were kept.');
    });
  };

  const lock = async () => {
    await adminFetch('/api/auth', { method: 'DELETE' });
    clearAdminToken();
    setUnlocked(false);
    setMessage('This browser is locked.');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 min-w-0 w-full">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-red-400">🛡️ Staff role · Administrator</div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100">⚙️ Camp Settings</h1>
          <p className="text-slate-400 text-sm mt-0.5">Administrator-only controls for identity, security, backups, and reset.</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full border ${unlocked ? 'text-emerald-300 border-emerald-500/40' : 'text-slate-400 border-slate-600'}`}>
          {unlocked ? 'Unlocked' : 'Locked'}
        </span>
      </div>

      {message && <p className="text-sm text-emerald-300">{message}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      <form onSubmit={saveSettings} className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-slate-100">Camp identity</h2>
        <label className="block text-xs text-slate-400">
          Camp name
          <input
            className="mt-1 w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100"
            value={settings.camp_name}
            onChange={(event) => setSettings((current) => ({ ...current, camp_name: event.target.value }))}
            required
          />
        </label>
        <label className="block text-xs text-slate-400">
          Hotspot SSID
          <input
            className="mt-1 w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100"
            value={settings.hotspot_ssid}
            onChange={(event) => setSettings((current) => ({ ...current, hotspot_ssid: event.target.value }))}
          />
        </label>
        <label className="block text-xs text-slate-400">
          Hotspot IP shown to visitors
          <input
            className="mt-1 w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100"
            value={settings.hotspot_ip}
            onChange={(event) => setSettings((current) => ({ ...current, hotspot_ip: event.target.value }))}
          />
        </label>
        <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium">
          Save settings
        </button>
      </form>

      <form onSubmit={changePin} className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-slate-100">Change admin PIN</h2>
        <p className="text-xs text-slate-500">Use 4 to 8 digits. The first PIN on a new database is 1234.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {['currentPin', 'newPin', 'confirm'].map((field) => (
            <input
              key={field}
              type="password"
              inputMode="numeric"
              placeholder={field === 'currentPin' ? 'Current PIN' : field === 'newPin' ? 'New PIN' : 'Confirm PIN'}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100"
              value={pinForm[field]}
              onChange={(event) => setPinForm((current) => ({ ...current, [field]: event.target.value }))}
              required
            />
          ))}
        </div>
        <button type="submit" className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium">
          Update PIN
        </button>
      </form>

      <form onSubmit={changeOperatorPin} className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-slate-100">Alert operator access</h2>
        <p className="text-xs text-slate-500">Operators can broadcast and delete alerts, but cannot change camp settings or reset data.</p>
        <input
          type="password"
          inputMode="numeric"
          pattern="[0-9]{4,8}"
          minLength={4}
          maxLength={8}
          placeholder="Operator PIN (4–8 digits)"
          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100"
          value={operatorPin}
          onChange={(event) => setOperatorPin(event.target.value)}
          required
        />
        <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium">
          Save operator PIN
        </button>
      </form>

      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 space-y-3">
        <h2 className="font-semibold text-slate-100">Backup and reset</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <button onClick={exportData} className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm">
            Download JSON backup
          </button>
          <button onClick={resetData} className="px-4 py-2 rounded-lg bg-red-600/80 hover:bg-red-500 text-white text-sm">
            Reset operational data
          </button>
          <button onClick={lock} className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm">
            Lock this browser
          </button>
        </div>
      </div>

      <PinGate
        open={gateOpen}
        onClose={() => { setGateOpen(false); setPending(null); }}
        onUnlocked={() => {
          setGateOpen(false);
          setUnlocked(true);
          const action = pending;
          setPending(null);
          if (action) action();
        }}
      />
    </div>
  );
}
