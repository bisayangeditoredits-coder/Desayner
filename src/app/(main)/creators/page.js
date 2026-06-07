'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import UserAvatar from '@/components/UserAvatar';
import FollowButton from '@/components/FollowButton';
import Link from 'next/link';
import { Search, MapPin, TrendingUp, Clock, Star, BadgeCheck, Sparkles, Award, Users2 } from 'lucide-react';
import '../../App.css';

const CATEGORIES = [
  'All',
  'Graphic Design',
  'UI/UX',
  'Branding',
  'Illustration',
  'Photography',
  'Motion Graphics'
];

const SORT_OPTIONS = [
  { value: 'followers', label: 'Most Followed', icon: TrendingUp },
  { value: 'newest',    label: 'Newest',        icon: Clock },
  { value: 'projects',  label: 'Most Projects', icon: Star },
];

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CreatorsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || 'All';
  const [data, setData] = useState({
    heroCreator: null,
    featuredCreators: [],
    risingCreators: [],
    creators: []
  });
  
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState(initialSearch);
  const [category, setCategory]         = useState(initialCategory);
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

  // Sync search & category to URL
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (category !== 'All') params.set('category', category);
      router.replace(`/creators?${params.toString()}`, { scroll: false });
    }, 300);
    return () => clearTimeout(timer);
  }, [search, category, router]);

  const loadCreators = useCallback(async (pageNum = 1, currentCat = 'All', currentSort = 'followers', append = false) => {
    if (pageNum === 1) setLoading(true);

    try {
      const res = await fetch(`/api/creators?category=${encodeURIComponent(currentCat)}&sort=${currentSort}&page=${pageNum}`);
      if (!res.ok) throw new Error('Failed to fetch creators');
      const payload = await res.json();
      
      const newCreators = (payload.creators || []).filter(c => c.id !== currentUserId);
      setHasMore(payload.creators?.length === PAGE_SIZE);

      setData(prev => {
        if (!append) {
          return {
            heroCreator: payload.heroCreator || prev.heroCreator,
            featuredCreators: payload.featuredCreators || prev.featuredCreators,
            risingCreators: payload.risingCreators || prev.risingCreators,
            creators: newCreators
          };
        }
        
        const existingIds = new Set(prev.creators.map(c => c.id));
        const added = newCreators.filter(c => !existingIds.has(c.id));
        return {
          ...prev,
          creators: [...prev.creators, ...added]
        };
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  // Load initial data and handle filter/sort changes
  useEffect(() => {
    setPage(1);
    loadCreators(1, category, sort, false);
  }, [category, sort]);

  // Handle pagination
  useEffect(() => {
    if (page > 1) loadCreators(page, category, sort, true);
  }, [page]);

    // Use featured creators if available in DB, otherwise fallback to rising creators
    let displayCreators = [];
    if (data.heroCreator || (data.featuredCreators && data.featuredCreators.length > 0)) {
      const allFeatured = [];
      if (data.heroCreator) allFeatured.push(data.heroCreator);
      if (data.featuredCreators) allFeatured.push(...data.featuredCreators);
      
      displayCreators = allFeatured.map(f => ({
        ...f.profiles,
        id: f.id,
        is_featured: true,
        bio: f.featured_description || f.profiles?.bio,
        banner_url: f.banner_url
      })).slice(0, 4);
    } else {
      displayCreators = (data.risingCreators || []).map(r => ({
        ...r,
        is_featured: false,
        banner_url: r.sampleProjects?.[0]?.thumbnail_url || r.sampleProjects?.[0]?.cover_url
      })).slice(0, 4);
    }

  // Handle search (client-side filtering for simplicity, or we could add to API)
  const filteredCreators = search.trim() 
    ? data.creators.filter(c => 
        c.username.toLowerCase().includes(search.toLowerCase()) || 
        (c.full_name && c.full_name.toLowerCase().includes(search.toLowerCase()))
      )
    : data.creators;

  return (
    <>
      
      {/* 1. EDITORIAL HEADER & PREMIUM CAROUSEL */}
      {!loading && displayCreators.length > 0 && page === 1 && category === 'All' && search === '' && (
        <section style={{ marginBottom: '1.5rem', paddingTop: '2rem' }}>
          <div className="page-content">
            <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 1.5rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.05)', padding: '0.4rem 1rem', borderRadius: '30px', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.75rem', color: '#8b5cf6' }}>
                <Sparkles size={14} /> Rising Stars
              </div>
              <h1 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '0.5rem', lineHeight: 1.1, letterSpacing: '-0.02em', color: '#111827' }}>
                Trending Creators
              </h1>
              <p style={{ fontSize: '0.95rem', color: '#4b5563', lineHeight: 1.4, margin: 0 }}>
                Discover the fastest-growing creative professionals this week.
              </p>
            </div>

            {/* 4-Column Responsive Grid (Fills container completely) */}
            <div className="trending-grid" style={{ paddingBottom: '0.5rem' }}>
              {displayCreators.map(creator => (
                <Link key={creator.id} href={`/profile/${creator.username}`} className="featured-card" style={{
                  background: 'white',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                  cursor: 'pointer',
                  color: '#111827',
                  textDecoration: 'none',
                  aspectRatio: '3 / 4' // Keeps the portrait shape even when it stretches
                }}>
                  {/* Full Background Image */}
                  <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: '#e5e7eb', zIndex: 0 }}>
                    {creator.banner_url && (
                      <img 
                        src={creator.banner_url} 
                        alt="" 
                        className="featured-banner-img"
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease-out' }} 
                      />
                    )}
                  </div>
                  
                  {/* Glassmorphism Top Badge */}
                  <div style={{ position: 'absolute', top: '1rem', left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', padding: '0.3rem 0.8rem', borderRadius: '20px', color: '#111827', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem', border: '1px solid rgba(255,255,255,0.5)', zIndex: 2, whiteSpace: 'nowrap' }}>
                    {creator.is_featured ? (
                      <><Star size={12} color="#eab308" fill="#eab308" /> Featured Creator</>
                    ) : (
                      <><TrendingUp size={12} color="#8b5cf6" /> Rising Creator</>
                    )}
                  </div>

                  {/* Gradient Overlay for Bottom Text */}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0) 30%, rgba(255,255,255,0.9) 70%, rgba(255,255,255,1) 100%)', zIndex: 1 }} className="gradient-overlay" />

                  {/* Content Container Floating at Bottom */}
                  <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2, color: '#111827' }}>
                    
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#000' }}>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{creator.full_name || creator.username}</span>
                      <BadgeCheck size={16} color="#8b5cf6" fill="#f3e8ff" style={{ flexShrink: 0 }} />
                    </h2>
                    
                    {/* Bio */}
                    <p style={{ fontSize: '0.75rem', color: '#4b5563', lineHeight: 1.4, margin: '0 0 1rem 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontWeight: 500 }}>
                      {creator.bio || 'New talented creative on Desayner.'}
                    </p>

                    {/* Footer Stats & Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#8b5cf6', fontSize: '0.75rem', fontWeight: 700 }}>
                          <Users2 size={14} />
                          {creator.followers_count || 0}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#8b5cf6', fontSize: '0.75rem', fontWeight: 700 }}>
                          <Star size={14} />
                          {creator.projects_count || 0}
                        </div>
                      </div>
                      
                      <FollowButton 
                        targetUserId={creator.id} 
                        currentUserId={currentUserId} 
                        compact={true} 
                      />
                    </div>

                  </div>
                </Link>
              ))}
            </div>
            
            <style jsx>{`
              .trending-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 1.5rem;
              }
              @media (max-width: 1024px) {
                .trending-grid {
                  grid-template-columns: repeat(2, 1fr);
                }
              }
              @media (max-width: 640px) {
                .trending-grid {
                  grid-template-columns: 1fr;
                }
              }
              .featured-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
              }
              .featured-card:hover .featured-banner-img {
                transform: scale(1.05);
              }
            `}</style>
          </div>
        </section>
      )}

      <div className="page-content">

        {/* 3. Main Explore Section */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Explore Creators</h2>
          
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9b9b9b' }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search creators..."
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '30px', border: '1px solid #e2e8f0', background: 'white', fontSize: '0.9rem', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = '#0a0a0a'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="category-scroll-container" style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '2rem', scrollbarWidth: 'none' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                padding: '0.6rem 1.25rem', fontSize: '0.9rem', fontWeight: 600, borderRadius: '30px',
                border: '1px solid', cursor: 'pointer', whiteSpace: 'nowrap',
                background: category === cat ? '#0a0a0a' : 'white',
                color: category === cat ? 'white' : '#4b5563',
                borderColor: category === cat ? '#0a0a0a' : '#e2e8f0',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={e => { if (category !== cat) e.currentTarget.style.borderColor = '#9b9b9b'; }}
              onMouseOut={e => { if (category !== cat) e.currentTarget.style.borderColor = '#e2e8f0'; }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort Controls */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSort(opt.value)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 600, borderRadius: '8px',
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: sort === opt.value ? '#000' : '#9b9b9b',
              }}
            >
              <opt.icon size={14} color={sort === opt.value ? '#000' : '#9b9b9b'} /> {opt.label}
            </button>
          ))}
        </div>

        {/* Main Grid */}
        {loading && page === 1 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {[...Array(12)].map((_, i) => (
              <div key={i} style={{ background: 'white', borderRadius: '16px', height: '360px', overflow: 'hidden', border: '1px solid #f0f0f0' }}>
                <div style={{ height: '180px', background: '#f5f5f5' }} />
                <div style={{ padding: '1.5rem', display: 'flex', gap: '1rem' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#f0f0f0' }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <div style={{ width: '60%', height: '14px', background: '#f0f0f0', borderRadius: '4px' }} />
                    <div style={{ width: '40%', height: '12px', background: '#f5f5f5', borderRadius: '4px' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredCreators.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '6rem 2rem', background: 'white', borderRadius: '24px', border: '1px dashed #d1d5db' }}>
            <Sparkles size={48} color="#d1d5db" style={{ marginBottom: '1.5rem', margin: '0 auto' }} />
            <p style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: '0.5rem' }}>No creators found</p>
            <p style={{ fontSize: '1rem', color: '#6b7280' }}>
              {search ? `No results match "${search}"` : `No creators found in ${category}`}
            </p>
            <div style={{ marginTop: '1.5rem' }}>
              <button onClick={() => { setSearch(''); setCategory('All'); }} className="btn" style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem', background: '#0a0a0a', color: 'white', fontWeight: 700, borderRadius: '30px' }}>
                Clear Filters
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {filteredCreators.map(creator => (
              <PremiumCreatorCard key={creator.id} creator={creator} currentUserId={currentUserId} />
            ))}
          </div>
        )}

        {/* Load more */}
        {hasMore && !loading && search === '' && (
          <div style={{ textAlign: 'center', marginTop: '4rem' }}>
            <button
              onClick={() => setPage(p => p + 1)}
              className="btn btn-outline"
              style={{ padding: '0.85rem 3rem', fontSize: '1rem', borderRadius: '30px', fontWeight: 700 }}
            >
              Discover More Creators
            </button>
          </div>
        )}
        
        {loading && page > 1 && (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: '#9b9b9b', fontWeight: 600 }}>Loading more...</div>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function PremiumCreatorCard({ creator, currentUserId }) {
  return (
    <div className="premium-creator-card" style={{
      background: 'white',
      borderRadius: '16px',
      border: '1px solid #e2e8f0',
      overflow: 'hidden',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      {/* Thumbnail strip — 3 project previews */}
      <Link href={`/profile/${creator.username}`} style={{ display: 'block', textDecoration: 'none' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', height: '220px', gap: '2px' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ overflow: 'hidden', background: '#e5e7eb' }}>
              {creator.sampleProjects[i]?.cover_url ? (
                <img
                  src={creator.sampleProjects[i].thumbnail_url || creator.sampleProjects[i].cover_url}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.3s ease' }}
                  onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', background: '#f3f4f6' }} />
              )}
            </div>
          ))}
        </div>
      </Link>

      {/* Creator info */}
      <div style={{ padding: '1.5rem', display: 'flex', gap: '1rem', position: 'relative' }}>
        {/* Avatar pulled up */}
        <div style={{ marginTop: '-2.5rem' }}>
          <Link href={`/profile/${creator.username}`}>
            <div style={{ border: '4px solid white', borderRadius: '50%', background: 'white', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <UserAvatar src={creator.avatar_url} name={creator.full_name || creator.username} size={64} />
            </div>
          </Link>
        </div>

        <div style={{ flex: 1, minWidth: 0, marginTop: '-0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
            <Link href={`/profile/${creator.username}`} style={{ textDecoration: 'none', color: 'inherit', minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                {creator.full_name || creator.username}
                {creator.followers_count > 1000 && <BadgeCheck size={16} color="#3b82f6" fill="#eff6ff" style={{ flexShrink: 0 }}/>}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>@{creator.username}</div>
            </Link>
            
            <FollowButton targetUserId={creator.id} currentUserId={currentUserId} initialFollowing={false} compact />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            {creator.location && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: '#6b7280', fontWeight: 500 }}>
                <MapPin size={12} /> {creator.location}
              </span>
            )}
            <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 500, marginLeft: creator.location ? '0' : 'auto' }}>
              <strong style={{ color: '#111827' }}>{creator.followers_count || 0}</strong> Followers
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}



function RisingCreatorRow({ creator, rank }) {
  return (
    <Link href={`/profile/${creator.username}`} style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none', color: 'inherit', padding: '0.5rem', borderRadius: '8px', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#f8fafc'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
      <div style={{ width: '24px', fontWeight: 800, color: rank <= 3 ? '#111827' : '#9ca3af', fontSize: '1.1rem', textAlign: 'center' }}>
        #{rank}
      </div>
      <UserAvatar src={creator.avatar_url} name={creator.full_name || creator.username} size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{creator.full_name || creator.username}</div>
        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{creator.followers_count} followers</div>
      </div>
      <div style={{ color: '#10b981', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        <TrendingUp size={12} />
      </div>
    </Link>
  );
}

export default function CreatorsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center', color: '#9b9b9b' }}>Loading...</div>}>
      <CreatorsContent />
    </Suspense>
  );
}
