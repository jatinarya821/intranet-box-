'use client';
import { useEffect, useState } from 'react';

const STATUSES = ['safe', 'missing', 'injured', 'unknown'];
const STATUS_CONFIG = {
  safe:    { label: 'Safe',    color: 'status-safe',    icon: '✅' },
  missing: { label: 'Missing', color: 'status-missing', icon: '❓' },
  injured: { label: 'Injured', color: 'status-injured', icon: '🤕' },
  unknown: { label: 'Unknown', color: 'status-unknown', icon: '❔' },
};

export default function RegistryPage() {
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', age: '', status: 'safe', location: '', contact: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchPersons = async (q = '') => {
    try {
      const url = q ? `/api/persons?search=${encodeURIComponent(q)}` : '/api/persons';
      const res = await fetch(url);
      const data = await res.json();
      setPersons(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchPersons(); }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchPersons(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch('/api/persons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, age: form.age ? parseInt(form.age) : null }),
      });
      setForm({ name: '', age: '', status: 'safe', location: '', contact: '', notes: '' });
      setShowForm(false);
      await fetchPersons(search);
    } catch {}
    setSubmitting(false);
  };

  const handleStatusChange = async (person) => {
    const next = STATUSES[(STATUSES.indexOf(person.status) + 1) % STATUSES.length];
    await fetch('/api/persons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: person.id, status: next, location: person.location, notes: person.notes }),
    });
    await fetchPersons(search);
  };

  const filtered = statusFilter === 'all' ? persons : persons.filter(p => p.status === statusFilter);

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = persons.filter(p => p.status === s).length;
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">👤 Person Registry</h1>
          <p className="text-slate-400 text-sm mt-0.5">Check-in survivors · Track missing persons · Search by name</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
        >
          {showForm ? '✕ Cancel' : '+ Register Person'}
        </button>
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {STATUSES.map(s => {
          const cfg = STATUS_CONFIG[s];
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
              className={`rounded-xl border p-3 text-center transition-all
                ${statusFilter === s ? 'ring-2 ring-white/20 scale-105' : 'opacity-80 hover:opacity-100'}
                ${cfg.color}`}
            >
              <div className="text-xl mb-0.5">{cfg.icon}</div>
              <div className="text-lg font-bold">{counts[s]}</div>
              <div className="text-xs opacity-80">{cfg.label}</div>
            </button>
          );
        })}
      </div>

      {/* Registration form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 bg-slate-800/60 border border-slate-700 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-slate-200">Register Person</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Full Name *</label>
              <input
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                placeholder="Name..."
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Age</label>
              <input
                type="number"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                placeholder="Age..."
                value={form.age}
                onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Status</label>
              <select
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              >
                {STATUSES.map(s => (
                  <option key={s} value={s}>{STATUS_CONFIG[s].icon} {STATUS_CONFIG[s].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Current Location</label>
              <input
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                placeholder="Shelter A, Room 3..."
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Contact Number</label>
              <input
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                placeholder="+91 9876543210"
                value={form.contact}
                onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Notes</label>
              <input
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                placeholder="Any notes..."
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {submitting ? 'Registering…' : '✅ Register Person'}
          </button>
        </form>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-blue-500 placeholder-slate-500"
          placeholder="🔍 Search by name, location, or contact..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Persons list */}
      {loading ? (
        <div className="text-slate-500 text-center py-10">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <div className="text-4xl mb-3">👤</div>
          <div>No persons found</div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(person => {
            const cfg = STATUS_CONFIG[person.status] || STATUS_CONFIG.unknown;
            return (
              <div key={person.id} className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex items-center gap-4">
                <div className="text-2xl shrink-0">{cfg.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-slate-100">{person.name}</span>
                    {person.age && <span className="text-slate-500 text-xs">Age {person.age}</span>}
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex gap-4 mt-1 text-xs text-slate-500 flex-wrap">
                    {person.location && <span>📍 {person.location}</span>}
                    {person.contact && <span>📞 {person.contact}</span>}
                    {person.notes && <span>📝 {person.notes}</span>}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    {new Date(person.created_at).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => handleStatusChange(person)}
                  className="shrink-0 text-xs text-slate-500 hover:text-slate-300 border border-slate-700 rounded-lg px-2 py-1 transition-colors"
                  title="Cycle status"
                >
                  Update
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
