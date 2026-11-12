'use client';
import { useEffect, useState } from 'react';

export default function BulletinPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ author: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/bulletin', { cache: 'no-store' });
      if (!res.ok) throw new Error('Could not load notices');
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error('Could not load notices');
      setPosts(data);
      setError('');
    } catch {
      setError('Could not refresh notices. Check your connection; we will keep trying.');
    }
    setLoading(false);
  };

  useEffect(() => {
    const initialFetch = setTimeout(fetchPosts, 0);
    const interval = setInterval(fetchPosts, 5000);
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') fetchPosts();
    };
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      clearTimeout(initialFetch);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/bulletin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Could not post notice');
      }
      setForm({ author: '', message: '' });
      await fetchPosts();
    } catch (err) {
      setError(err.message || 'Could not post notice. Please try again.');
    }
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
    <div className="max-w-3xl mx-auto min-w-0 w-full">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-100">💬 Community Bulletin Board</h1>
        <p className="text-slate-400 text-sm mt-0.5">Post notices · Visible to everyone on the network · Checks for updates every 5 seconds</p>
        <p className="text-slate-400 text-xs mt-2">Only posts marked “Verified administrator” or “Verified operator” were sent through a staff session. Names on other posts are not verified.</p>
      </div>

      {error && <p role="status" className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">{error}</p>}

      {/* Post form */}
      <form onSubmit={handleSubmit} className="mb-6 bg-slate-800/60 border border-slate-700 rounded-xl p-4 sm:p-5 space-y-3">
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Your Name (optional)</label>
            <input
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
              placeholder="Anonymous"
              value={form.author}
              onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
            />
          </div>
          <div>
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
              <div key={post.id} className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-sm font-bold text-white ${color}`}>
                  {initial}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className="font-medium text-slate-200 text-sm break-all">{author}</span>
                      {['admin', 'operator'].includes(post.author_role) ? (
                        <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-300">✓ Verified {post.author_role === 'admin' ? 'administrator' : 'operator'}</span>
                      ) : (
                        <span className="rounded-full border border-slate-600 px-2 py-0.5 text-xs text-slate-400">Unverified</span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">{new Date(post.created_at).toLocaleString()}</span>
                  </div>
                  {post.reply_to_id && (
                    <div className="mt-2 rounded border-l-2 border-blue-500 bg-slate-900/60 p-2 text-xs text-slate-400 break-words">
                      {post.reply_to_message ? <>Reply to {post.reply_to_author}: {post.reply_to_message}</> : 'Reply to a message that is no longer available'}
                    </div>
                  )}
                  <p className="text-slate-300 text-sm mt-1 leading-relaxed break-words whitespace-pre-wrap">{post.message}</p>
                </div>
                {!['admin', 'operator'].includes(post.author_role) && <button
                  onClick={() => handleDelete(post.id)}
                  className="shrink-0 text-slate-600 hover:text-red-400 transition-colors self-start mt-0.5"
                  title="Delete post"
                >
                  🗑️
                </button>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
