'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import ProjectCard from '@/components/ProjectCard';
import UserAvatar from '@/components/UserAvatar';
import FollowButton from '@/components/FollowButton';
import TagPill from '@/components/TagPill';
import Link from 'next/link';
import { Search, FolderOpen, Users2, TrendingUp, Clock, Heart, Eye, MapPin } from 'lucide-react';
import '../../App.css';

const CATEGORIES = ['All', 'Design', 'Illustration', 'Photography', 'Branding', '3D', 'Motion', 'UI/UX', 'Typography', 'Other'];

const PROJECT_SORT = [
  { value: 'newest',   label: 'Newest',      icon: Clock },
  { value: 'liked',    label: 'Most Liked',  icon: Heart },
  { value: 'viewed',   label: 'Most Viewed', icon: Eye },
];

function SearchResults() {
  const searchParams   = useSearchParams();
  const router         = useRouter();
  const q              = searchParams.get('q') || '';
  const [query, setQuery]           = useState(q);
  const [tab, setTab]               = useState('projects'); // 'projects' | 'creators'
  const [category, setCategory]     = useState('All');
  const [sort, setSort]             = useState('newest');
  // --- projects ---
  const [projects, setProjects]     = useState([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [hasMore, setHasMore]       = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  // --- creators ---
  const [creators, setCreators]     = useState([]);
  const [loadingCreators, setLoadingCreators] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  useEffect(() => { setQuery(q); setPage(1); setProjects([]); }, [q]);

  // Search projects
  useEffect(() => {
    if (!query.trim() || tab !== 'projects') return;
    async function search() {
      setLoadingProjects(true);
      const params = new URLSearchParams({ q: query, page: String(page) });
      if (category !== 'All') params.set('category', category);
      params.set('sort', sort);
      const res  = await fetch(`/api/search?${params}`);
      const data = await res.json();
      if (page === 1) setProjects(data.projects || []);
      else setProjects(prev => [...prev, ...(data.projects || [])]);
      setTotal(data.total || 0);
      setHasMore((data.projects || []).length === 24);
      setLoadingProjects(false);
    }
    search();
  }, [query, category, sort, page, tab]);

  // Search creators
  useEffect(() => {
    if (!query.trim() || tab !== 'creators') return;
    async function searchCreators() {
      setLoadingCreators(true);
      const { data } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, bio, location, followers_count')
        .not('username', 'is', null)
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%,bio.ilike.%${query}%`)
        .order('followers_count', { ascending: false, nullsFirst: false })
        .limit(24);

      // Fetch sample projects for each creator
      const withProjects = await Promise.all(
        (data || []).map(async (creator) => {
          const { data: projects } = await supabase
            .from('projects')
            .select('id, cover_url')
            .eq('user_id', creator.id)
            .eq('published', true)
            .limit(3);
          return { ...creator, sampleProjects: projects || [] };
        })
      );
      setCreators(withProjects);
      setLoadingCreators(false);
    }
    searchCreators();
  }, [query, tab]);

  const loading = tab === 'projects' ? loadingProjects : loadingCreators;

  return (
    <div>
      <div className="page-content">
        {/* Tabs */}
        {query && (
          <div style={{ display: 'flex', gap: 0, marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
            {[
              { id: 'projects', label: 'Projects', icon: FolderOpen, count: total },
              { id: 'creators', label: 'Creators', icon: Users2 },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.75rem 1.25rem', background: 'none', border: 'none',
                  borderBottom: `2px solid ${tab === t.id ? '#0a0a0a' : 'transparent'}`,
                  color: tab === t.id ? '#0a0a0a' : '#9b9b9b',
                  fontWeight: tab === t.id ? 700 : 500, fontSize: '0.875rem',
                  cursor: 'pointer', fontFamily: 'inherit', marginBottom: '-1px',
                  transition: 'color 0.15s',
                }}
              >
                <t.icon size={14} />
                {t.label}
                {t.count > 0 && tab === t.id && (
                  <span style={{ fontSize: '0.72rem', background: '#0a0a0a', color: 'white', padding: '0.1rem 0.45rem', fontWeight: 700 }}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* PROJECT FILTERS */}
        {query && tab === 'projects' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
            {/* Category pills */}
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {CATEGORIES.map(cat => (
                <TagPill key={cat} label={cat} active={category === cat} onClick={() => { setCategory(cat); setPage(1); setProjects([]); }} />
              ))}
            </div>
            {/* Sort */}
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {PROJECT_SORT.map(s => (
                <button
                  key={s.value}
                  onClick={() => { setSort(s.value); setPage(1); setProjects([]); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                    padding: '0.35rem 0.75rem', border: '1px solid',
                    fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'inherit',
                    background: sort === s.value ? '#0a0a0a' : 'white',
                    color: sort === s.value ? 'white' : '#6b7280',
                    borderColor: sort === s.value ? '#0a0a0a' : '#e2e8f0',
                  }}
                >
                  <s.icon size={11} /> {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No query state */}
        {!query && (
          <div style={{ textAlign: 'center', padding: '5rem 2rem', background: 'white', border: '1px solid #e2e8f0', maxWidth: '560px', margin: '1.5rem auto' }}>
            <Search size={36} style={{ color: '#d1d5db', marginBottom: '1rem' }} />
            <p style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.4rem', color: '#0a0a0a' }}>Search Desayner</p>
            <p style={{ color: '#9b9b9b', fontSize: '0.875rem', lineHeight: 1.6 }}>
              Find inspiring projects, talented creators, and premium resources shared by the community.
            </p>
          </div>
        )}

        {/* PROJECTS RESULTS */}
        {tab === 'projects' && query && (
          <>
            {loadingProjects && page === 1 ? (
              <div className="projects-masonry">
                {[...Array(8)].map((_, i) => <div key={i} style={{ background: '#f0f0f0', aspectRatio: '4/3' }} />)}
              </div>
            ) : projects.length === 0 && !loadingProjects ? (
              <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
                <p style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '0.4rem' }}>No projects found for "{query}"</p>
                <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>We couldn't find anything matching your search. Try adjusting your keywords.</p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem' }}>
                  <button onClick={() => { setCategory('All'); setSort('newest'); }} className="btn btn-outline" style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}>
                    Clear Filters
                  </button>
                  <Link href="/projects" className="btn" style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', background: '#0a0a0a', color: 'white', fontWeight: 700, textDecoration: 'none' }}>
                    Explore All Projects
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="projects-masonry">
                  {projects.map(p => <ProjectCard key={p.id} project={p} currentUserId={currentUserId} />)}
                </div>
                {hasMore && (
                  <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    <button onClick={() => setPage(p => p + 1)} disabled={loadingProjects} className="btn btn-outline" style={{ padding: '0.65rem 2rem', fontSize: '0.875rem' }}>
                      {loadingProjects ? 'Loading...' : 'Load more'}
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* CREATORS RESULTS */}
        {tab === 'creators' && query && (
          <>
            {loadingCreators ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '4px' }}>
                {[...Array(6)].map((_, i) => <div key={i} style={{ background: '#f0f0f0', height: '200px' }} />)}
              </div>
            ) : creators.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
                <Users2 size={36} color="#d1d5db" style={{ marginBottom: '1rem', margin: '0 auto 1rem' }} />
                <p style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '0.4rem' }}>No creators found for "{query}"</p>
                <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Try a different name or username.</p>
                <Link href="/creators" className="btn" style={{ display: 'inline-block', marginTop: '1.5rem', padding: '0.6rem 1.25rem', fontSize: '0.85rem', background: '#0a0a0a', color: 'white', fontWeight: 700, textDecoration: 'none' }}>
                  Explore All Creators
                </Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '4px' }}>
                {creators.map(creator => (
                  <div key={creator.id} style={{ background: 'white', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {/* Thumbnail strip */}
                    <Link href={`/profile/${creator.username}`} style={{ display: 'block', textDecoration: 'none' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', height: '120px', background: '#f5f5f5' }}>
                        {[0, 1, 2].map(i => (
                          <div key={i} style={{ overflow: 'hidden', background: '#eee', borderRight: i < 2 ? '1px solid white' : 'none' }}>
                            {creator.sampleProjects[i]?.cover_url
                              ? <img src={creator.sampleProjects[i].cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                              : <div style={{ width: '100%', height: '100%', background: '#2a2a2a' }} />
                            }
                          </div>
                        ))}
                      </div>
                    </Link>
                    <div style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <Link href={`/profile/${creator.username}`}>
                        <UserAvatar src={creator.avatar_url} name={creator.full_name || creator.username} size={48} />
                      </Link>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Link href={`/profile/${creator.username}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0a0a0a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {creator.full_name || creator.username}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#9b9b9b' }}>@{creator.username} · {creator.followers_count || 0} followers</div>
                        </Link>
                      </div>
                      {currentUserId && currentUserId !== creator.id && (
                        <FollowButton targetUserId={creator.id} currentUserId={currentUserId} initialFollowing={false} compact />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <>
        <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center', color: '#9b9b9b' }}>Loading...</div>}>
          <SearchResults />
        </Suspense>
      </>
  );
}
