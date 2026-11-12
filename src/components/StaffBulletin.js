'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminFetch } from '@/components/PinGate';

export default function StaffBulletin() {
  const [posts, setPosts] = useState([]);
  const [message, setMessage] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const loadPosts = async () => {
    try {
      const response = await fetch('/api/bulletin', { cache: 'no-store' });
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error();
      setPosts(data);
    } catch {
      setError('Could not load bulletin messages. Check your connection.');
    }
  };

  useEffect(() => {
    const initial = setTimeout(loadPosts, 0);
    const interval = setInterval(loadPosts, 5000);
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') loadPosts();
    };
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setStatus('');
    setBusy(true);
    try {
      const response = await adminFetch('/api/bulletin/staff', {
        method: 'POST',
        body: JSON.stringify({ message, replyToId: replyTo?.id ?? null }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not post the message.');
      setMessage('');
      setReplyTo(null);
      setStatus('Your verified message was posted.');
      await loadPosts();
    } catch (err) {
      setError(err.message || 'Could not post the message. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this verified message?')) return;
    try {
      const response = await adminFetch('/api/bulletin?id=' + id, { method: 'DELETE' });
      if (!response.ok) throw new Error('Could not delete this message.');
      await loadPosts();
    } catch (err) {
      setError(err.message || 'Could not delete this message.');
    }
  };

  return (
    <section className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-100">Verified bulletin messages</h2>
          <p className="text-xs text-slate-400 mt-1">Post a notice or reply as your signed-in staff role.</p>
        </div>
        <Link href="/bulletin" className="text-sm text-blue-400 hover:text-blue-300">View public board →</Link>
      </div>
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      {status && <p role="status" className="text-sm text-emerald-400">{status}</p>}
      <form onSubmit={submit} className="space-y-3">
        {replyTo && (
          <div className="rounded-lg bg-slate-900 border border-slate-700 p-3 text-xs text-slate-300">
            Replying to <strong>{replyTo.author}</strong>: {replyTo.message}
            <button type="button" onClick={() => setReplyTo(null)} className="ml-2 text-blue-400 underline">Cancel reply</button>
          </div>
        )}
        <label htmlFor="staff-bulletin-message" className="block text-xs text-slate-400">Message</label>
        <textarea id="staff-bulletin-message" value={message} onChange={(event) => setMessage(event.target.value)}
          rows={3} maxLength={500} required placeholder="Write a verified message..."
          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100" />
        <button type="submit" disabled={busy || !message.trim()} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium">
          {busy ? 'Posting…' : replyTo ? 'Post verified reply' : 'Post verified message'}
        </button>
      </form>
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-slate-300">Recent messages</h3>
        {posts.length === 0 && <p className="text-sm text-slate-500">No messages to display.</p>}
        {posts.map((post) => (
          <div key={post.id} className="rounded-lg border border-slate-700 bg-slate-900/60 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium text-slate-200">
                {post.author} {['admin', 'operator'].includes(post.author_role) && <span className="text-xs text-emerald-400">✓ Verified {post.author_role === 'admin' ? 'administrator' : 'operator'}</span>}
              </span>
              <div className="flex gap-3">
                <button type="button" onClick={() => { setReplyTo(post); setStatus(''); }} className="text-xs text-blue-400 hover:text-blue-300">Reply</button>
                {['admin', 'operator'].includes(post.author_role) && <button type="button" onClick={() => remove(post.id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>}
              </div>
            </div>
            <p className="mt-1 text-sm text-slate-300 break-words whitespace-pre-wrap">{post.message}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
