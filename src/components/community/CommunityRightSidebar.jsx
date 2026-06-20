'use client';
import useSWR from 'swr';
import Link from 'next/link';
import UserAvatar from '@/components/ui/UserAvatar';
import styles from '@/app/(main)/community/community.module.css';

const fetcher = (url) => fetch(url).then((r) => r.json());

export default function CommunityRightSidebar() {
  const { data: designersData } = useSWR('/api/designers?sort=followers', fetcher);
  // We use our new community search or standard posts route
  const { data: postsData } = useSWR('/api/community/posts?sort=top', fetcher);

  const topDesigners = designersData?.designers?.slice(0, 5) || [];
  const topPosts = postsData?.posts?.slice(0, 4) || [];

  return (
    <div className={styles.rightSidebar}>
      <div className={styles.stickyWrapper}>
        
        {/* Top Contributors */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            Top Contributors
            <Link href="/designers" style={{ fontSize: '0.75rem', color: '#2d43e8', textDecoration: 'none', fontWeight: 600 }}>
              View all
            </Link>
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {topDesigners.map((designer) => (
              <Link 
                key={designer.id} 
                href={`/profile/${designer.username}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'inherit' }}
              >
                <UserAvatar src={designer.avatar_url} name={designer.full_name || designer.username} size={36} />
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {designer.full_name || designer.username}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {designer.followers_count || 0} followers
                  </div>
                </div>
              </Link>
            ))}
            {!designersData && (
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Loading contributors...</div>
            )}
          </div>
        </div>

        {/* Trending Discussions */}
        <div>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>
            Trending Discussions
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {topPosts.map((post) => (
              <Link 
                key={post.id} 
                href={`/community/${post.id}`}
                style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
              >
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', lineHeight: 1.4, marginBottom: '0.25rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {post.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
                  <span>{post.votes_count || 0} votes</span>
                  <span>•</span>
                  <span>{post.comments_count || 0} replies</span>
                </div>
              </Link>
            ))}
            {!postsData && (
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Loading discussions...</div>
            )}
            {postsData && topPosts.length === 0 && (
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No discussions yet.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
