'use client';
import { useEffect, useState } from 'react';
import PinGate, { adminFetch, hasAdminToken } from '@/components/PinGate';

const TYPE_CONFIG = {
  shelter: { icon: '🏠', color: '#3b82f6', label: 'Shelter' },
  medical:  { icon: '🏥', color: '#22c55e', label: 'Medical' },
  food:     { icon: '🍱', color: '#f59e0b', label: 'Food' },
  water:    { icon: '💧', color: '#06b6d4', label: 'Water' },
  danger:   { icon: '⚠️', color: '#ef4444', label: 'Danger Zone' },
  hq:       { icon: '🏢', color: '#a855f7', label: 'HQ' },
};

const LEGEND_TYPES = ['shelter', 'medical', 'food', 'water', 'danger', 'hq'];
const FILTER_TYPES = ['all', ...LEGEND_TYPES];

const EMPTY_DRAFT = { label: '', type: 'shelter', x_pct: 50, y_pct: 50, notes: '', capacity: '', current_count: '' };

export default function MapPage() {
  const [locations, setLocations] = useState([]);
  const [selectedPin, setSelectedPin] = useState(null);
  const [filter, setFilter] = useState('all');
  const [placing, setPlacing] = useState(false);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [gateOpen, setGateOpen] = useState(false);
  const [pending, setPending] = useState(null);

  const loadPins = async () => {
    const res = await fetch('/api/map-pins');
    const data = await res.json();
    setLocations(Array.isArray(data) ? data : []);
  };

  useEffect(() => { loadPins(); }, []);

  const visible = locations.filter((pin) => filter === 'all' || pin.type === filter);

  const guard = (action) => {
    if (!hasAdminToken()) {
      setPending(() => action);
      setGateOpen(true);
      return;
    }
    action();
  };

  const placeFromClick = (event) => {
    if (!placing) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.round(((event.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((event.clientY - rect.top) / rect.height) * 100);
    setDraft((current) => ({ ...current, x_pct: x, y_pct: y }));
  };

  const savePin = (event) => {
    event.preventDefault();
    guard(async () => {
      const res = await adminFetch('/api/map-pins', {
        method: 'POST',
        body: JSON.stringify({
          ...draft,
          capacity: draft.capacity ? Number(draft.capacity) : null,
          current_count: draft.current_count ? Number(draft.current_count) : 0,
        }),
      });
      if (!res.ok) return;
      setDraft(EMPTY_DRAFT);
      setPlacing(false);
      await loadPins();
    });
  };

  const deletePin = (id) => {
    guard(async () => {
      const res = await adminFetch(`/api/map-pins?id=${id}`, { method: 'DELETE' });
      if (!res.ok) return;
      setSelectedPin(null);
      await loadPins();
    });
  };

  return (
    <div className="max-w-5xl mx-auto min-w-0 w-full">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100">🗺️ Offline Map</h1>
          <p className="text-slate-400 text-sm mt-0.5">Shelter locations, medical camps, food/water points, danger zones</p>
        </div>
        <button
          onClick={() => setPlacing((open) => !open)}
          className="shrink-0 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm"
        >
          {placing ? 'Close' : '+ Pin'}
        </button>
      </div>

      {placing && (
        <form onSubmit={savePin} className="mb-4 bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-3">
          <p className="text-xs text-slate-400">Tap the map to set the pin, then save. Position: {draft.x_pct}%, {draft.y_pct}%.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input required placeholder="Place name" className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm" value={draft.label} onChange={(event) => setDraft((current) => ({ ...current, label: event.target.value }))} />
            <select className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm" value={draft.type} onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value }))}>
              {LEGEND_TYPES.map((type) => <option key={type} value={type}>{TYPE_CONFIG[type].label}</option>)}
            </select>
            <input placeholder="Directions" className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm sm:col-span-2" value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} />
            <input type="number" placeholder="Capacity" className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm" value={draft.capacity} onChange={(event) => setDraft((current) => ({ ...current, capacity: event.target.value }))} />
            <input type="number" placeholder="People there now" className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm" value={draft.current_count} onChange={(event) => setDraft((current) => ({ ...current, current_count: event.target.value }))} />
          </div>
          <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm">Save pin</button>
        </form>
      )}

      <div className="flex gap-2 flex-wrap mb-4">
        {FILTER_TYPES.map(t => {
          const cfg = TYPE_CONFIG[t];
          return (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border
                ${filter === t
                  ? 'bg-slate-600 border-slate-400 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
            >
              {t === 'all' ? '🌐' : cfg?.icon} {t === 'all' ? 'All' : cfg?.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 min-w-0">
          <div
            onClick={placeFromClick}
            className={`relative bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden aspect-[4/3] w-full ${placing ? 'cursor-crosshair' : ''}`}
          >
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <rect width="100%" height="100%" fill="#0f172a"/>
              {[10,20,30,40,50,60,70,80,90].map(v => (
                <g key={v}>
                  <line x1={`${v}%`} y1="0" x2={`${v}%`} y2="100%" stroke="#1e293b" strokeWidth="1"/>
                  <line x1="0" y1={`${v}%`} x2="100%" y2={`${v}%`} stroke="#1e293b" strokeWidth="1"/>
                </g>
              ))}
              <path d="M 0 50% L 100% 50%" stroke="#334155" strokeWidth="3" fill="none"/>
              <path d="M 50% 0 L 50% 100%" stroke="#334155" strokeWidth="3" fill="none"/>
              <path d="M 0 25% L 100% 75%" stroke="#1e293b" strokeWidth="2" fill="none"/>
              <path d="M 10% 80% Q 30% 70% 45% 75% Q 60% 80% 80% 65% L 100% 70%"
                    stroke="#1d4ed8" strokeWidth="8" fill="none" opacity="0.4"/>
              <text x="55%" y="78%" fill="#3b82f6" fontSize="10" opacity="0.6">~ River ~</text>
              <text x="5%" y="12%" fill="#475569" fontSize="9">North Zone</text>
              <text x="70%" y="12%" fill="#475569" fontSize="9">East Zone</text>
              <text x="5%" y="92%" fill="#475569" fontSize="9">South Zone</text>
              <text x="70%" y="92%" fill="#475569" fontSize="9">South-East</text>
            </svg>

            {placing && (
              <div
                className="absolute w-3 h-3 rounded-full bg-white border border-slate-900"
                style={{ left: `${draft.x_pct}%`, top: `${draft.y_pct}%`, transform: 'translate(-50%, -50%)' }}
              />
            )}

            {visible.map(loc => {
              const cfg = TYPE_CONFIG[loc.type] || TYPE_CONFIG.hq;
              const isSelected = selectedPin?.id === loc.id;
              return (
                <button
                  key={loc.id}
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedPin(isSelected ? null : loc);
                  }}
                  style={{ left: `${loc.x_pct}%`, top: `${loc.y_pct}%` }}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-125 z-10"
                  title={loc.label}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-base shadow-lg
                    ${isSelected ? 'ring-2 ring-white scale-125' : ''}
                    border-2`}
                    style={{ backgroundColor: `${cfg.color}22`, borderColor: cfg.color }}
                  >
                    {cfg.icon}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="w-full lg:w-64 space-y-3 min-w-0">
          {selectedPin ? (
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
              <div className="text-2xl mb-2">{TYPE_CONFIG[selectedPin.type]?.icon}</div>
              <div className="font-semibold text-slate-100 text-sm mb-1">{selectedPin.label}</div>
              <div className="text-xs text-slate-400 mb-2">
                Type: <span className="text-slate-300 font-medium">{TYPE_CONFIG[selectedPin.type]?.label}</span>
              </div>
              {selectedPin.notes && (
                <p className="text-xs text-slate-300 mb-2">Directions: {selectedPin.notes}</p>
              )}
              {selectedPin.capacity ? (
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Occupancy</span>
                    <span>{selectedPin.current_count}/{selectedPin.capacity}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-blue-500"
                      style={{ width: `${Math.min(100, (selectedPin.current_count / selectedPin.capacity) * 100)}%` }}
                    />
                  </div>
                </div>
              ) : null}
              {selectedPin.type === 'danger' && (
                <div className="text-xs text-red-400 font-medium mt-2">⚠️ Avoid this area</div>
              )}
              <div className="mt-3 flex gap-3">
                <button onClick={() => setSelectedPin(null)} className="text-xs text-slate-500 hover:text-slate-300">× Close</button>
                <button onClick={() => deletePin(selectedPin.id)} className="text-xs text-red-400">Remove pin</button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
              <div className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-wider">Legend</div>
              {LEGEND_TYPES.map(t => (
                <div key={t} className="flex items-center gap-2 text-sm text-slate-300 mb-2">
                  <span>{TYPE_CONFIG[t].icon}</span>
                  <span className="text-xs">{TYPE_CONFIG[t].label}</span>
                </div>
              ))}
            </div>
          )}

          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
            <div className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-wider">Locations</div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {visible.map(loc => (
                <button
                  key={loc.id}
                  onClick={() => setSelectedPin(loc)}
                  className="w-full text-left text-xs text-slate-400 hover:text-slate-200 flex items-center gap-2 py-1 transition-colors"
                >
                  <span>{TYPE_CONFIG[loc.type]?.icon}</span>
                  <span className="truncate">{loc.label.replace(/^⚠️\s*/,'')}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <PinGate
        open={gateOpen}
        onClose={() => { setGateOpen(false); setPending(null); }}
        onUnlocked={() => {
          setGateOpen(false);
          const action = pending;
          setPending(null);
          if (action) action();
        }}
      />
    </div>
  );
}
