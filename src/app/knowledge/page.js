'use client';
import { useEffect, useState } from 'react';

const CATEGORIES = ['All', 'First Aid', 'Agriculture', 'Health', 'Disaster SOPs'];

const CAT_ICONS = {
  'First Aid': '🩺',
  'Agriculture': '🌾',
  'Health': '💊',
  'Disaster SOPs': '📋',
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

  useEffect(() => {
    fetch('/api/articles')
      .then(r => r.json())
      .then(data => { setArticles(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = articles.filter(a => {
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
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">📚 Knowledge Base</h1>
        <p className="text-slate-400 text-sm mt-0.5">Preloaded offline guides · First aid, agriculture, health, disaster SOPs</p>
      </div>

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
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-400 font-medium">
                {CAT_ICONS[selected.category]} {selected.category}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 mb-4">{selected.title}</h2>
            <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap article-content">
              {renderContent(selected.content)}
            </div>
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
                      <div className="text-slate-500 text-xs leading-relaxed line-clamp-2">
                        {article.content.slice(0, 100)}…
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
