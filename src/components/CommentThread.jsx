'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import UserAvatar from './UserAvatar';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function CommentThread({ targetId, targetType = 'project', comments: initialComments = [], currentUser }) {
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const supabase = createClient();

  const table = targetType === 'project' ? 'project_comments' : 'post_comments';
  const fk = targetType === 'project' ? 'project_id' : 'post_id';

  async function submit(e) {
    e.preventDefault();
    if (!body.trim() || !currentUser) return;
    setSubmitting(true);
    const newComment = {
      [fk]: targetId,
      user_id: currentUser.id,
      body: body.trim(),
    };
    const { data, error } = await supabase.from(table).insert(newComment).select('*, profiles(username, full_name, avatar_url)').single();
    if (!error && data) {
      setComments(prev => [...prev, data]);
      setBody('');
    }
    setSubmitting(false);
  }

  return (
    <div>
      {/* Comment list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {comments.map(c => (
          <div key={c.id} style={{ display: 'flex', gap: '0.75rem' }}>
            <UserAvatar src={c.profiles?.avatar_url} name={c.profiles?.full_name || c.profiles?.username} size={32} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.3rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{c.profiles?.full_name || c.profiles?.username || 'User'}</span>
                <span style={{ fontSize: '0.75rem', color: '#9b9b9b' }}>{timeAgo(c.created_at)}</span>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#0a0a0a', lineHeight: 1.5 }}>{c.body}</p>
            </div>
          </div>
        ))}
        {comments.length === 0 && (
          <p style={{ color: '#9b9b9b', fontSize: '0.85rem', textAlign: 'center', padding: '1.5rem 0' }}>No comments yet. Be the first!</p>
        )}
      </div>

      {/* Comment input */}
      {currentUser && (
        <form onSubmit={submit} style={{ display: 'flex', gap: '0.75rem' }}>
          <UserAvatar src={currentUser.avatar_url} name={currentUser.full_name || currentUser.username} size={32} />
          <div style={{ flex: 1, display: 'flex', gap: '0.5rem' }}>
            <input
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Write a comment..."
              style={{
                flex: 1, padding: '0.5rem 0.75rem',
                border: '1px solid #e8e8e8', background: 'white',
                fontSize: '0.875rem', outline: 'none', borderRadius: '0px',
                fontFamily: 'inherit', color: '#0a0a0a',
              }}
              onFocus={e => e.target.style.borderColor = '#0a0a0a'}
              onBlur={e => e.target.style.borderColor = '#e8e8e8'}
            />
            <button
              type="submit"
              disabled={submitting || !body.trim()}
              style={{
                padding: '0.5rem 1rem', background: '#0a0a0a', color: 'white',
                border: 'none', fontSize: '0.8rem', fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: !body.trim() ? 0.4 : 1, fontFamily: 'inherit', borderRadius: '0px',
              }}
            >
              Post
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
