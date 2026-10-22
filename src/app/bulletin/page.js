'use client';
import { useEffect, useState } from 'react';

export default function BulletinPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ author: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/bulletin');
      const data = await res.json();
      setPosts(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
    const interval = setInterval(fetchPosts, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch('/api/bulletin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setForm({ author: '', message: '' });
      await fetchPosts();
    } catch {}
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this post?')) return;
    await fetch(`/api/bulletin?id=${id}`, { method: 'DELETE' });
    await fetchPosts();
  };

  // Color coding by first character for visual differentiation
  const AVATAR_COLORS = ['bg-blue-600', 'bg-purple-600', 'bg-emerald-600', 'bg-amber-600', 'bg-rose-600', 'bg-cyan-600'];
  const getColor = (author) => AVATAR_COLORS[(author.charCodeAt(0) || 0) % AVATAR_COLORS.length];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">💬 Community Bulletin Board</h1>
        <p className="text-slate-400 text-sm mt-0.5">Post notices · Visible to everyone on the network · Auto-refreshes every 15s</p>
      </div>

      {/* Post form */}
      <form onSubmit={handleSubmit} className="mb-6 bg-slate-800/60 border border-slate-700 rounded-xl p-5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Your Name (optional)</label>
            <input
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
              placeholder="Anonymous"
              value={form.author}
              onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-slate-400 block mb-1">Message *</label>
            <input
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
              placeholder="Post a notice, request help, share information..."
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              required
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={submitting || !form.message.trim()}
          className="px-6 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
        >
          {submitting ? 'Posting…' : '📢 Post Notice'}
        </button>
      </form>

      {/* Posts */}
      {loading ? (
        <div className="text-slate-500 text-center py-10">Loading posts…</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-14 text-slate-500">
          <div className="text-5xl mb-4">💬</div>
          <div className="font-medium">No posts yet</div>
          <div className="text-sm mt-1">Be the first to post a notice</div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-xs text-slate-500 mb-2">{posts.length} post{posts.length !== 1 ? 's' : ''}</div>
          {posts.map(post => {
            const author = post.author || 'Anonymous';
            const initial = author[0].toUpperCase();
            const color = getColor(author);
            return (
              <div key={post.id} className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex gap-3">
                <div className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-sm font-bold text-white ${color}`}>
                  {initial}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-medium text-slate-200 text-sm">{author}</span>
                    <span className="text-xs text-slate-500">{new Date(post.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-300 text-sm mt-1 leading-relaxed">{post.message}</p>
                </div>
                <button
                  onClick={() => handleDelete(post.id)}
                  className="shrink-0 text-slate-600 hover:text-red-400 transition-colors self-start mt-0.5"
                  title="Delete post"
                >
                  🗑️
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
