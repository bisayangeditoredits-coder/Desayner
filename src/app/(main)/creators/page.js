'use client';
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import UserAvatar from '@/components/UserAvatar';
import FollowButton from '@/components/FollowButton';
import Link from 'next/link';
import { Search, Users2, MapPin, Globe, TrendingUp, Clock, Star } from 'lucide-react';
import '../../App.css';

const SORT_OPTIONS = [
  { value: 'followers', label: 'Most Followed', icon: TrendingUp },
  { value: 'newest',    label: 'Newest',        icon: Clock },
  { value: 'projects',  label: 'Most Projects', icon: Star },
];

export default function CreatorsPage() {
  const [creators, setCreators]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [sort, setSort]                 = useState('followers');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [page, setPage]                 = useState(1);
  const [hasMore, setHasMore]           = useState(false);
  const supabase = createClient();
  const PAGE_SIZE = 24;

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  const loadCreators = useCallback(async (pageNum = 1, searchQ = '', sortBy = 'followers', append = false) => {
    if (pageNum === 1) setLoading(true);

    let query = supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, bio, location, website, followers_count, following_count, created_at')
      .not('username', 'is', null)
      .range((pageNum - 1) * PAGE_SIZE, pageNum * PAGE_SIZE - 1);

    if (searchQ.trim()) {
      query = query.or(`username.ilike.%${searchQ}%,full_name.ilike.%${searchQ}%`);
    }

    if (sortBy === 'followers') query = query.order('followers_count', { ascending: false, nullsFirst: false });
    else if (sortBy === 'newest') query = query.order('created_at', { ascending: false });
    else if (sortBy === 'projects') query = query.order('projects_count', { ascending: false, nullsFirst: false });

    const { data } = await query;
    const list = (data || []).filter(c => c.id !== currentUserId);

    // Fetch 3 sample project thumbnails per creator
    const withProjects = await Promise.all(
      list.map(async (creator) => {
        const { data: projects } = await supabase
          .from('projects')
          .select('id, cover_url, thumbnail_url, title')
          .eq('user_id', creator.id)
          .eq('published', true)
          .order('created_at', { ascending: false })
          .limit(3);
        return { ...creator, sampleProjects: projects || [] };
      })
    );

    setHasMore(list.length === PAGE_SIZE);
    setCreators(prev => {
      if (!append) return withProjects;
      const existingIds = new Set(prev.map(c => c.id));
      const newItems = withProjects.filter(c => !existingIds.has(c.id));
      return [...prev, ...newItems];
    });
    setLoading(false);
  }, [currentUserId]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadCreators(1, search, sort, false);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, sort]);

  useEffect(() => {
    if (page > 1) loadCreators(page, search, sort, true);
  }, [page]);

  return (
    <>

        <div className="page-content">
          {/* Page header */}
          <div className="page-header">
            <div>
              <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users2 size={20} /> Creators
              </h1>
              <p style={{ fontSize: '0.82rem', color: '#9b9b9b', marginTop: '0.2rem' }}>
                Discover talented designers and photographers
              </p>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: '1', minWidth: '200px', maxWidth: '380px' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9b9b9b', pointerEvents: 'none' }} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search creators..."
                style={{
                  width: '100%', padding: '0.55rem 0.75rem 0.55rem 2.25rem',
                  border: '1px solid #e2e8f0', background: 'white',
                  fontSize: '0.875rem', outline: 'none', color: '#0a0a0a',
                  fontFamily: 'inherit',
                }}
                onFocus={e => e.target.style.borderColor = '#0a0a0a'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            {/* Sort pills */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSort(opt.value)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    padding: '0.45rem 0.85rem', fontSize: '0.78rem', fontWeight: 700,
                    border: '1px solid', cursor: 'pointer', fontFamily: 'inherit',
                    background: sort === opt.value ? '#0a0a0a' : 'white',
                    color: sort === opt.value ? 'white' : '#6b7280',
                    borderColor: sort === opt.value ? '#0a0a0a' : '#e2e8f0',
                    transition: 'background 0.15s, color 0.15s, border-color 0.15s',
                  }}
                >
                  <opt.icon size={12} /> {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1px' }}>
              {[...Array(12)].map((_, i) => (
                <div key={i} style={{ background: 'white', border: '1px solid #f0f0f0', height: '280px' }}>
                  <div style={{ height: '100px', background: '#f5f5f5' }} />
                  <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ width: '60%', height: '12px', background: '#f0f0f0' }} />
                    <div style={{ width: '40%', height: '10px', background: '#f5f5f5' }} />
                    <div style={{ width: '80%', height: '10px', background: '#f5f5f5' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : creators.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem 2rem', border: '1px solid #e2e8f0', background: 'white' }}>
              <Users2 size={40} color="#d1d5db" style={{ marginBottom: '1rem' }} />
              <p style={{ fontWeight: 700, marginBottom: '0.4rem' }}>No creators found</p>
              <p style={{ fontSize: '0.875rem', color: '#9b9b9b' }}>
                {search ? `No results for "${search}"` : 'Be the first to create a profile!'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '4px' }}>
              {creators.map(creator => (
                <CreatorCard key={creator.id} creator={creator} currentUserId={currentUserId} />
              ))}
            </div>
          )}

          {/* Load more */}
          {hasMore && !loading && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <button
                onClick={() => setPage(p => p + 1)}
                className="btn btn-outline"
                style={{ padding: '0.65rem 2rem', fontSize: '0.875rem' }}
              >
                Load more creators
              </button>
            </div>
          )}
        </div>
      </>
  );
}

