'use client';
import { useState } from 'react';

const LOCATIONS = [
  { id: 'shelter-a', type: 'shelter', label: 'Shelter A — Government School', x: 30, y: 25, capacity: 200, current: 145 },
  { id: 'shelter-b', type: 'shelter', label: 'Shelter B — Community Hall', x: 65, y: 55, capacity: 150, current: 98 },
  { id: 'medical-1', type: 'medical', label: 'Medical Camp — PHC Building', x: 48, y: 35, capacity: null },
  { id: 'food-1', type: 'food', label: 'Food Distribution — Main Square', x: 20, y: 60, capacity: null },
  { id: 'water-1', type: 'water', label: 'Water Point — Tanker Station', x: 75, y: 20, capacity: null },
  { id: 'water-2', type: 'water', label: 'Water Point — Temple Tank', x: 55, y: 75, capacity: null },
  { id: 'danger-1', type: 'danger', label: '⚠️ Danger — Bridge Submerged', x: 40, y: 70, capacity: null },
  { id: 'danger-2', type: 'danger', label: '⚠️ Danger — Landslide Risk Zone', x: 15, y: 40, capacity: null },
  { id: 'hq', type: 'hq', label: '🏢 Control HQ', x: 50, y: 50, capacity: null },
];

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

export default function MapPage() {
  const [selectedPin, setSelectedPin] = useState(null);
  const [filter, setFilter] = useState('all');

  const visible = LOCATIONS.filter(l => filter === 'all' || l.type === filter);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">🗺️ Offline Map</h1>
        <p className="text-slate-400 text-sm mt-0.5">Shelter locations, medical camps, food/water points, danger zones</p>
      </div>

      {/* Filter row */}
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
        {/* Map area */}
        <div className="flex-1">
          <div className="relative bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden aspect-[4/3]">
            {/* Background SVG map grid */}
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
              {/* Background */}
              <rect width="100%" height="100%" fill="#0f172a"/>
              {/* Grid lines */}
              {[10,20,30,40,50,60,70,80,90].map(v => (
                <g key={v}>
                  <line x1={`${v}%`} y1="0" x2={`${v}%`} y2="100%" stroke="#1e293b" strokeWidth="1"/>
                  <line x1="0" y1={`${v}%`} x2="100%" y2={`${v}%`} stroke="#1e293b" strokeWidth="1"/>
                </g>
              ))}
              {/* Simulated roads */}
              <path d="M 0 50% L 100% 50%" stroke="#334155" strokeWidth="3" fill="none"/>
              <path d="M 50% 0 L 50% 100%" stroke="#334155" strokeWidth="3" fill="none"/>
              <path d="M 0 25% L 100% 75%" stroke="#1e293b" strokeWidth="2" fill="none"/>
              {/* River */}
              <path d="M 10% 80% Q 30% 70% 45% 75% Q 60% 80% 80% 65% L 100% 70%"
                    stroke="#1d4ed8" strokeWidth="8" fill="none" opacity="0.4"/>
              <text x="55%" y="78%" fill="#3b82f6" fontSize="10" opacity="0.6">~ River ~</text>
              {/* Area labels */}
              <text x="5%" y="12%" fill="#475569" fontSize="9">North Zone</text>
              <text x="70%" y="12%" fill="#475569" fontSize="9">East Zone</text>
              <text x="5%" y="92%" fill="#475569" fontSize="9">South Zone</text>
              <text x="70%" y="92%" fill="#475569" fontSize="9">South-East</text>
            </svg>

            {/* Pins */}
            {visible.map(loc => {
              const cfg = TYPE_CONFIG[loc.type];
              const isSelected = selectedPin?.id === loc.id;
              return (
                <button
                  key={loc.id}
                  onClick={() => setSelectedPin(isSelected ? null : loc)}
                  style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
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

        {/* Info panel */}
        <div className="lg:w-64 space-y-3">
          {selectedPin ? (
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
              <div className="text-2xl mb-2">{TYPE_CONFIG[selectedPin.type].icon}</div>
              <div className="font-semibold text-slate-100 text-sm mb-1">{selectedPin.label}</div>
              <div className="text-xs text-slate-400 mb-2">
                Type: <span className="text-slate-300 font-medium">{TYPE_CONFIG[selectedPin.type].label}</span>
              </div>
              {selectedPin.capacity && (
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Occupancy</span>
                    <span>{selectedPin.current}/{selectedPin.capacity}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-blue-500"
                      style={{ width: `${(selectedPin.current / selectedPin.capacity) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              {selectedPin.type === 'danger' && (
                <div className="text-xs text-red-400 font-medium mt-2">
                  ⚠️ Avoid this area
                </div>
              )}
              <button onClick={() => setSelectedPin(null)} className="mt-3 text-xs text-slate-500 hover:text-slate-300">
                × Close
              </button>
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

          {/* Location list */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
            <div className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-wider">Locations</div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {visible.map(loc => (
                <button
                  key={loc.id}
                  onClick={() => setSelectedPin(loc)}
                  className="w-full text-left text-xs text-slate-400 hover:text-slate-200 flex items-center gap-2 py-1 transition-colors"
                >
                  <span>{TYPE_CONFIG[loc.type].icon}</span>
                  <span className="truncate">{loc.label.replace(/^⚠️\s*/,'')}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
