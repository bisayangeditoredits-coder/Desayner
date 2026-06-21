'use client';
import { useState, useCallback } from 'react';
import useSWRInfinite from 'swr/infinite';
import PostCard from './PostCard';
import useProfileStore from '@/store/useProfileStore';
import { Loader2 } from 'lucide-react';

const PAGE_SIZE = 20;

async function fetcher(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load posts');
  return res.json();
}

function getKey(sort, flair) {
  return (pageIndex, prev) => {
    if (prev && (!prev.posts || prev.posts.length < PAGE_SIZE)) return null;
    return `/api/community/posts?sort=${sort}&flair=${flair}&page=${pageIndex + 1}`;
  };
}

export default function PostFeed({ sort, flair }) {
  const user = useProfileStore((s) => s.user);

  // Local optimistic vote state: Map<postId, boolean>
  const [votes, setVotes] = useState({});

  const { data, error, size, setSize, isLoading, mutate } = useSWRInfinite(
    getKey(sort, flair),
    fetcher,
    { revalidateFirstPage: true, parallel: false }
  );

  const posts    = data ? data.flatMap((p) => p.posts || []) : [];
  const isEmpty  = !isLoading && posts.length === 0;
  const isReachingEnd = data && (data[data.length - 1]?.posts?.length || 0) < PAGE_SIZE;

  const handleVote = useCallback(async (postId, alreadyVoted) => {
    if (!user) {
      window.location.href = '/login?redirectTo=/community';
      return;
    }

    // Optimistic update
    setVotes((prev) => ({ ...prev, [postId]: !alreadyVoted }));

    try {
      const res = await fetch(`/api/community/posts/${postId}/vote`, {
        method: alreadyVoted ? 'DELETE' : 'POST',
      });
      if (!res.ok) throw new Error();
    } catch {
      // Revert optimistic update on failure
      setVotes((prev) => ({ ...prev, [postId]: alreadyVoted }));
    }
  }, [user]);

  if (error) return (
    <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444', fontSize: '0.875rem' }}>
      Failed to load posts. <button onClick={() => mutate()} style={{ color: '#2d43e8', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Retry</button>
    </div>
  );

  return (
    <div>
      {isEmpty && !isLoading && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#94a3b8' }}>
          <p style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.4rem' }}>No posts yet</p>
          <p style={{ fontSize: '0.85rem' }}>Be the first to start a conversation!</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            userVoted={votes[post.id] ?? false}
            onVote={handleVote}
          />
        ))}
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: posts.length ? '0.75rem' : 0 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{
              background: 'white',
              border: '1px solid #e8e8e8',
              borderRadius: '12px',
              padding: '1rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <div className="shimmer-box" style={{ width: 24, height: 24, borderRadius: '50%' }} />
                <div className="shimmer-box" style={{ width: 80, height: 10, borderRadius: 4 }} />
              </div>
              <div className="shimmer-box" style={{ width: '70%', height: 14, borderRadius: 4 }} />
              <div className="shimmer-box" style={{ width: '100%', height: 10, borderRadius: 4 }} />
              <div className="shimmer-box" style={{ width: '60%', height: 10, borderRadius: 4 }} />
            </div>
          ))}
        </div>
      )}

      {/* Load more */}
      {!isReachingEnd && !isLoading && posts.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button
            onClick={() => setSize((s) => s + 1)}
            style={{
              padding: '0.65rem 2rem',
              background: '#231f20',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'background 0.15s',
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#2d43e8'}
            onMouseOut={(e) => e.currentTarget.style.background = '#231f20'}
          >
            Load more
          </button>
        </div>
      )}

      {isReachingEnd && posts.length > 0 && (
        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', marginTop: '1.5rem' }}>
          You&apos;ve seen all posts
        </p>
      )}
    </div>
  );
}
