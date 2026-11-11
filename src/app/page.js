'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error('Failed to load stats', err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
    const interval = setInterval(loadStats, 12000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateTime = () => setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const quickActions = [
    {
      title: 'Check-In as Safe',
      desc: 'Register yourself or find loved ones',
      href: '/registry',
      icon: '👤',
      bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20',
      actionText: 'Register Now',
    },
    {
      title: 'Find Shelters & Water',
      desc: 'View relief zones and danger roads',
      href: '/map',
      icon: '🗺️',
      bg: 'bg-blue-500/10 border-blue-500/30 text-blue-300 hover:bg-blue-500/20',
      actionText: 'Open Map',
    },
    {
      title: 'Emergency First Aid',
      desc: 'CPR, bleeding, and snakebite SOPs',
      href: '/knowledge',
      icon: '🩺',
      bg: 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20',
      actionText: 'Read Guides',
    },
    {
      title: 'Broadcast Alert',
      desc: 'Publish urgent hazard warnings',
      href: '/alerts',
      icon: '🚨',
      bg: 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20',
      actionText: 'Post Notice',
    },
  ];

  const primaryModules = [
    {
      href: '/alerts',
      icon: '🚨',
      title: 'Emergency Alerts',
      desc: 'Broadcast critical advisories to all devices connected to the hotspot.',
      stat: stats ? `${stats.alertCount} Active Alert${stats.alertCount !== 1 ? 's' : ''}` : '...',
      border: 'border-red-500/30 hover:border-red-400/60 bg-gradient-to-b from-red-950/20 to-slate-900/60',
      badge: stats?.alertCount > 0 ? `${stats.alertCount} ACTIVE` : 'CLEAR',
      badgeColor: stats?.alertCount > 0 ? 'bg-red-500/20 text-red-300 border-red-500/40' : 'bg-slate-800 text-slate-400 border-slate-700',
    },
    {
      href: '/registry',
      icon: '👤',
      title: 'Person Registry',
      desc: 'Survivor check-in database and searchable missing persons tracker.',
      stat: stats ? `${stats.personCount} Registered` : '...',
      border: 'border-blue-500/30 hover:border-blue-400/60 bg-gradient-to-b from-blue-950/20 to-slate-900/60',
      badge: stats?.missingCount > 0 ? `${stats.missingCount} MISSING` : 'TRACKED',
      badgeColor: stats?.missingCount > 0 ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    },
    {
      href: '/map',
      icon: '🗺️',
      title: 'Offline Field Map',
      desc: 'Interactive vector map of shelters, medical camps, food points, and hazard zones.',
      stat: '9 Relief Locations Pinpointed',
      border: 'border-emerald-500/30 hover:border-emerald-400/60 bg-gradient-to-b from-emerald-950/20 to-slate-900/60',
      badge: 'INTERACTIVE',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    },
    {
      href: '/inventory',
      icon: '📦',
      title: 'Supply Inventory',
      desc: 'Stockpile monitoring for drinking water, rations, paracetamol, and tents.',
      stat: stats ? `${stats.resourceCount} Supplies Logged` : '...',
      border: 'border-purple-500/30 hover:border-purple-400/60 bg-gradient-to-b from-purple-950/20 to-slate-900/60',
      badge: 'STOCK STATUS',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    },
  ];

  const secondaryModules = [
    {
      href: '/knowledge',
      icon: '📚',
      title: 'Offline Knowledge Base',
      desc: '11 verified protocols for first aid, flood crop recovery, water purification, and camp setups.',
      stat: '11 Guides Preloaded',
      border: 'border-cyan-500/30 hover:border-cyan-400/60 bg-gradient-to-b from-cyan-950/20 to-slate-900/60',
    },
    {
      href: '/bulletin',
      icon: '💬',
      title: 'Community Bulletin',
      desc: 'Decentralized message board for residents to exchange needs and reunification messages.',
      stat: stats ? `${stats.bulletinCount} Public Messages` : '...',
      border: 'border-amber-500/30 hover:border-amber-400/60 bg-gradient-to-b from-amber-950/20 to-slate-900/60',
    },
    {
      href: '/connect',
      icon: '📱',
      title: 'Hotspot QR & Access',
      desc: 'Instantly connect new phones to this Wi-Fi node with dynamic QR codes.',
      stat: 'Wi-Fi / LAN Gateway',
      border: 'border-slate-600/40 hover:border-slate-400 bg-gradient-to-b from-slate-900 to-slate-950',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
      {/* Tactical Top Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-5 sm:p-7 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/5 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Autonomous Node Live
              </span>
              <span className="text-xs text-slate-400 font-mono">
                SSID: <strong className="text-slate-200">EMERGENCY-NET</strong>
              </span>
              {currentTime && (
                <span className="text-xs text-slate-500 font-mono">
                  · {currentTime}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Disaster-Ready Intranet in a Box
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed">
              Local offline emergency network. All guides, survivor lists, resource counts, and maps are stored locally on this machine with zero dependence on the internet.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/connect"
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs sm:text-sm font-semibold transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>📱</span> Connect Others
            </Link>
          </div>
        </div>
      </section>

      {/* Immediate Response 1-Tap Quick Action Row */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <span>⚡</span> Priority Field Actions
          </h2>
          <span className="text-[11px] text-slate-500">Tap for instant navigation</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className={`p-3.5 sm:p-4 rounded-xl border transition-all active:scale-95 flex flex-col justify-between ${action.bg}`}
            >
              <div>
                <span className="text-2xl sm:text-3xl mb-2 block">{action.icon}</span>
                <div className="font-bold text-xs sm:text-sm text-slate-100">{action.title}</div>
                <div className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-snug">
                  {action.desc}
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-semibold">
                <span>{action.actionText}</span>
                <span>→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Live System Metrics Bar */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Active Alerts', val: stats?.alertCount ?? 0, color: 'text-red-400', border: 'border-red-500/20' },
          { label: 'Registered Citizens', val: stats?.personCount ?? 0, color: 'text-blue-400', border: 'border-blue-500/20' },
          { label: 'Reported Missing', val: stats?.missingCount ?? 0, color: (stats?.missingCount || 0) > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-400', border: 'border-amber-500/20' },
          { label: 'Relief Resources', val: stats?.resourceCount ?? 0, color: 'text-purple-400', border: 'border-purple-500/20' },
        ].map((metric) => (
          <div
            key={metric.label}
            className={`p-3.5 sm:p-4 rounded-xl bg-slate-900/60 border ${metric.border} backdrop-blur flex flex-col items-center justify-center text-center`}
          >
            <div className={`text-2xl sm:text-3xl font-black ${metric.color}`}>
              {loading ? '...' : metric.val}
            </div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mt-1">
              {metric.label}
            </div>
          </div>
        ))}
      </section>

      {/* Latest Incident / Alert Highlight */}
      {stats?.latestAlert && (
        <section
          className={`rounded-2xl border p-4 sm:p-5 transition-all severity-${stats.latestAlert.severity}`}
        >
          <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
            <div className="flex items-start gap-3.5">
              <span className="text-3xl sm:text-4xl shrink-0 mt-0.5">
                {stats.latestAlert.severity === 'critical' ? '🚨' :
                 stats.latestAlert.severity === 'warning' ? '⚠️' :
                 stats.latestAlert.severity === 'info' ? 'ℹ️' : '✅'}
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-base sm:text-lg text-white">
                    {stats.latestAlert.title}
                  </span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-black/40 border border-white/20">
                    Latest Broadcast
                  </span>
                </div>
                <p className="text-slate-200 text-xs sm:text-sm mt-1 leading-relaxed max-w-3xl">
                  {stats.latestAlert.body}
                </p>
                <div className="text-[11px] text-slate-400 mt-2">
                  Broadcasted: {new Date(stats.latestAlert.created_at).toLocaleString()}
                </div>
              </div>
            </div>
            <Link
              href="/alerts"
              className="px-3 py-1.5 rounded-lg bg-black/30 hover:bg-black/50 border border-white/20 text-xs font-semibold text-slate-200 shrink-0 self-start sm:self-center"
            >
              All Alerts ({stats.alertCount}) →
            </Link>
          </div>
        </section>
      )}

      {/* Primary Emergency Operations Grid */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Primary Emergency Operations
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
          {primaryModules.map((mod) => (
            <Link
              key={mod.href}
              href={mod.href}
              className={`group p-4 sm:p-5 rounded-2xl border transition-all active:scale-[0.98] ${mod.border}`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-3xl p-2 rounded-xl bg-slate-950/70 border border-white/5 group-hover:scale-110 transition-transform">
                  {mod.icon}
                </span>
                {mod.badge && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${mod.badgeColor}`}>
                    {mod.badge}
                  </span>
                )}
              </div>
              <h3 className="font-bold text-base text-white group-hover:text-red-400 transition-colors">
                {mod.title}
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {mod.desc}
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-medium text-slate-300">
                <span className="text-slate-500 font-mono text-[11px]">{mod.stat}</span>
                <span className="group-hover:translate-x-1 transition-transform text-red-400">Launch Module →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Secondary Resources & Tools Grid */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Field Reference & Community Tools
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {secondaryModules.map((mod) => (
            <Link
              key={mod.href}
              href={mod.href}
              className={`group p-4 rounded-xl border transition-all active:scale-[0.98] ${mod.border}`}
            >
              <div className="text-2xl mb-2">{mod.icon}</div>
              <h3 className="font-bold text-sm text-slate-100 group-hover:text-blue-300 transition-colors">
                {mod.title}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                {mod.desc}
              </p>
              <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                <span>{mod.stat}</span>
                <span className="text-slate-400 group-hover:text-white">→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer System Status Banner */}
      <footer className="rounded-xl p-4 bg-slate-900/40 border border-slate-800/70 text-center text-xs text-slate-500 space-y-1">
        <div>
          Autonomous Emergency Server Node · Offline SQLite Store · Local Hotspot Mode
        </div>
        <div className="text-[11px] text-slate-600">
          Connected devices only need a browser · Zero internet or mobile data charges
        </div>
      </footer>
    </div>
  );
}
