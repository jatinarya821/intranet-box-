'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import ThemeToggle from '@/components/ThemeToggle';

const navItems = [
  { href: '/', label: 'Command Center', icon: '🏠', badge: null },
  { href: '/alerts', label: 'Emergency Alerts', icon: '🚨', badge: 'Live' },
  { href: '/map', label: 'Offline Map', icon: '🗺️', badge: null },
  { href: '/registry', label: 'Person Registry', icon: '👤', badge: null },
  { href: '/knowledge', label: 'Offline Guides', icon: '📚', badge: null },
  { href: '/inventory', label: 'Supply Inventory', icon: '📦', badge: null },
  { href: '/bulletin', label: 'Bulletin Board', icon: '💬', badge: null },
  { href: '/connect', label: 'Hotspot / QR', icon: '📱', badge: null },
  { href: '/admin', label: 'Camp Settings', icon: '⚙️', badge: null },
  { href: '/admin/alerts', label: 'Alert Operations', icon: '📢', badge: null },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState(0);
  const [campName, setCampName] = useState('Emergency Camp');

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        setActiveAlerts(data.alertCount || 0);
      } catch {}
    };
    fetchStatus();
    fetch('/api/settings').then((res) => res.json()).then((data) => {
      if (data.camp_name) setCampName(data.camp_name);
    }).catch(() => {});
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Mobile Top Header (compact, thumb-friendly) */}
      <header className="md:hidden flex items-center justify-between bg-slate-950/90 backdrop-blur border-b border-slate-800/80 px-4 py-2.5 sticky top-0 z-30 w-full shrink-0">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-sm">
            🚨
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight text-white leading-tight truncate max-w-[46vw]">
              {campName}
            </div>
            <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 leading-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              OFFLINE LAN
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <ThemeToggle />

          {/* Quick QR link for mobile */}
          <Link
            href="/connect"
            aria-label="Scan QR Code"
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs flex items-center gap-1 active:scale-95"
          >
            <span>📱</span>
            <span className="text-[11px] font-medium hidden xs:inline">QR</span>
          </Link>

          {/* All modules drawer toggle */}
          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm active:scale-95"
            aria-label="Open menu drawer"
          >
            {drawerOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>

      {/* Mobile Drawer (full view of all sections) */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
        >
          <nav
            className="w-72 h-full bg-slate-950 border-r border-slate-800 p-5 flex flex-col gap-1 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-800">
              <div>
                <div className="font-bold text-base text-red-400 flex items-center gap-2">
                  <span>🚨</span> IntranetBox
                </div>
                <div className="text-xs text-slate-500">Disaster-Ready Emergency Box</div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1 overflow-y-auto flex-1">
              {navItems.map((item) => {
                const active = pathname === item.href;
                const isAlert = item.href === '/alerts' && activeAlerts > 0;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    {isAlert && (
                      <span className="px-1.5 py-0.5 text-[10px] bg-red-600 text-white rounded-full font-bold">
                        {activeAlerts}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-800 text-xs text-slate-500 space-y-1">
              <div className="flex items-center justify-between">
                <span>Mode:</span>
                <span className="text-emerald-400 font-mono">100% Offline</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Database:</span>
                <span className="text-slate-300 font-mono">SQLite (WAL)</span>
              </div>
            </div>
          </nav>
        </div>
      )}

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-slate-950 border-r border-slate-800/80 p-4 min-h-screen sticky top-0 h-screen overflow-y-auto shrink-0 select-none">
        {/* Brand Header */}
        <div className="mb-6 p-2 rounded-xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/80">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-xl shadow-inner">
              🚨
            </div>
            <div>
              <div className="text-slate-100 font-extrabold text-base tracking-tight leading-none">
                {campName}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Emergency Server</div>
            </div>
          </Link>
          <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              HOTSPOT READY
            </span>
            <span className="text-slate-500 font-mono text-[10px]">v1.2</span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1" aria-label="Desktop Navigation">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const isAlert = item.href === '/alerts' && activeAlerts > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all group ${
                  active
                    ? 'bg-red-500/15 text-red-300 border border-red-500/30 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-base group-hover:scale-110 transition-transform">
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>
                {isAlert && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-red-600 text-white rounded-full animate-pulse">
                    {activeAlerts}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Mission Status Card */}
        <div className="mt-auto pt-4 border-t border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Connectivity</span>
              <span className="text-emerald-400 font-semibold font-mono text-[11px]">
                OFFLINE ONLY
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Theme</span>
              <ThemeToggle />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Server Port</span>
              <span className="text-slate-200 font-mono text-[11px]">3000 (LAN)</span>
            </div>
            <Link
              href="/connect"
              className="block text-center mt-2 py-1.5 px-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-[11px] font-medium transition-colors"
            >
              📱 Show Hotspot QR Code
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
