'use client';
import { useState, useMemo, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import useToastStore from '@/store/useToastStore';

export default function FollowButton({ targetUserId, currentUserId, initialFollowing = false, compact = false, variant = 'solid' }) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);

  useEffect(() => {
    setFollowing(initialFollowing);
  }, [initialFollowing]);

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
      const res = await fetch('/api/follows', {
        method: prev ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ following_id: targetUserId }),
      });
      if (!res.ok) throw new Error('Follow request failed');
      // ✅ Success feedback
      if (prev) {
        addToast({ type: 'info', message: 'Unfollowed successfully.' });
      } else {
        addToast({ type: 'follow', title: 'Following!', message: 'You will see their latest work in your feed.' });
      }
    } catch {
      setFollowing(prev);
      addToast({ type: 'error', message: 'Could not update follow. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  if (variant === 'text') {
    return (
      <button
        onClick={toggle}
        disabled={loading}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          color: following ? '#64748b' : '#0f172a',
          fontSize: '0.85rem',
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {following ? 'Following' : 'Follow'}
      </button>
    );
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