function CreatorCard({ creator, currentUserId }) {
  return (
    <div style={{
      background: 'white',
      border: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Thumbnail strip — 3 project previews */}
      <Link href={`/profile/${creator.username}`} style={{ display: 'block', textDecoration: 'none' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', height: '120px', background: '#f5f5f5' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ overflow: 'hidden', background: '#eee', borderRight: i < 2 ? '1px solid white' : 'none' }}>
              {creator.sampleProjects[i]?.cover_url ? (
                  <img
                    src={creator.sampleProjects[i].thumbnail_url || creator.sampleProjects[i].cover_url}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
              ) : (
                <div style={{ width: '100%', height: '100%', background: i === 0 ? '#1a1a1a' : i === 1 ? '#2a2a2a' : '#333' }} />
              )}
            </div>
          ))}
        </div>
      </Link>

      {/* Creator info */}
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          {/* Avatar */}
          <Link href={`/profile/${creator.username}`} style={{ flexShrink: 0 }}>
            <UserAvatar
              src={creator.avatar_url}
              name={creator.full_name || creator.username}
              size={48}
            />
          </Link>

          <div style={{ flex: 1, minWidth: 0 }}>
            <Link href={`/profile/${creator.username}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0a0a0a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {creator.full_name || creator.username}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#9b9b9b' }}>@{creator.username}</div>
            </Link>
          </div>

          {/* Follow button */}
          <FollowButton
            targetUserId={creator.id}
            currentUserId={currentUserId}
            initialFollowing={false}
            compact
          />
        </div>

        {/* Bio */}
        {creator.bio && (
          <p style={{
            fontSize: '0.9rem', color: '#4b5563', lineHeight: 1.5, margin: 0,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {creator.bio}
          </p>
        )}

        {/* Meta */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto' }}>
          {creator.location && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', color: '#9b9b9b' }}>
              <MapPin size={12} /> {creator.location}
            </span>
          )}
          <span style={{ fontSize: '0.85rem', color: '#9b9b9b', marginLeft: 'auto' }}>
            <strong style={{ color: '#0a0a0a' }}>{creator.followers_count || 0}</strong> followers
          </span>
        </div>
      </div>
    </div>
  );
}
