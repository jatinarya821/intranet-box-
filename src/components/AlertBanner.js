'use client';
import { useEffect, useState } from 'react';

const SEVERITY_COLORS = {
  critical: 'bg-red-600 text-white',
  warning:  'bg-amber-500 text-black',
  info:     'bg-blue-600 text-white',
  safe:     'bg-green-600 text-white',
};

export default function AlertBanner() {
  const [latestAlert, setLatestAlert] = useState(null);
  const [dismissed, setDismissed] = useState(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch('/api/alerts');
        const data = await res.json();
        if (data.length > 0) {
          const top = data[0];
          if (top.id !== dismissed) {
            setLatestAlert(top);
          }
        }
      } catch {}
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000); // poll every 10s
    return () => clearInterval(interval);
  }, [dismissed]);

  if (!latestAlert || latestAlert.id === dismissed) return null;

  const colorClass = SEVERITY_COLORS[latestAlert.severity] || SEVERITY_COLORS.info;

  return (
    <div className={`flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-medium ${colorClass} sticky top-0 z-50`}>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="shrink-0">
          {latestAlert.severity === 'critical' ? '🚨' :
           latestAlert.severity === 'warning'  ? '⚠️' :
           latestAlert.severity === 'info'     ? 'ℹ️' : '✅'}
        </span>
        <span className="truncate font-bold">{latestAlert.title}</span>
        <span className="hidden md:block truncate opacity-90">— {latestAlert.body}</span>
      </div>
      <button
        onClick={() => setDismissed(latestAlert.id)}
        className="shrink-0 opacity-80 hover:opacity-100 text-lg"
      >
        ✕
      </button>
    </div>
  );
}
