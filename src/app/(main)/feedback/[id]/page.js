'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Eye, MessageCircle, ThumbsUp, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import UserAvatar from '@/components/UserAvatar';
import '../Feedback.css';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const STATUS_STYLES = {
  open: { label: 'Open', bg: '#e0f2fe', color: '#0369a1' },
  closed: { label: 'Closed', bg: '#f1f5f9', color: '#64748b' },
  implemented: { label: 'Implemented', bg: '#d1fae5', color: '#059669' },
};

const FEEDBACK_TYPE_LABELS = {
  typography: 'Typography',
  colors: 'Colors',
  layout: 'Layout',
  general: 'General',
  'ui/ux': 'UI/UX',
  branding: 'Branding',
  illustration: 'Illustration',
};

export default function FeedbackDetailPage({ params }) {
  const [feedback, setFeedback] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentBody, setCommentBody] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [replyBody, setReplyBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showLightbox, setShowLightbox] = useState(false);
  const [error, setError] = useState(null);

  const supabase = createClient();
  const [feedbackId, setFeedbackId] = useState(null);

  // Resolve params (Next.js 16 passes params as a Promise)
  useEffect(() => {
    Promise.resolve(params).then(p => setFeedbackId(p?.id));
  }, [params]);

  // Load feedback data (feedback first, then comments separately for speed)
  useEffect(() => {
    if (!feedbackId) return;

    // Load feedback immediately
    fetch(`/api/feedback/${feedbackId}`)
      .then(res => res.json())
      .then(data => {
        if (data.feedback) setFeedback(data.feedback);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Load comments after (non-blocking)
    fetch(`/api/feedback/${feedbackId}/comments`)
      .then(res => res.json())
      .then(data => {
        if (data.comments) setComments(data.comments);
      })
      .catch(() => {});

    // Track view (fire-and-forget)
    fetch(`/api/feedback/${feedbackId}/views`, { method: 'POST' });

    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, [feedbackId, supabase]);

  // Add comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentBody.trim()) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/feedback/${feedbackId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: commentBody.trim() }),
      });

      const data = await res.json();
      if (data.comment) {
        setComments(prev => [...prev, { ...data.comment, replies: [] }]);
        setCommentBody('');
      }
    } catch (err) {
      console.error('Comment failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Add reply
  const handleAddReply = async (commentId, e) => {
    e.preventDefault();
    if (!replyBody.trim()) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/feedback/${feedbackId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: replyBody.trim(), parent_id: commentId }),
      });

      const data = await res.json();
      if (data.comment) {
        setComments(prev =>
          prev.map(c =>
            c.id === commentId
              ? { ...c, replies: [...(c.replies || []), data.comment] }
              : c
          )
        );
        setReplyBody('');
        setReplyTo(null);
      }
    } catch (err) {
      console.error('Reply failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle helpful
  const handleToggleHelpful = async (commentId) => {
    try {
      const res = await fetch(
        `/api/feedback/${feedbackId}/comments/${commentId}/helpful`,
        { method: 'POST' }
      );
      const data = await res.json();

      setComments(prev =>
        prev.map(c => ({
          ...c,
          user_helpful: c.id === commentId ? data.helpful : c.user_helpful,
          replies: (c.replies || []).map(r =>
            r.id === commentId ? { ...r, user_helpful: data.helpful } : r
          ),
        }))
      );
    } catch (err) {
      console.error('Helpful toggle failed:', err);
    }
  };

  // Change status (owner only)
  const handleStatusChange = async (newStatus) => {
    try {
      const res = await fetch(`/api/feedback/${feedbackId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.feedback) {
        setFeedback(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error('Status change failed:', err);
    }
  };

  // Delete feedback (owner only)
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this feedback request?')) return;
    try {
      await fetch(`/api/feedback/${feedbackId}`, { method: 'DELETE' });
      window.location.href = '/feedback';
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="feedback-detail">
        <div className="feedback-detail__topbar">
          <Link href="/feedback" className="feedback-detail__back">
            <ArrowLeft size={15} /> Back to Feedback
          </Link>
        </div>
        <div className="feedback-skeleton-card">
          <div className="feedback-skeleton-image" style={{ aspectRatio: '16/9' }} />
          <div className="feedback-skeleton-body">
            <div className="feedback-skeleton-title" />
            <div className="feedback-skeleton-text" />
            <div className="feedback-skeleton-text" />
          </div>
        </div>
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className="feedback-detail" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
        <h2>Feedback not found</h2>
        <Link href="/feedback" className="feedback-detail__back">
          <ArrowLeft size={15} /> Back to Feedback
        </Link>
      </div>
    );
  }

  const author = feedback.profiles;
  const status = STATUS_STYLES[feedback.status] || STATUS_STYLES.open;
  const feedbackTypes = feedback.feedback_type || [];
  const isOwner = currentUserId === feedback.user_id;

  return (
    <div className="feedback-detail">
      {/* Topbar */}
      <div className="feedback-detail__topbar">
        <Link href="/feedback" className="feedback-detail__back">
          <ArrowLeft size={15} /> Back to Feedback
        </Link>
      </div>

      {/* Main Card */}
      <div className="feedback-detail__main">
        {/* Design Image */}
        {feedback.image_url && (
          <div className="feedback-detail__image-container" onClick={() => setShowLightbox(true)}>
            <img
              src={feedback.image_url}
              alt={feedback.title}
              style={{ width: '100%', height: 'auto', display: 'block' }}
              loading="eager"
              fetchPriority="high"
            />
          </div>
        )}

        {/* Info */}
        <div className="feedback-detail__info">
          {/* Status */}
          <div
            className="feedback-detail__status"
            style={{ background: status.bg, color: status.color }}
          >
            {status.label}
          </div>

          <h1 className="feedback-detail__title">{feedback.title}</h1>

          {feedback.description && (
            <p className="feedback-detail__desc">{feedback.description}</p>
          )}

          {/* Types */}
          {feedbackTypes.length > 0 && (
            <div className="feedback-detail__types">
              {feedbackTypes.map(type => (
                <span key={type} className="feedback-detail__type-tag">
                  {FEEDBACK_TYPE_LABELS[type] || type}
                </span>
              ))}
            </div>
          )}

          {/* Meta */}
          <div className="feedback-detail__meta">
            {author && (
              <Link href={author.username ? `/profile/${author.username}` : '#'} className="feedback-detail__meta-author">
                <UserAvatar src={author.avatar_url} name={author.full_name || author.username} size={28} />
                <span className="feedback-detail__meta-author-name">
                  {author.full_name || author.username}
                </span>
              </Link>
            )}
            <div className="feedback-detail__meta-stats">
              <div className="feedback-detail__meta-stat">
                <Eye size={14} /> {feedback.views_count || 0} views
              </div>
              <div className="feedback-detail__meta-stat">
                <MessageCircle size={14} /> {feedback.comments_count || 0}
              </div>
              <div className="feedback-detail__meta-stat">
                <Clock size={14} /> {timeAgo(feedback.created_at)}
              </div>
            </div>
          </div>

          {/* Owner Actions */}
          {isOwner && (
            <div className="feedback-detail__actions">
              {feedback.status !== 'closed' && (
                <button
                  className="feedback-detail__action-btn feedback-detail__action-btn--close"
                  onClick={() => handleStatusChange('closed')}
                >
                  Close Feedback
                </button>
              )}
              {feedback.status !== 'implemented' && (
                <button
                  className="feedback-detail__action-btn feedback-detail__action-btn--implement"
                  onClick={() => handleStatusChange('implemented')}
                >
                  Mark Implemented
                </button>
              )}
              {feedback.status !== 'open' && (
                <button
                  className="feedback-detail__action-btn feedback-detail__action-btn--reopen"
                  onClick={() => handleStatusChange('open')}
                >
                  Reopen
                </button>
              )}
              <button
                className="feedback-detail__action-btn"
                onClick={handleDelete}
                style={{ marginLeft: 'auto', color: '#dc2626' }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Comments */}
      <div className="feedback-comments">
        <div className="feedback-comments__header">
          Feedback ({comments.length})
        </div>

        {comments.length > 0 ? (
          <div className="feedback-comments__list">
            {comments.map(comment => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={currentUserId}
                onHelpful={handleToggleHelpful}
                onReply={handleAddReply}
                replyTo={replyTo}
                setReplyTo={setReplyTo}
                replyBody={replyBody}
                setReplyBody={setReplyBody}
                submitting={submitting}
              />
            ))}
          </div>
        ) : (
          <div className="feedback-comments__empty">
            No comments yet. Be the first to give feedback!
          </div>
        )}

        {/* Add Comment Form */}
        {currentUserId ? (
          <form className="feedback-comments__form" onSubmit={handleAddComment}>
            <textarea
              className="feedback-comments__input"
              placeholder="Share your thoughts on this design..."
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              rows={2}
            />
            <button
              type="submit"
              className="feedback-comments__submit"
              disabled={!commentBody.trim() || submitting}
            >
              Post
            </button>
          </form>
        ) : (
          <div className="feedback-comments__form" style={{ justifyContent: 'center' }}>
            <a href="/login" className="feedback-comments__submit" style={{ textDecoration: 'none', textAlign: 'center' }}>
              Sign in to comment
            </a>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {showLightbox && feedback.image_url && (
        <div className="feedback-lightbox" onClick={() => setShowLightbox(false)}>
          <button className="feedback-lightbox__close" onClick={() => setShowLightbox(false)}>
            ×
          </button>
          <img
            src={feedback.image_url}
            alt={feedback.title}
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Comment Item Component ───────────────────────────────────────────────
function CommentItem({ comment, currentUserId, onHelpful, onReply, replyTo, setReplyTo, replyBody, setReplyBody, submitting }) {
  const author = comment.profiles;

  return (
    <div className="feedback-comment-item">
      <div className="feedback-comment">
        {author && (
          <Link href={author.username ? `/profile/${author.username}` : '#'}>
            <UserAvatar src={author.avatar_url} name={author.full_name || author.username} size={28} />
          </Link>
        )}
        <div className="feedback-comment__body">
          <div className="feedback-comment__meta">
            {author && (
              <Link href={author.username ? `/profile/${author.username}` : '#'} className="feedback-comment__name">
                {author.full_name || author.username}
              </Link>
            )}
            <span className="feedback-comment__time">{timeAgo(comment.created_at)}</span>
          </div>
          <p className="feedback-comment__text">{comment.body}</p>
          <div className="feedback-comment__actions">
            {currentUserId && (
              <button
                className={`feedback-comment__action ${comment.user_helpful ? 'feedback-comment__action--helpful' : ''}`}
                onClick={() => onHelpful(comment.id)}
              >
                <ThumbsUp size={12} fill={comment.user_helpful ? 'currentColor' : 'none'} />
                Helpful
              </button>
            )}
            {currentUserId && (
              <button
                className="feedback-comment__action"
                onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
              >
                Reply
              </button>
            )}
          </div>

          {/* Reply Form */}
          {replyTo === comment.id && (
            <form className="feedback-reply-form" onSubmit={(e) => onReply(comment.id, e)}>
              <input
                className="feedback-reply-form__input"
                placeholder="Write a reply..."
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                autoFocus
              />
              <button type="submit" className="feedback-reply-form__submit" disabled={submitting || !replyBody.trim()}>
                Reply
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="feedback-comment__replies">
          {comment.replies.map(reply => (
            <div key={reply.id} className="feedback-comment">
              {reply.profiles && (
                <Link href={reply.profiles.username ? `/profile/${reply.profiles.username}` : '#'}>
                  <UserAvatar src={reply.profiles.avatar_url} name={reply.profiles.full_name || reply.profiles.username} size={22} />
                </Link>
              )}
              <div className="feedback-comment__body">
                <div className="feedback-comment__meta">
                  {reply.profiles && (
                    <Link href={reply.profiles.username ? `/profile/${reply.profiles.username}` : '#'} className="feedback-comment__name">
                      {reply.profiles.full_name || reply.profiles.username}
                    </Link>
                  )}
                  <span className="feedback-comment__time">{timeAgo(reply.created_at)}</span>
                </div>
                <p className="feedback-comment__text">{reply.body}</p>
                <div className="feedback-comment__actions">
                  {currentUserId && (
                    <button
                      className={`feedback-comment__action ${reply.user_helpful ? 'feedback-comment__action--helpful' : ''}`}
                      onClick={() => onHelpful(reply.id)}
                    >
                      <ThumbsUp size={12} fill={reply.user_helpful ? 'currentColor' : 'none'} />
                      Helpful
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}