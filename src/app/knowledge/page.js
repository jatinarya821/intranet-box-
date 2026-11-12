'use client';
import { useEffect, useState } from 'react';
import PinGate, { adminFetch, hasAdminToken } from '@/components/PinGate';
import { featuredGuides } from '@/lib/featured-guides';

const CATEGORIES = ['All', 'First Aid', 'Agriculture', 'Health', 'Disaster SOPs', 'Sanitation', 'Child Safety', 'Legal Rights'];
const EMPTY_FORM = { category: 'First Aid', title: '', content: '', source_title: '', source_url: '', reviewed_by: '', review_date: '', review_confirmed: false };

function guideStatus(article) {
  if (article.reviewed_by && article.review_date && article.source_title) return 'Review recorded';
  if (article.source || article.source_title) return 'Source listed';
  return 'Needs review';
}

function GuideStatus({ article }) {
  const status = guideStatus(article);
  const color = status === 'Needs review' ? 'border-amber-500/40 text-amber-300' : 'border-emerald-500/40 text-emerald-300';
  return <span className={'inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ' + color}>{status}</span>;
}

function safeSourceUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : '';
  } catch {
    return '';
  }
}

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
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState('');
  const [gateOpen, setGateOpen] = useState(false);
  const [pending, setPending] = useState(null);

  const loadArticles = () => {
    fetch('/api/articles', { cache: 'no-store' })
      .then(r => { if (!r.ok) throw new Error('Could not load guides'); return r.json(); })
      .then(data => { setArticles(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadArticles(); }, []);

  const handleCreate = (event) => {
    event.preventDefault();
    const publish = async () => {
      setFormError('');
      try {
        const res = await adminFetch('/api/articles', { method: editingId ? 'PATCH' : 'POST', body: JSON.stringify(editingId ? { ...form, id: editingId } : form) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not save guide');
        setForm(EMPTY_FORM);
        setEditingId(null);
        setShowForm(false);
        if (selected?.id === data.id) setSelected(data);
        loadArticles();
      } catch (error) {
        setFormError(error.message || 'Could not save guide');
      }
    };
    if (!hasAdminToken()) {
      setPending(() => publish);
      setGateOpen(true);
      return;
    }
    publish();
  };

  const editGuide = (article) => {
    setEditingId(article.id);
    setForm({ category: article.category, title: article.title, content: article.content, source_title: article.source_title || '', source_url: article.source_url || '', reviewed_by: article.reviewed_by || '', review_date: article.review_date || '', review_confirmed: false });
    setFormError('');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
          onClick={() => { setShowForm((open) => !open); setEditingId(null); setForm(EMPTY_FORM); setFormError(''); }}
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
          <h2 className="font-semibold text-slate-100">{editingId ? 'Edit guide and review details' : 'Add a guide'}</h2>
          <p className="text-xs text-slate-400">Saving requires administrator access. Only record a review when the named person has reviewed this version.</p>
          {formError && <p role="alert" className="text-sm text-red-400">{formError}</p>}
          <select
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm"
            value={form.category}
            onChange={(event) => setForm((current) => ({ ...current, category: event.target.value, review_confirmed: false }))}
          >
            {CATEGORIES.filter((cat) => cat !== 'All').map((cat) => <option key={cat}>{cat}</option>)}
          </select>
          <input
            required
            placeholder="Guide title"
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm"
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value, review_confirmed: false }))}
          />
          <textarea
            required
            rows={5}
            placeholder="Steps and warnings. Use **bold** for headings."
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm"
            value={form.content}
            onChange={(event) => setForm((current) => ({ ...current, content: event.target.value, review_confirmed: false }))}
          />
          <label className="block text-xs text-slate-400">Source name (optional)
            <input maxLength={300} value={form.source_title} onChange={(event) => setForm((current) => ({ ...current, source_title: event.target.value, review_confirmed: false }))} placeholder="Organization and publication" className="mt-1 w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100" />
          </label>
          <label className="block text-xs text-slate-400">Source link (optional; opens when online)
            <input type="url" maxLength={2048} value={form.source_url} onChange={(event) => setForm((current) => ({ ...current, source_url: event.target.value, review_confirmed: false }))} placeholder="https://..." className="mt-1 w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs text-slate-400">Reviewed by (optional)
              <input maxLength={160} value={form.reviewed_by} onChange={(event) => setForm((current) => ({ ...current, reviewed_by: event.target.value, review_confirmed: false }))} placeholder="Reviewer name and role" className="mt-1 w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100" />
            </label>
            <label className="block text-xs text-slate-400">Review date (optional)
              <input type="date" value={form.review_date} onChange={(event) => setForm((current) => ({ ...current, review_date: event.target.value, review_confirmed: false }))} className="mt-1 w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100" />
            </label>
          </div>
          {(form.reviewed_by || form.review_date) && <label className="flex items-start gap-2 text-xs text-slate-300"><input type="checkbox" checked={form.review_confirmed} onChange={(event) => setForm((current) => ({ ...current, review_confirmed: event.target.checked }))} /> I confirm the named person reviewed this version of the guide.</label>}
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
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <GuideStatus article={selected} />
              {typeof selected.id === 'number' && <button type="button" onClick={() => editGuide(selected)} className="text-xs text-blue-400 underline hover:text-blue-300">Edit guide (admin)</button>}
            </div>
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
                  <p>Source: {selected.source.title}. Source checked {selected.source.checked}.</p>
                  {selected.source.note && <p className="mt-1">{selected.source.note}</p>}
                  <a className="mt-1 inline-block text-blue-400 underline" href={selected.source.url} target="_blank" rel="noreferrer">View original source when online ↗</a>
                  {selected.source.extraUrl && <a className="mt-1 ml-3 inline-block text-blue-400 underline" href={selected.source.extraUrl} target="_blank" rel="noreferrer">Additional WHO guidance ↗</a>}
                </div>
              </>
            ) : (
              <>
                {selected.content.includes('Clean wound gently with soap and water') && (
                  <p className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300" role="note">Correction: WHO advises not to wash or rub a snakebite. <button type="button" className="underline" onClick={() => setSelected(featuredGuides.find((guide) => guide.id === 'featured-snakebite'))}>Open the source-listed snakebite guide</button>.</p>
                )}
                {selected.content.includes("Mark the time the tourniquet was applied on the patient's forehead") && (
                  <p className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-300">A source-listed guide is available for severe bleeding. <button type="button" className="underline" onClick={() => setSelected(featuredGuides.find((guide) => guide.id === 'featured-major-bleeding'))}>Open the bleeding guide</button>.</p>
                )}
                {selected.content.includes('High body temp (>40°C), no sweating, confusion, unconsciousness') && (
                  <p className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300" role="note">Correction: heat stroke can occur with heavy sweating as well as dry skin. Confusion or unconsciousness in a person exposed to heat requires urgent medical help and immediate cooling.</p>
                )}
                {selected.content.includes('Clean wound gently with soap and water') || selected.content.includes("Mark the time the tourniquet was applied on the patient's forehead") ? (
                  <details className="rounded-lg border border-slate-700 p-3">
                    <summary className="cursor-pointer text-sm font-medium text-slate-300">Show older unreviewed guide</summary>
                    <div className="mt-3 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap article-content">{renderContent(selected.content)}</div>
                  </details>
                ) : (
                  <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap article-content">
                    {renderContent(selected.content)}
                  </div>
                )}
                <div className="mt-5 border-t border-slate-700 pt-4 text-xs leading-relaxed text-slate-400">
                  {selected.source_title ? <p>Source: {selected.source_title}</p> : <p>Source not recorded.</p>}
                  {safeSourceUrl(selected.source_url) && <a className="mt-1 inline-block text-blue-400 underline" href={safeSourceUrl(selected.source_url)} target="_blank" rel="noreferrer">View source when online ↗</a>}
                  {selected.reviewed_by && selected.review_date && <p className="mt-1">Review recorded by administrator: {selected.reviewed_by} · {selected.review_date}</p>}
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
                      <div className="mb-2"><GuideStatus article={article} /></div>
                      <div className="text-slate-500 text-xs leading-relaxed line-clamp-2">{article.content}</div>
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
