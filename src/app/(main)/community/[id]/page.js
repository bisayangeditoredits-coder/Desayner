'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { createClient } from '@/lib/supabase/client';
import UserAvatar from '@/components/ui/UserAvatar';
import PostComments from '@/components/community/PostComments';
import ReportModal from '@/components/community/ReportModal';
import useProfileStore from '@/store/useProfileStore';
import useToastStore from '@/store/useToastStore';
import {
  ArrowUp, MessageCircle, Link as LinkIcon,
  Flag, Trash2, ArrowLeft, Loader2, ExternalLink,
} from 'lucide-react';

const FLAIR_COLORS = {
  general:  { bg: '#f1f5f9', color: '#475569' },
  question: { bg: '#eff6ff', color: '#2563eb' },
  help:     { bg: '#f0fdf4', color: '#16a34a' },
  feedback: { bg: '#fdf4ff', color: '#9333ea' },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

async function fetcher(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Not found');
  return res.json();
}

export default function PostDetailPage({ params: paramsPromise }) {
  const { id } = React.use(paramsPromise);
  const router  = useRouter();
  const user    = useProfileStore((s) => s.user);
  const profile = useProfileStore((s) => s.profile);
  const addToast = useToastStore((s) => s.addToast);
  const supabase = useMemo(() => createClient(), []);

  const { data, error, isLoading, mutate } = useSWR(`/api/community/posts/${id}`, fetcher);

  const [voted,       setVoted]       = useState(false);
  const [voteCount,   setVoteCount]   = useState(0);
  const [showReport,  setShowReport]  = useState(false);
  const [deleting,    setDeleting]    = useState(false);

  // Sync server vote count into local state
  useEffect(() => {
    if (data?.post) setVoteCount(data.post.votes_count);
  }, [data?.post?.votes_count]);

  // Check if current user already voted
  useEffect(() => {
    if (!user || !data?.post) return;
    supabase
      .from('community_post_votes')
      .select('post_id')
      .eq('post_id', id)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data: v }) => setVoted(!!v));
  }, [user, id, data?.post, supabase]);

  async function handleVote() {
    if (!user) { router.push('/login?redirectTo=/community/' + id); return; }

    const wasVoted = voted;
    setVoted(!wasVoted);
    setVoteCount((c) => wasVoted ? c - 1 : c + 1);

    const res = await fetch(`/api/community/posts/${id}/vote`, {
      method: wasVoted ? 'DELETE' : 'POST',
    });
    if (!res.ok) {
      setVoted(wasVoted);
      setVoteCount((c) => wasVoted ? c + 1 : c - 1);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    setDeleting(true);
    const res = await fetch(`/api/community/posts/${id}`, { method: 'PATCH' });
    if (res.ok) {
      addToast({ type: 'success', message: 'Post deleted.' });
      router.push('/community');
    } else {
      addToast({ type: 'error', message: 'Could not delete post.' });
    }
    setDeleting(false);
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '1.5rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="shimmer-box" style={{ height: 28, width: '60%', borderRadius: 6 }} />
        <div className="shimmer-box" style={{ height: 16, width: '40%', borderRadius: 6 }} />
        <div className="shimmer-box" style={{ height: 120, width: '100%', borderRadius: 10 }} />
      </div>
    </div>
  );

  if (error || !data?.post) return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '3rem 1.5rem', textAlign: 'center' }}>
      <p style={{ color: '#64748b', fontSize: '1rem' }}>Post not found or has been deleted.</p>
      <Link href="/community" style={{ color: '#2d43e8', fontWeight: 700, textDecoration: 'none', fontSize: '0.875rem' }}>
        ← Back to Community
      </Link>
    </div>
  );

  const { post, comments } = data;
  const author = post.profiles;
  const flair  = FLAIR_COLORS[post.flair] || FLAIR_COLORS.general;
  const isAuthor = user?.id === post.user_id;

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '1.5rem' }}>

      {/* Back nav */}
      <Link
        href="/community"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          color: '#64748b', fontSize: '0.83rem', fontWeight: 600,
          textDecoration: 'none', marginBottom: '1.25rem',
          transition: 'color 0.15s',
        }}
        onMouseOver={(e) => e.currentTarget.style.color = '#0f172a'}
        onMouseOut={(e) => e.currentTarget.style.color = '#64748b'}
      >
        <ArrowLeft size={14} /> Community
      </Link>

      {/* Post card */}
      <article style={{
        background: 'white',
        border: '1px solid #e8e8e8',
        borderRadius: '16px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
      }}>
        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <Link href={`/profile/${author?.username}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            <UserAvatar src={author?.avatar_url} name={author?.full_name || author?.username} size={28} />
            <span style={{ fontSize: '0.83rem', fontWeight: 700, color: '#0f172a' }}>
              {author?.full_name || author?.username}
            </span>
          </Link>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{timeAgo(post.created_at)}</span>

          {/* Flair */}
          <span style={{
            fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.05em', padding: '0.2rem 0.55rem', borderRadius: '20px',
            background: flair.bg, color: flair.color,
          }}>
            {post.flair}
          </span>

          {/* Actions */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {isAuthor && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                title="Delete post"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', padding: '4px', transition: 'color 0.15s' }}
                onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
                onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
              >
                {deleting ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={15} />}
              </button>
            )}
            <button
              onClick={() => user ? setShowReport(true) : router.push('/login?redirectTo=/community/' + id)}
              title="Report post"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', padding: '4px', transition: 'color 0.15s' }}
              onMouseOver={(e) => e.currentTarget.style.color = '#f97316'}
              onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
            >
              <Flag size={15} />
            </button>
          </div>
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: 'clamp(1.1rem, 3vw, 1.4rem)',
          fontWeight: 900, color: '#0f172a',
          margin: '0 0 1rem 0', lineHeight: 1.3, letterSpacing: '-0.02em',
        }}>
          {post.title}
        </h1>

        {/* Image */}
        {post.image_url && (
          <img
            src={post.image_url}
            alt={post.title}
            style={{ width: '100%', height: 'auto', maxHeight: '600px', objectFit: 'cover', borderRadius: '10px', marginBottom: '1rem', display: 'block' }}
          />
        )}

        {/* Body */}
        {post.body && (
          <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.7, margin: '0 0 1rem 0', whiteSpace: 'pre-wrap' }}>
            {post.body}
          </p>
        )}

        {/* Link */}
        {post.link_url && (
          <a
            href={post.link_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.5rem 0.9rem', borderRadius: '8px',
              background: '#f1f5f9', color: '#2d43e8',
              fontSize: '0.82rem', fontWeight: 600,
              textDecoration: 'none', marginBottom: '1rem',
              transition: 'background 0.15s',
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#e2e8f0'}
            onMouseOut={(e) => e.currentTarget.style.background = '#f1f5f9'}
          >
            <ExternalLink size={13} />
            {post.link_url.replace(/^https?:\/\//, '').slice(0, 60)}
            {post.link_url.length > 60 && '…'}
          </a>
        )}

        {/* Footer: vote + comment count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
          <button
            onClick={handleVote}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.4rem 0.9rem', borderRadius: '20px',
              border: '1.5px solid',
              borderColor: voted ? '#2d43e8' : '#e2e8f0',
              background:  voted ? '#eff1ff' : 'white',
              color:       voted ? '#2d43e8' : '#64748b',
              fontSize: '0.875rem', fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
          >
            <ArrowUp size={15} strokeWidth={2.5} />
            {voteCount} {voteCount === 1 ? 'upvote' : 'upvotes'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>
            <MessageCircle size={15} />
            {post.comments_count} comment{post.comments_count !== 1 ? 's' : ''}
          </div>
        </div>
      </article>

      {/* Comments */}
      <div style={{
        background: 'white',
        border: '1px solid #e8e8e8',
        borderRadius: '16px',
        padding: '1.5rem',
      }}>
        <PostComments
          postId={id}
          initialComments={comments || []}
          currentUser={profile}
        />
      </div>

      {/* Report modal */}
      {showReport && <ReportModal postId={id} onClose={() => setShowReport(false)} />}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
