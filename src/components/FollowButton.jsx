'use client';
import { useState, useMemo} from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function FollowButton({ targetUserId, currentUserId, initialFollowing = false, compact = false }) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  if (currentUserId === targetUserId) return null;

  async function toggle(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!currentUserId) {
      router.push('/login?redirectTo=' + encodeURIComponent(window.location.pathname));
      return;
    }

    setLoading(true);
    const prev = following;
    setFollowing(!following); // optimistic
    try {
      if (prev) {
        await fetch('/api/follows', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ following_id: targetUserId }),
        });
      } else {
        await fetch('/api/follows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ following_id: targetUserId }),
        });
      }
    } catch {
      setFollowing(prev); // rollback
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      style={{
        padding: compact ? '0.4rem 1.1rem' : '0.6rem 1.5rem',
        border: '1px solid',
        borderColor: following ? '#e8e8e8' : '#231f20',
        background: following ? 'white' : '#231f20',
        color: following ? '#6b6b6b' : 'white',
        fontSize: compact ? '0.8rem' : '0.875rem',
        fontWeight: 700,
        borderRadius: '24px',
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'background 0.15s, color 0.15s, border-color 0.15s',
        fontFamily: 'inherit',
        opacity: loading ? 0.7 : 1,
        flexShrink: 0,
        whiteSpace: 'nowrap',
      }}
    >
      {following ? 'Following' : 'Follow'}
    </button>
  );
}
