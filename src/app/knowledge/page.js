'use client';
import { useEffect, useState } from 'react';
import PinGate, { adminFetch, hasAdminToken } from '@/components/PinGate';
import { featuredGuides } from '@/lib/featured-guides';

const CATEGORIES = ['All', 'First Aid', 'Agriculture', 'Health', 'Disaster SOPs', 'Sanitation', 'Child Safety', 'Legal Rights'];

const CAT_ICONS = {
  'First Aid': '🩺',
  'Agriculture': '🌾',
  'Health': '💊',
  'Disaster SOPs': '📋',
  'Sanitation': '🚽',
  'Child Safety': '🧒',
  'Legal Rights': '📄',
};

function renderContent(text) {
  // Bold text surrounded by **
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-slate-100 font-semibold">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export default function KnowledgePage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: 'First Aid', title: '', content: '' });
  const [gateOpen, setGateOpen] = useState(false);
  const [pending, setPending] = useState(null);

  const loadArticles = () => {
    fetch('/api/articles')
      .then(r => r.json())
      .then(data => { setArticles(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadArticles(); }, []);

  const handleCreate = (event) => {
    event.preventDefault();
    const publish = async () => {
      const res = await adminFetch('/api/articles', { method: 'POST', body: JSON.stringify(form) });
      if (!res.ok) return;
      setForm({ category: 'First Aid', title: '', content: '' });
      setShowForm(false);
      loadArticles();
    };
    if (!hasAdminToken()) {
      setPending(() => publish);
      setGateOpen(true);
      return;
    }
    publish();
  };

  const filtered = [...featuredGuides, ...articles].filter(a => {
    const matchCat = activeCategory === 'All' || a.category === activeCategory;
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const grouped = filtered.reduce((acc, a) => {
    if (!acc[a.category]) acc[a.category] = [];
    acc[a.category].push(a);
    return acc;
  }, {});

  return (
    <div className="max-w-5xl mx-auto min-w-0 w-full">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100">📚 Knowledge Base</h1>
          <p className="text-slate-400 text-sm mt-0.5">Preloaded offline guides · First aid, agriculture, health, disaster SOPs</p>
        </div>
        <button
          onClick={() => setShowForm((open) => !open)}
          className="shrink-0 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm"
        >
          {showForm ? 'Close' : '+ Guide'}
        </button>
      </div>

      {!selected && (
        <div className="mb-6 overflow-hidden rounded-xl border border-slate-700 bg-slate-800/60 sm:flex">
          <div className="flex-1 p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-300">Offline reference</p>
            <h2 className="mt-2 text-lg font-bold text-slate-100">Find the right guide, even without internet</h2>
            <p className="mt-2 text-sm text-slate-400">Search by topic, then open a guide for practical information on your device.</p>
          </div>
          {/* A local illustration keeps this page usable without an internet connection. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/guides/emergency-kit.png" alt="Illustration of an emergency kit with a backpack, water bottle, flashlight and blanket" className="h-36 w-full object-cover sm:h-auto sm:w-64" />
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="mb-5 bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-3">
          <select
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm"
            value={form.category}
            onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
          >
            {CATEGORIES.filter((cat) => cat !== 'All').map((cat) => <option key={cat}>{cat}</option>)}
          </select>
          <input
            required
            placeholder="Guide title"
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm"
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          />
          <textarea
            required
            rows={5}
            placeholder="Steps and warnings. Use **bold** for headings."
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm"
            value={form.content}
            onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
          />
          <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm">Save guide</button>
        </form>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-blue-500 placeholder-slate-500"
          placeholder="🔍 Search articles..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => { setActiveCategory(cat); setSelected(null); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all
              ${activeCategory === cat
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`}
          >
            {CAT_ICONS[cat] || '📖'} {cat}
          </button>
        ))}
      </div>

      {selected ? (
        // Article view
        <div>
          <button
            onClick={() => setSelected(null)}
            className="mb-4 text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            ← Back to articles
          </button>
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-400 font-medium">
                {CAT_ICONS[selected.category]} {selected.category}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 mb-4">{selected.title}</h2>
            {selected.sections ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/guides/emergency-kit.png" alt="Illustration of general emergency supplies" className="mb-4 h-32 w-full rounded-lg object-cover sm:h-44" />
                <p className="mb-4 text-sm text-slate-400">Open the section that matches your situation. The guidance below is available offline.</p>
                <div className="space-y-3">
                  {selected.sections.map((section) => (
                    <details key={section.title} open className="group rounded-xl border border-slate-700 bg-slate-900/60">
                      <summary className="cursor-pointer px-4 py-3 font-semibold text-slate-100">{section.title}</summary>
                      <p className="px-4 pb-4 text-sm leading-relaxed text-slate-300">{section.text}</p>
                      {section.image && (
                        <figure className="mx-4 mb-4 rounded-lg border border-slate-700 bg-white p-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={section.image.src} alt={section.image.alt} className="mx-auto max-h-[36rem] w-auto max-w-full object-contain" />
                          <figcaption className="mt-3 text-xs leading-relaxed text-slate-700">
                            <p>{section.image.caption}</p>
                            <p className="mt-1">{section.image.credit} <a className="underline" href={section.image.url} target="_blank" rel="noreferrer">Image source</a> · <a className="underline" href={section.image.licenseUrl} target="_blank" rel="noreferrer">License</a> (links require internet).</p>
                          </figcaption>
                        </figure>
                      )}
                    </details>
                  ))}
                </div>
                <div className="mt-5 border-t border-slate-700 pt-4 text-xs leading-relaxed text-slate-400">
                  <p>Source: {selected.source.title}. Checked {selected.source.checked}.</p>
                  {selected.source.note && <p className="mt-1">{selected.source.note}</p>}
                  <a className="mt-1 inline-block text-blue-400 underline" href={selected.source.url} target="_blank" rel="noreferrer">View original source when online ↗</a>
                </div>
              </>
            ) : (
              <>
                <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">This existing guide has no recorded source or review date. Ask a qualified local responder to verify it before relying on it.</p>
                {selected.content.includes('High body temp (>40°C), no sweating, confusion, unconsciousness') && (
                  <p className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300" role="note">Correction: heat stroke can occur with heavy sweating as well as dry skin. Confusion or unconsciousness in a person exposed to heat requires urgent medical help and immediate cooling.</p>
                )}
                <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap article-content">
                  {renderContent(selected.content)}
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        // Article list
        loading ? (
          <div className="text-slate-500 text-center py-10">Loading articles…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No articles found</div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([category, arts]) => (
              <div key={category}>
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  {CAT_ICONS[category]} {category}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {arts.map(article => (
                    <button
                      key={article.id}
                      onClick={() => setSelected(article)}
                      className="text-left bg-slate-800/60 border border-slate-700/60 hover:border-blue-500/50 hover:bg-slate-800 rounded-xl p-4 transition-all"
                    >
                      <div className="font-medium text-slate-100 mb-1">{article.title}</div>
                      {article.source ? (
                        <>
                          <div className="mb-2 text-xs font-medium text-emerald-400">Source listed · Offline guide</div>
                          <div className="text-slate-500 text-xs leading-relaxed line-clamp-2">{article.content}</div>
                        </>
                      ) : (
                        <div className="text-xs text-amber-400">Source not recorded · Review needed</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      )}
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
