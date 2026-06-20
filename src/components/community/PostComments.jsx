'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import UserAvatar from '@/components/ui/UserAvatar';
import useToastStore from '@/store/useToastStore';
import { Trash2 } from 'lucide-react';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function PostComments({ postId, initialComments = [], currentUser }) {
  const [comments, setComments]   = useState(initialComments);
  const [body, setBody]           = useState('');
  const [submitting, setSubmitting] = useState(false);
  const addToast = useToastStore((s) => s.addToast);
  const supabase = useMemo(() => createClient(), []);
  const bottomRef = useRef(null);

  // Supabase Realtime — live comments on the detail page only
  useEffect(() => {
    const channel = supabase
      .channel(`community_post_comments_${postId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_post_comments',
          filter: `post_id=eq.${postId}`,
        },
        async (payload) => {
          // Fetch the new comment with profile data
          const { data } = await supabase
            .from('community_post_comments')
            .select('id, body, parent_id, created_at, user_id, profiles!community_post_comments_user_id_fkey(username, full_name, avatar_url)')
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setComments((prev) => {
              if (prev.some((c) => c.id === data.id)) return prev; // dedup
              return [...prev, data];
            });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [postId, supabase]);

  async function submit(e) {
    e.preventDefault();
    const text = body.trim();
    if (!text || !currentUser) return;
    setSubmitting(true);

    // Optimistic insert
    const optimistic = {
      id: `optimistic-${Date.now()}`,
      body: text,
      parent_id: null,
      created_at: new Date().toISOString(),
      user_id: currentUser.id,
      profiles: {
        username:  currentUser.username,
        full_name: currentUser.full_name,
        avatar_url: currentUser.avatar_url,
      },
    };
    setComments((prev) => [...prev, optimistic]);
    setBody('');

    const res = await fetch(`/api/community/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: text }),
    });

    if (!res.ok) {
      // Revert
      setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
      addToast({ type: 'error', message: 'Could not post comment. Try again.' });
    }
    setSubmitting(false);
  }

  async function deleteComment(id) {
    if (!window.confirm('Delete this comment?')) return;
    
    // Use the server API route to handle deletion securely
    const res = await fetch(`/api/community/comments/${id}`, {
      method: 'PATCH',
    });

    if (res.ok) {
      setComments((prev) => prev.filter((c) => c.id !== id));
      addToast({ type: 'success', message: 'Comment deleted.' });
    } else {
      addToast({ type: 'error', message: 'Could not delete comment.' });
    }
  }

  return (
    <div>
      <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.25rem', letterSpacing: '-0.01em' }}>
        {comments.length} Comment{comments.length !== 1 ? 's' : ''}
      </h2>

      {/* Comment input */}
      {currentUser ? (
        <form onSubmit={submit} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.75rem' }}>
          <UserAvatar src={currentUser.avatar_url} name={currentUser.full_name || currentUser.username} size={36} />
          <div style={{ flex: 1 }}>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share your thoughts..."
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1.5px solid #e8e8e8',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontFamily: 'inherit',
                color: '#0f172a',
                resize: 'vertical',
                outline: 'none',
                background: '#fafafa',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#2d43e8'}
              onBlur={(e) => e.target.style.borderColor = '#e8e8e8'}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                type="submit"
                disabled={submitting || !body.trim()}
                style={{
                  padding: '0.5rem 1.25rem',
                  background: '#231f20',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  cursor: submitting || !body.trim() ? 'not-allowed' : 'pointer',
                  opacity: !body.trim() ? 0.4 : 1,
                  fontFamily: 'inherit',
                  transition: 'background 0.15s, opacity 0.15s',
                }}
                onMouseOver={(e) => body.trim() && !submitting && (e.currentTarget.style.background = '#2d43e8')}
                onMouseOut={(e) => e.currentTarget.style.background = '#231f20'}
              >
                {submitting ? 'Posting…' : 'Comment'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div style={{
          background: '#f8fafc',
          border: '1px dashed #cbd5e1',
          borderRadius: '8px',
          padding: '1rem',
          textAlign: 'center',
          marginBottom: '1.75rem',
          fontSize: '0.875rem',
          color: '#64748b',
        }}>
          <a href="/login?redirectTo=/community" style={{ color: '#2d43e8', fontWeight: 700, textDecoration: 'none' }}>Log in</a> to join the discussion
        </div>
      )}

      {/* Comment list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {comments.map((c) => (
          <div key={c.id} style={{ display: 'flex', gap: '0.75rem' }}>
            <UserAvatar src={c.profiles?.avatar_url} name={c.profiles?.full_name || c.profiles?.username} size={32} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.83rem', color: '#0f172a' }}>
                  {c.profiles?.full_name || c.profiles?.username || 'User'}
                </span>
                <span style={{ fontSize: '0.73rem', color: '#94a3b8' }}>{timeAgo(c.created_at)}</span>
                {currentUser?.id === c.user_id && (
                  <button
                    onClick={() => deleteComment(c.id)}
                    title="Delete comment"
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex', alignItems: 'center' }}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
              <p style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.6, margin: 0 }}>{c.body}</p>
            </div>
          </div>
        ))}

        {comments.length === 0 && (
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', padding: '2rem 0' }}>
            No comments yet — start the conversation!
          </p>
        )}
      </div>
      <div ref={bottomRef} />
    </div>
  );
}
