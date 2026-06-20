'use client';
import Link from 'next/link';
import UserAvatar from '@/components/ui/UserAvatar';
import { MessageCircle, ArrowUp, Link as LinkIcon } from 'lucide-react';

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
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function PostCard({ post, userVoted = false, onVote }) {
  const author = post.profiles;
  const flair  = FLAIR_COLORS[post.flair] || FLAIR_COLORS.general;

  function handleVote(e) {
    e.preventDefault();
    onVote?.(post.id, userVoted);
  }

  return (
    <Link
      href={`/community/${post.id}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
    >
      <article
        style={{
          background: 'white',
          border: '1px solid #e8e8e8',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          cursor: 'pointer',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.borderColor = '#2d43e8';
          e.currentTarget.style.boxShadow  = '0 2px 12px rgba(45,67,232,0.08)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.borderColor = '#e8e8e8';
          e.currentTarget.style.boxShadow  = 'none';
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
          <UserAvatar
            src={author?.avatar_url}
            name={author?.full_name || author?.username}
            size={24}
          />
          <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
            {author?.full_name || author?.username || 'Desayner'}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{timeAgo(post.created_at)}</span>

          {/* Flair badge */}
          <span style={{
            marginLeft: 'auto',
            fontSize: '0.7rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: '0.2rem 0.55rem',
            borderRadius: '20px',
            background: flair.bg,
            color: flair.color,
            flexShrink: 0,
          }}>
            {post.flair}
          </span>
        </div>

        {/* Title */}
        <h3 style={{
          fontSize: '0.95rem',
          fontWeight: 800,
          color: '#0f172a',
          margin: '0 0 0.4rem 0',
          lineHeight: 1.3,
          letterSpacing: '-0.01em',
        }}>
          {post.title}
        </h3>

        {/* Body preview */}
        {post.body && (
          <p style={{
            fontSize: '0.82rem',
            color: '#64748b',
            lineHeight: 1.55,
            margin: '0 0 0.75rem 0',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {post.body}
          </p>
        )}

        {/* Image thumbnail */}
        {post.image_url && (
          <img
            src={post.image_url}
            alt={post.title}
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: '600px',
              objectFit: 'cover',
              borderRadius: '8px',
              marginBottom: '1rem',
              display: 'block',
            }}
            loading="lazy"
          />
        )}

        {/* Link preview */}
        {post.link_url && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.75rem',
            color: '#2d43e8',
            marginBottom: '0.75rem',
            overflow: 'hidden',
          }}>
            <LinkIcon size={12} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {post.link_url.replace(/^https?:\/\//, '')}
            </span>
          </div>
        )}

        {/* Footer: votes + comments */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.25rem' }}>
          {/* Upvote button */}
          <button
            onClick={handleVote}
            title={userVoted ? 'Remove upvote' : 'Upvote'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.3rem 0.65rem',
              borderRadius: '20px',
              border: '1px solid',
              borderColor: userVoted ? '#2d43e8' : '#e2e8f0',
              background: userVoted ? '#eff1ff' : 'transparent',
              color: userVoted ? '#2d43e8' : '#64748b',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s',
              fontFamily: 'inherit',
            }}
          >
            <ArrowUp size={14} strokeWidth={2.5} />
            {post.votes_count}
          </button>

          {/* Comments */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>
            <MessageCircle size={14} />
            {post.comments_count}
          </div>
        </div>
      </article>
    </Link>
  );
}
