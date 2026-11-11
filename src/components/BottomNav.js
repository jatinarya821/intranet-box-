'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import ThemeToggle from '@/components/ThemeToggle';

const mainTabs = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/alerts', label: 'Alerts', icon: '🚨' },
  { href: '/map', label: 'Map', icon: '🗺️' },
  { href: '/registry', label: 'Registry', icon: '👤' },
];

const moreItems = [
  { href: '/knowledge', label: 'Offline Guides', desc: 'First-aid, health, disaster SOPs', icon: '📚' },
  { href: '/inventory', label: 'Supplies & Inventory', desc: 'Food, water, medicine stockpiles', icon: '📦' },
  { href: '/bulletin', label: 'Bulletin Board', desc: 'Community messages & notices', icon: '💬' },
  { href: '/connect', label: 'Wi-Fi Hotspot & QR', desc: 'Network guide & connection QR', icon: '📱' },
  { href: '/admin', label: 'Camp Settings', desc: 'PIN, backup, and camp name', icon: '⚙️' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        setAlertCount(data.alertCount || 0);
      } catch {}
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15000);
    return () => clearInterval(interval);
  }, []);

  // Close sheet on route change
  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  const isMoreActive = moreItems.some((item) => pathname === item.href);

  return (
    <>
      {/* Slide-up "More" drawer overlay for mobile */}
      {moreOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity"
          onClick={() => setMoreOpen(false)}
        >
          <div
            className="absolute bottom-16 inset-x-0 bg-slate-900 border-t border-slate-700/80 rounded-t-2xl p-5 shadow-2xl max-h-[75vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Emergency Modules & Tools
              </span>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <button
                  onClick={() => setMoreOpen(false)}
                  className="text-slate-400 hover:text-slate-200 text-sm px-2 py-1 rounded"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {moreItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3.5 p-3 rounded-xl border transition-all ${
                      active
                        ? 'bg-blue-600/20 border-blue-500/50 text-white'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-2xl p-2 rounded-lg bg-slate-950/60 border border-slate-700/50">
                      {item.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{item.label}</div>
                      <div className="text-xs text-slate-400 truncate">{item.desc}</div>
                    </div>
                    <span className="text-slate-500 text-sm">→</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bottom Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 px-2 py-1.5 safe-bottom w-full"
      >
        <div className="flex items-center justify-around max-w-md mx-auto">
          {mainTabs.map((tab) => {
            const active = pathname === tab.href;
            const isAlertTab = tab.href === '/alerts';
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl min-w-[60px] transition-all active:scale-90 ${
                  active ? 'text-red-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  <span className="text-xl">{tab.icon}</span>
                  {isAlertTab && alertCount > 0 && (
                    <span className="absolute -top-1 -right-2 px-1.5 py-0.2 text-[10px] font-bold bg-red-600 text-white rounded-full ring-2 ring-slate-950 animate-pulse">
                      {alertCount}
                    </span>
                  )}
                </div>
                <span className="text-[11px] mt-0.5 tracking-tight">{tab.label}</span>
                {active && (
                  <span className="w-1 h-1 rounded-full bg-red-500 mt-0.5" />
                )}
              </Link>
            );
          })}

          {/* More trigger */}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl min-w-[60px] transition-all active:scale-90 ${
              isMoreActive || moreOpen
                ? 'text-blue-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="text-xl">{moreOpen ? '✕' : '☰'}</span>
            <span className="text-[11px] mt-0.5 tracking-tight">More</span>
            {isMoreActive && !moreOpen && (
              <span className="w-1 h-1 rounded-full bg-blue-500 mt-0.5" />
            )}
          </button>
        </div>
      </nav>
    </>
  );
}
