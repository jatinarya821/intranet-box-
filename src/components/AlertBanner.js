'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

const SEVERITY_CONFIG = {
  critical: {
    bg: 'bg-red-600',
    border: 'border-red-500',
    text: 'text-white',
    badge: 'bg-red-950/80 text-red-200 border-red-400/50',
    icon: '🚨',
    label: 'CRITICAL ALERT',
  },
  warning: {
    bg: 'bg-amber-500',
    border: 'border-amber-400',
    text: 'text-slate-950',
    badge: 'bg-amber-900/60 text-amber-100 border-amber-300/50',
    icon: '⚠️',
    label: 'WARNING',
  },
  info: {
    bg: 'bg-blue-600',
    border: 'border-blue-500',
    text: 'text-white',
    badge: 'bg-blue-950/80 text-blue-200 border-blue-400/50',
    icon: 'ℹ️',
    label: 'INFO',
  },
  safe: {
    bg: 'bg-emerald-600',
    border: 'border-emerald-500',
    text: 'text-white',
    badge: 'bg-emerald-950/80 text-emerald-200 border-emerald-400/50',
    icon: '✅',
    label: 'UPDATE',
  },
};

export default function AlertBanner() {
  const [latestAlert, setLatestAlert] = useState(null);
  const [dismissed, setDismissed] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioContextRef = useRef(null);

  const playAlertTone = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = audioContextRef.current || new AudioContext();
      audioContextRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  };

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch('/api/alerts');
        const data = await res.json();
        if (data && data.length > 0) {
          const top = data[0];
          setLatestAlert((prev) => {
            // If new critical alert arrives that was not dismissed, optionally play sound
            if (top.id !== prev?.id && top.severity === 'critical' && soundEnabled) {
              playAlertTone();
            }
            return top.id === dismissed ? null : top;
          });
        }
      } catch {}
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000); // 10s auto-poll
    return () => clearInterval(interval);
  }, [dismissed, soundEnabled]);

  if (!latestAlert || latestAlert.id === dismissed) return null;

  const cfg = SEVERITY_CONFIG[latestAlert.severity] || SEVERITY_CONFIG.info;
  const isCritical = latestAlert.severity === 'critical';

  return (
    <div
      role="alert"
      className={`relative z-50 transition-all ${cfg.bg} ${cfg.text} border-b ${cfg.border} shadow-lg ${
        isCritical ? 'animate-pulse-subtle' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-3">
        {/* Left: Indicator & Content */}
        <Link
          href="/alerts"
          className="flex items-center gap-2.5 flex-1 min-w-0 group hover:opacity-95"
        >
          <span className="text-xl sm:text-2xl shrink-0 drop-shadow">
            {cfg.icon}
          </span>
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <span
              className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${cfg.badge}`}
            >
              {cfg.label}
            </span>
            <span className="font-bold text-xs sm:text-sm truncate">
              {latestAlert.title}
            </span>
            <span className="hidden md:inline text-xs opacity-90 truncate max-w-xl">
              — {latestAlert.body}
            </span>
          </div>
        </Link>

        {/* Right: Audio toggle & Dismiss */}
        <div className="flex items-center gap-2 shrink-0">
          {isCritical && (
            <button
              onClick={() => {
                if (!soundEnabled) playAlertTone();
                setSoundEnabled(!soundEnabled);
              }}
              className="px-2 py-1 text-xs rounded-lg bg-black/20 hover:bg-black/30 border border-white/20 transition-all flex items-center gap-1 font-mono"
              title={soundEnabled ? 'Mute siren tone' : 'Enable audio tone for critical alerts'}
            >
              <span>{soundEnabled ? '🔊' : '🔇'}</span>
              <span className="hidden sm:inline text-[11px] font-medium">
                {soundEnabled ? 'Alert On' : 'Alert Off'}
              </span>
            </button>
          )}

          <button
            onClick={() => setDismissed(latestAlert.id)}
            className="p-1 rounded-lg hover:bg-black/20 transition-colors opacity-80 hover:opacity-100"
            title="Dismiss notice"
            aria-label="Dismiss banner"
          >
            <span className="text-lg leading-none">✕</span>
          </button>
        </div>
      </div>
    </div>
  );
}
