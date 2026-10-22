'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const navItems = [
  { href: '/',           label: 'Dashboard',     icon: '🏠' },
  { href: '/alerts',    label: 'Alerts',         icon: '🚨' },
  { href: '/knowledge', label: 'Knowledge Base', icon: '📚' },
  { href: '/map',       label: 'Offline Map',    icon: '🗺️' },
  { href: '/registry',  label: 'Person Registry',icon: '👤' },
  { href: '/inventory', label: 'Inventory',      icon: '📦' },
  { href: '/bulletin',  label: 'Bulletin Board', icon: '💬' },
  { href: '/connect',   label: 'Connect / QR',   icon: '📱' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between bg-slate-900 border-b border-slate-700 px-4 py-3 sticky top-0 z-40">
        <span className="font-bold text-red-400 text-lg">🚨 IntranetBox</span>
        <button onClick={() => setOpen(!open)} className="text-slate-300 text-2xl">
          {open ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/60" onClick={() => setOpen(false)}>
          <nav className="w-64 h-full bg-slate-900 border-r border-slate-700 p-4 flex flex-col gap-1"
               onClick={e => e.stopPropagation()}>
            <SidebarContent pathname={pathname} onNav={() => setOpen(false)} />
          </nav>
        </div>
      )}

      {/* Desktop sidebar */}
      <nav className="hidden md:flex w-60 flex-col bg-slate-900 border-r border-slate-700/60 p-4 gap-1 min-h-screen sticky top-0 h-screen overflow-y-auto">
        <div className="mb-6">
          <div className="text-red-400 font-bold text-xl">🚨 IntranetBox</div>
          <div className="text-slate-500 text-xs mt-1">Offline Emergency Portal</div>
        </div>
        <SidebarContent pathname={pathname} />
      </nav>
    </>
  );
}

function SidebarContent({ pathname, onNav }) {
  return (
    <>
      {navItems.map(item => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNav}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
              ${active
                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
      <div className="mt-auto pt-6 border-t border-slate-700 text-xs text-slate-600">
        <div>Version 1.0.0</div>
        <div>Offline Mode Active</div>
      </div>
    </>
  );
}
