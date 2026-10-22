'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
    const interval = setInterval(() => {
      fetch('/api/stats').then(r => r.json()).then(setStats).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const modules = [
    {
      href: '/alerts',
      icon: '🚨',
      label: 'Emergency Alerts',
      desc: 'Broadcast critical announcements to all users',
      stat: stats ? `${stats.alertCount} active alerts` : '—',
      color: 'border-red-500/40 hover:border-red-400 bg-red-500/5',
      badge: stats?.alertCount > 0 ? 'red' : null,
    },
    {
      href: '/knowledge',
      icon: '📚',
      label: 'Knowledge Base',
      desc: 'First aid, agriculture, health, disaster SOPs',
      stat: 'Preloaded articles',
      color: 'border-blue-500/40 hover:border-blue-400 bg-blue-500/5',
    },
    {
      href: '/map',
      icon: '🗺️',
      label: 'Offline Map',
      desc: 'Shelter locations, resource points, danger zones',
      stat: 'Interactive map',
      color: 'border-emerald-500/40 hover:border-emerald-400 bg-emerald-500/5',
    },
    {
      href: '/registry',
      icon: '👤',
      label: 'Person Registry',
      desc: 'Check-in survivors, track missing persons',
      stat: stats ? `${stats.personCount} registered${stats.missingCount > 0 ? `, ${stats.missingCount} missing` : ''}` : '—',
      color: 'border-amber-500/40 hover:border-amber-400 bg-amber-500/5',
      badge: stats?.missingCount > 0 ? 'amber' : null,
    },
    {
      href: '/inventory',
      icon: '📦',
      label: 'Resource Inventory',
      desc: 'Track food, water, medicine and equipment',
      stat: stats ? `${stats.resourceCount} resource types` : '—',
      color: 'border-purple-500/40 hover:border-purple-400 bg-purple-500/5',
    },
    {
      href: '/bulletin',
      icon: '💬',
      label: 'Bulletin Board',
      desc: 'Post and read community notices',
      stat: stats ? `${stats.bulletinCount} posts` : '—',
      color: 'border-cyan-500/40 hover:border-cyan-400 bg-cyan-500/5',
    },
    {
      href: '/connect',
      icon: '📱',
      label: 'Connect / QR Code',
      desc: 'Scan to join the network — share with others',
      stat: 'Hotspot access',
      color: 'border-slate-500/40 hover:border-slate-400 bg-slate-500/5',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100 mb-1">
          🚨 Emergency Intranet Portal
        </h1>
        <p className="text-slate-400 text-sm">
          Offline · Local Network · No Internet Required
        </p>
        <div className="flex items-center gap-2 mt-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-500/15 text-green-400 border border-green-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block"></span>
            System Online
          </span>
          <span className="text-xs text-slate-500">{new Date().toLocaleString()}</span>
        </div>
      </div>

      {/* Latest Alert */}
      {stats?.latestAlert && (
        <div className={`mb-6 rounded-xl border p-4 severity-${stats.latestAlert.severity}`}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">
              {stats.latestAlert.severity === 'critical' ? '🚨' :
               stats.latestAlert.severity === 'warning' ? '⚠️' :
               stats.latestAlert.severity === 'info' ? 'ℹ️' : '✅'}
            </span>
            <div>
              <div className="font-bold text-slate-100">{stats.latestAlert.title}</div>
              <div className="text-slate-300 text-sm mt-0.5">{stats.latestAlert.body}</div>
              <Link href="/alerts" className="text-xs text-blue-400 hover:underline mt-1 inline-block">
                View all alerts →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Alerts', value: stats.alertCount, color: 'text-red-400' },
            { label: 'Registered', value: stats.personCount, color: 'text-blue-400' },
            { label: 'Missing', value: stats.missingCount, color: stats.missingCount > 0 ? 'text-amber-400' : 'text-slate-400' },
            { label: 'Bulletin Posts', value: stats.bulletinCount, color: 'text-cyan-400' },
          ].map(s => (
            <div key={s.label} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 text-center">
              <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-slate-400 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Module grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map(mod => (
          <Link
            key={mod.href}
            href={mod.href}
            className={`group relative rounded-xl border p-5 transition-all duration-200 ${mod.color}`}
          >
            {mod.badge && (
              <span className={`absolute top-3 right-3 w-2 h-2 rounded-full animate-pulse
                ${mod.badge === 'red' ? 'bg-red-400' : 'bg-amber-400'}`} />
            )}
            <div className="text-3xl mb-3">{mod.icon}</div>
            <div className="font-semibold text-slate-100 mb-1">{mod.label}</div>
            <div className="text-slate-400 text-xs mb-3 leading-relaxed">{mod.desc}</div>
            <div className="text-xs font-medium text-slate-500">{loading ? '…' : mod.stat}</div>
          </Link>
        ))}
      </div>

      <div className="mt-10 text-center text-xs text-slate-600">
        Disaster-Ready Offline Intranet in a Box · Powered by Next.js + SQLite
      </div>
    </div>
  );
}
