'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const styles = {
  critical: ['border-red-500/50', 'bg-red-500/10', '🚨'],
  warning: ['border-amber-500/50', 'bg-amber-500/10', '⚠️'],
  info: ['border-blue-500/50', 'bg-blue-500/10', 'ℹ️'],
  safe: ['border-green-500/50', 'bg-green-500/10', '✅'],
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/alerts');
      if (!response.ok) throw new Error('Failed to load alerts');
      setAlerts(await response.json());
    } catch {
      setError('Failed to load alerts. Check the server connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-3xl mx-auto min-w-0 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100">🚨 Emergency Alerts</h1>
          <p className="text-slate-400 text-sm mt-0.5">Live broadcast announcements · Auto-refreshes every 10s</p>
        </div>
        <Link href="/admin/alerts" className="w-full sm:w-auto px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm font-medium text-center">
          Operator console
        </Link>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
      {loading ? (
        <div className="text-slate-500 text-center py-10">Loading alerts…</div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <div className="text-5xl mb-4">✅</div>
          <div className="font-medium">No active alerts</div>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const [border, background, icon] = styles[alert.severity] || styles.info;
            return (
              <article key={alert.id} className={`rounded-xl border p-4 ${border} ${background}`}>
                <div className="flex items-start gap-3">
                  <span className="text-xl shrink-0">{icon}</span>
                  <div className="min-w-0">
                    <h2 className="font-bold text-slate-100">{alert.title}</h2>
                    <p className="text-slate-300 text-sm mt-1 leading-relaxed break-words">{alert.body}</p>
                    <p className="text-slate-500 text-xs mt-2">{new Date(alert.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
