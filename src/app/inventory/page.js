'use client';
import { useEffect, useState } from 'react';

const CATEGORIES = ['All', 'Water', 'Food', 'Medicine', 'Shelter', 'Equipment'];
const CAT_ICONS = { Water: '💧', Food: '🍱', Medicine: '💊', Shelter: '🏠', Equipment: '🔧' };

function QuantityBar({ quantity, max = 500 }) {
  const pct = Math.min(100, Math.round((quantity / max) * 100));
  const color = pct < 20 ? 'bg-red-500' : pct < 50 ? 'bg-amber-500' : 'bg-green-500';
  return (
    <div className="w-full bg-slate-700 rounded-full h-1.5 mt-1">
      <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function InventoryPage() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'Food', quantity: '', unit: 'kg', location: '' });
  const [editing, setEditing] = useState(null);
  const [editQty, setEditQty] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchResources = async () => {
    try {
      const res = await fetch('/api/resources');
      const data = await res.json();
      setResources(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchResources(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, quantity: parseInt(form.quantity) || 0 }),
      });
      setForm({ name: '', category: 'Food', quantity: '', unit: 'kg', location: '' });
      setShowForm(false);
      await fetchResources();
    } catch {}
    setSubmitting(false);
  };

  const handleEditSave = async (resource) => {
    try {
      await fetch('/api/resources', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: resource.id, quantity: parseInt(editQty) || 0, location: resource.location }),
      });
      setEditing(null);
      await fetchResources();
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this resource?')) return;
    await fetch(`/api/resources?id=${id}`, { method: 'DELETE' });
    await fetchResources();
  };

  const filtered = filter === 'All' ? resources : resources.filter(r => r.category === filter);

  const grouped = filtered.reduce((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {});

  const lowStock = resources.filter(r => r.quantity < 20);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">📦 Resource Inventory</h1>
          <p className="text-slate-400 text-sm mt-0.5">Track food, water, medicine and equipment stockpiles</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
        >
          {showForm ? '✕ Cancel' : '+ Add Resource'}
        </button>
      </div>

      {/* Low stock warnings */}
      {lowStock.length > 0 && (
        <div className="mb-5 bg-red-500/10 border border-red-500/40 rounded-xl p-4">
          <div className="font-medium text-red-300 mb-2 text-sm">⚠️ Low Stock Alert ({lowStock.length} items)</div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map(r => (
              <span key={r.id} className="text-xs px-2 py-1 bg-red-500/20 text-red-300 rounded border border-red-500/30">
                {r.name} — {r.quantity} {r.unit}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleAdd} className="mb-6 bg-slate-800/60 border border-slate-700 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-slate-200">Add Resource</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Resource Name *</label>
              <input className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                placeholder="Rice, Water, ORS..." value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Category</label>
              <select className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {['Water','Food','Medicine','Shelter','Equipment'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Quantity</label>
              <input type="number" className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                placeholder="0" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Unit</label>
              <input className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                placeholder="kg, liters, pieces..." value={form.unit}
                onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-400 block mb-1">Storage Location</label>
              <input className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                placeholder="Warehouse A, Room 2..." value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
            </div>
          </div>
          <button type="submit" disabled={submitting}
            className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-medium transition-colors">
            {submitting ? 'Adding…' : '📦 Add Resource'}
          </button>
        </form>
      )}

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap mb-5">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
              ${filter === cat ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
            {CAT_ICONS[cat] || '📖'} {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-slate-500 text-center py-10">Loading inventory…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500">No resources found</div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                {CAT_ICONS[category]} {category}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {items.map(resource => (
                  <div key={resource.id} className={`bg-slate-800/60 border rounded-xl p-4
                    ${resource.quantity < 20 ? 'border-red-500/40' : 'border-slate-700/60'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-100 truncate">{resource.name}</div>
                        {resource.location && (
                          <div className="text-xs text-slate-500 mt-0.5">📍 {resource.location}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {editing === resource.id ? (
                          <>
                            <input
                              type="number"
                              className="w-20 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-slate-100 focus:outline-none"
                              value={editQty}
                              onChange={e => setEditQty(e.target.value)}
                              autoFocus
                            />
                            <button onClick={() => handleEditSave(resource)}
                              className="text-xs text-green-400 hover:text-green-300 px-2 py-1 border border-green-500/30 rounded">✓</button>
                            <button onClick={() => setEditing(null)}
                              className="text-xs text-slate-500 hover:text-slate-300">✕</button>
                          </>
                        ) : (
                          <>
                            <span className={`text-lg font-bold ${resource.quantity < 20 ? 'text-red-400' : 'text-slate-100'}`}>
                              {resource.quantity}
                            </span>
                            <span className="text-xs text-slate-500">{resource.unit}</span>
                            <button onClick={() => { setEditing(resource.id); setEditQty(resource.quantity); }}
                              className="text-xs text-slate-500 hover:text-slate-300 px-1.5 py-1 border border-slate-700 rounded ml-1">✏️</button>
                            <button onClick={() => handleDelete(resource.id)}
                              className="text-xs text-slate-600 hover:text-red-400 px-1.5 py-1 border border-slate-700 rounded">🗑️</button>
                          </>
                        )}
                      </div>
                    </div>
                    <QuantityBar quantity={resource.quantity} />
                    {resource.quantity < 20 && (
                      <p className="text-xs text-red-400 mt-1.5 font-medium">⚠️ Low stock!</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
