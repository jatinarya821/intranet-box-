'use client';
import { useEffect, useState } from 'react';

const STATUSES = ['safe', 'missing', 'injured', 'unknown'];
const STATUS_CONFIG = {
  safe:    { label: 'Safe',    color: 'status-safe',    icon: '✅', desc: 'Checked in & unharmed' },
  missing: { label: 'Missing', color: 'status-missing', icon: '❓', desc: 'Unaccounted for' },
  injured: { label: 'Injured', color: 'status-injured', icon: '🤕', desc: 'Needs medical attention' },
  unknown: { label: 'Unknown', color: 'status-unknown', icon: '❔', desc: 'Awaiting verification' },
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
    <div className="max-w-4xl mx-auto space-y-5 min-w-0 w-full">
      {/* Page Title & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
            <span>👤</span> Survivor & Person Registry
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Check-in survivors · Track missing individuals · Searchable offline directory
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5"
            title="Print or save PDF report"
          >
            <span>🖨️</span>
            <span className="hidden sm:inline">Print Report</span>
          </button>

          <button
            onClick={() => setShowForm(!showForm)}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs sm:text-sm font-semibold transition-all shadow-md flex items-center justify-center gap-1.5"
          >
            <span>{showForm ? '✕' : '+'}</span>
            <span>{showForm ? 'Cancel' : 'Check-In Person'}</span>
          </button>
        </div>
      </div>

      {/* Touch-Friendly Status Filter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {STATUSES.map(s => {
          const cfg = STATUS_CONFIG[s];
          const active = statusFilter === s;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(active ? 'all' : s)}
              className={`p-3 rounded-2xl border text-left transition-all active:scale-95 flex items-center justify-between ${
                active ? 'ring-2 ring-white/30 scale-[1.02] shadow-lg' : 'opacity-85 hover:opacity-100'
              } ${cfg.color}`}
            >
              <div>
                <div className="text-xl mb-0.5">{cfg.icon}</div>
                <div className="text-xs font-semibold uppercase tracking-wider">{cfg.label}</div>
              </div>
              <div className="text-2xl font-black">{counts[s]}</div>
            </button>
          );
        })}
      </div>

      {/* Expandable Registration Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="font-bold text-base text-white flex items-center gap-2">
              <span>📝</span> Register Survivor or Report Person
            </h2>
            <span className="text-xs text-slate-500 font-mono">Form auto-saves to local SQLite</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name *</label>
              <input
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                placeholder="e.g. Ramesh Kumar"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Status *</label>
              <select
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              >
                {STATUSES.map(s => (
                  <option key={s} value={s}>
                    {STATUS_CONFIG[s].icon} {STATUS_CONFIG[s].label} ({STATUS_CONFIG[s].desc})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Age</label>
              <input
                type="number"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                placeholder="Age in years"
                value={form.age}
                onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Current Camp / Location</label>
              <input
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                placeholder="e.g. Shelter A, Room 3 or Village East"
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Phone / Relative Contact</label>
              <input
                type="tel"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                placeholder="e.g. +91 9876543210"
                value={form.contact}
                onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Medical or Identifying Notes</label>
              <input
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                placeholder="e.g. Diabetic, wearing blue shirt"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold transition-all shadow-lg active:scale-95"
          >
            {submitting ? 'Submitting to database...' : '✅ Save to Registry'}
          </button>
        </form>
      )}

      {/* Prominent Search Bar */}
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base">🔍</span>
        <input
          className="w-full bg-slate-900 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-blue-500 placeholder-slate-500 shadow-inner"
          placeholder="Search by person name, shelter location, or contact number..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs px-1.5 py-0.5 rounded bg-slate-800"
          >
            Clear
          </button>
        )}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          Showing {filtered.length} {statusFilter !== 'all' ? statusFilter : ''} person{filtered.length !== 1 ? 's' : ''}
        </span>
        {statusFilter !== 'all' && (
          <button
            onClick={() => setStatusFilter('all')}
            className="text-blue-400 hover:underline"
          >
            Reset filter (Show all)
          </button>
        )}
      </div>

      {/* Person Cards List */}
      {loading ? (
        <div className="text-slate-500 text-center py-12">Loading registry records…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl">
          <div className="text-4xl mb-3">👤</div>
          <div className="font-bold text-slate-300">No records found</div>
          <div className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search ? 'Try adjusting your search query' : 'Be the first to register someone using the button above'}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5">
          {filtered.map(person => {
            const cfg = STATUS_CONFIG[person.status] || STATUS_CONFIG.unknown;
            return (
              <div
                key={person.id}
                className="bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-4 transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="text-2xl sm:text-3xl p-2 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
                    {cfg.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-base text-white truncate">
                        {person.name}
                      </span>
                      {person.age && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                          Age {person.age}
                        </span>
                      )}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-400">
                      {person.location && (
                        <span className="flex items-center gap-1">
                          <span>📍</span>
                          <span className="text-slate-200">{person.location}</span>
                        </span>
                      )}
                      {person.contact && (
                        <a
                          href={`tel:${person.contact}`}
                          className="flex items-center gap-1 text-blue-400 hover:underline"
                        >
                          <span>📞</span>
                          <span>{person.contact}</span>
                        </a>
                      )}
                      {person.notes && (
                        <span className="flex items-center gap-1 italic text-slate-400">
                          <span>📝</span>
                          <span className="break-words">{person.notes}</span>
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-500 mt-1.5 font-mono">
                      Logged: {new Date(person.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Status Toggle Action Button */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80 w-full sm:w-auto justify-between sm:justify-end">
                  <span className="text-[11px] text-slate-500 sm:hidden">Tap to cycle status:</span>
                  <button
                    onClick={() => handleStatusChange(person)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 text-slate-300 transition-all flex items-center gap-1.5"
                    title="Change status: Safe -> Missing -> Injured -> Unknown"
                  >
                    <span>🔄</span>
                    <span>Next Status</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
