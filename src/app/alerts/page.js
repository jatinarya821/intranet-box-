'use client';
import { useEffect, useState } from 'react';

const SEVERITIES = ['info', 'warning', 'critical', 'safe'];

const SEVERITY_STYLES = {
  critical: { border: 'border-red-500/50',   bg: 'bg-red-500/10',   badge: 'bg-red-500/20 text-red-300 border-red-500/40',   icon: '🚨', label: 'CRITICAL' },
  warning:  { border: 'border-amber-500/50', bg: 'bg-amber-500/10', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40', icon: '⚠️', label: 'WARNING' },
  info:     { border: 'border-blue-500/50',  bg: 'bg-blue-500/10',  badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',   icon: 'ℹ️', label: 'INFO' },
  safe:     { border: 'border-green-500/50', bg: 'bg-green-500/10', badge: 'bg-green-500/20 text-green-300 border-green-500/40', icon: '✅', label: 'SAFE' },
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', severity: 'info', body: '' });
  const [posting, setPosting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/alerts');
      const data = await res.json();
      setAlerts(data);
    } catch (e) {
      setError('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  const handlePost = async (e) => {
    e.preventDefault();
    setPosting(true);
    setError('');
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to post');
      setForm({ title: '', severity: 'info', body: '' });
      setShowForm(false);
      await fetchAlerts();
    } catch (e) {
      setError('Failed to post alert');
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this alert?')) return;
    await fetch(`/api/alerts?id=${id}`, { method: 'DELETE' });
    await fetchAlerts();
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">🚨 Emergency Alerts</h1>
          <p className="text-slate-400 text-sm mt-0.5">Broadcast urgent announcements · Auto-refreshes every 10s</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors"
        >
          {showForm ? '✕ Cancel' : '+ Post Alert'}
        </button>
      </div>

      {/* Post Form */}
      {showForm && (
        <form onSubmit={handlePost} className="mb-6 bg-slate-800/60 border border-slate-700 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-slate-200">New Alert</h2>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div>
            <label className="text-xs text-slate-400 block mb-1">Title *</label>
            <input
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
              placeholder="Alert title..."
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Severity</label>
            <div className="flex gap-2 flex-wrap">
              {SEVERITIES.map(s => {
                const st = SEVERITY_STYLES[s];
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, severity: s }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${st.badge}
                      ${form.severity === s ? 'ring-2 ring-white/30 scale-105' : 'opacity-60 hover:opacity-90'}`}
                  >
                    {st.icon} {st.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Message *</label>
            <textarea
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500 resize-none"
              rows={3}
              placeholder="Alert details..."
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              required
            />
          </div>
          <button
            type="submit"
            disabled={posting}
            className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {posting ? 'Posting…' : '🚨 Broadcast Alert'}
          </button>
        </form>
      )}

      {/* Alerts List */}
      {loading ? (
        <div className="text-slate-500 text-center py-10">Loading alerts…</div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <div className="text-5xl mb-4">✅</div>
          <div className="font-medium">No active alerts</div>
          <div className="text-sm mt-1">Post an alert using the button above</div>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => {
            const st = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.info;
            return (
              <div key={alert.id} className={`rounded-xl border p-4 ${st.border} ${st.bg}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="text-xl shrink-0 mt-0.5">{st.icon}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-100">{alert.title}</span>
                        <span className={`text-xs px-2 py-0.5 rounded border font-medium ${st.badge}`}>
                          {st.label}
                        </span>
                      </div>
                      <p className="text-slate-300 text-sm mt-1 leading-relaxed">{alert.body}</p>
                      <p className="text-slate-500 text-xs mt-2">
                        {new Date(alert.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(alert.id)}
                    className="shrink-0 text-slate-500 hover:text-red-400 transition-colors text-lg"
                    title="Delete alert"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
