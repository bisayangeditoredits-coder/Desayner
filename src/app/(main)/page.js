'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import ProjectCard from '@/components/ProjectCard';
import TagPill from '@/components/TagPill';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
import useSWRInfinite from 'swr/infinite';
import useFeedStore from '@/store/useFeedStore';
import HorizontalFeatureScroll from '@/components/HorizontalFeatureScroll';
import AnnouncementBanner from '@/components/AnnouncementBanner';
import '../App.css';

const WelcomeModal = dynamic(() => import('@/components/WelcomeModal'), { ssr: false });

const BANNERS = [
  '/featured-contest-cover.jpeg'
];

const CATEGORIES = ['All', 'Design', 'Illustration', 'Photography', 'Branding', '3D', 'Motion', 'UI/UX', 'Typography', 'Other'];
const PAGE_SIZE = 24;

export default function Dashboard() {
  const router = useRouter();
  const [currentBanner, setCurrentBanner] = useState(0);

  // Banner carousel logic
  useEffect(() => {
    if (BANNERS.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % BANNERS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const { category, searchQuery, sort, scrollPosition, interactions, setFeedState, setScrollPosition, setInteractions } = useFeedStore();
  const [currentUserId, setCurrentUserId] = useState(null);
  const [searchInput, setSearchInput] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== searchInput) {
        setFeedState({ searchQuery: searchInput });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, searchQuery, setFeedState]);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    }
    loadUser();
  }, [supabase]);

  // SWR Fetcher definition
  const fetcher = async ([key, cat, query, sortOpt, pageIndex]) => {
    const offset = pageIndex * PAGE_SIZE;
    let url = `/api/projects?category=${encodeURIComponent(cat)}&limit=${PAGE_SIZE}&offset=${offset}&sort=${encodeURIComponent(sortOpt)}`;
    if (query) url += `&q=${encodeURIComponent(query)}`;
    
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch projects');
    const { projects } = await res.json();
    return projects || [];
  };

  const getKey = (pageIndex, previousPageData) => {
    if (previousPageData && previousPageData.length < PAGE_SIZE) return null;
    return ['projects_feed', category, searchQuery, sort, pageIndex];
  };

  const { data, size, setSize, isValidating, error, mutate } = useSWRInfinite(getKey, fetcher, {
    revalidateFirstPage: false,
    persistSize: true,
  });

  const projects = useMemo(() => data || [], [data]);
  const isLoadingInitialData = !data && !error;
  const isLoadingMore = isLoadingInitialData || (size > 0 && data && typeof data[size - 1] === "undefined");
  const isEmpty = data?.[0]?.length === 0;
  const hasMore = data ? data[data.length - 1]?.length === PAGE_SIZE : false;

  // Background interaction hydration
  useEffect(() => {
    if (!currentUserId || !projects.length) return;

    const allProjects = projects.flat();
    const missingIds = allProjects
      .map(p => p.id)
      .filter(id => interactions[id] === undefined);

    if (missingIds.length === 0) return;

    // Mark pending to avoid duplicate fetches
    const pending = {};
    missingIds.forEach(id => pending[id] = { liked: false, saved: false });
    setInteractions(pending);

    async function fetchInteractions() {
      const [{ data: likedList }, { data: savedList }] = await Promise.all([
        supabase.from('project_likes').select('project_id').eq('user_id', currentUserId).in('project_id', missingIds),
        supabase.from('project_saves').select('project_id').eq('user_id', currentUserId).in('project_id', missingIds)
      ]);

      const likedSet = new Set((likedList || []).map(l => l.project_id));
      const savedSet = new Set((savedList || []).map(l => l.project_id));

      const newInteractions = {};
      missingIds.forEach(id => {
        newInteractions[id] = {
          liked: likedSet.has(id),
          saved: savedSet.has(id)
        };
      });

      setInteractions(newInteractions);
    }
    fetchInteractions();
  }, [currentUserId, projects, interactions, setInteractions, supabase]);

  const scrollRestoredRef = useRef(false);

  // Scroll restoration based on previously cached state
  useEffect(() => {
    if (!scrollRestoredRef.current && projects.length > 0 && scrollPosition > 0) {
      scrollRestoredRef.current = true;
      window.scrollTo({ top: scrollPosition, behavior: 'instant' });
    }
    return () => setScrollPosition(window.scrollY);
  }, [projects.length, scrollPosition, setScrollPosition]);

  // Infinite scroll observer
  const observerRef = useRef(null);
  const lastElementRef = useCallback((node) => {
    if (isLoadingInitialData || isLoadingMore || !hasMore) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isValidating) {
          setSize(size + 1);
        }
      },
      { rootMargin: '300px' }
    );

    if (node) observerRef.current.observe(node);
  }, [isLoadingInitialData, isLoadingMore, hasMore, isValidating, size, setSize]);

  function goToSearch() {
    const q = searchInput.trim();
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`);
    }
  }

  return (
    <>
      <WelcomeModal />
      <div className="page-content" style={{ padding: '0 1.5rem 2rem' }}>
        <AnnouncementBanner />
        
        {/* Banner Section */}
        <div className="event-banner-wrapper" style={{ position: 'relative', overflow: 'hidden', aspectRatio: '4 / 1', borderRadius: '12px', background: '#000', marginBottom: '1.5rem', marginTop: '1.5rem' }}>
          {BANNERS.map((src, idx) => (
            <Image
              key={src}
              src={src}
              alt={`Desayner featured event ${idx + 1}`}
              className="event-banner-img"
              width={1200}
              height={300}
              priority={idx === 0}
              sizes="100vw"
              unoptimized={true}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: currentBanner === idx ? 1 : 0,
                transition: 'opacity 0.8s ease-in-out',
                objectFit: 'cover',
                zIndex: currentBanner === idx ? 1 : 0,
                borderRadius: '12px'
              }}
            />
          ))}
          {BANNERS.length > 1 && (
            <div style={{ position: 'absolute', bottom: '1rem', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '0.6rem', zIndex: 10 }}>
              {BANNERS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentBanner(idx)}
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: currentBanner === idx ? '#ffffff' : 'rgba(255, 255, 255, 0.4)',
                    transition: 'background 0.3s',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Dribbble-style Search Hero */}
        <div style={{ padding: '0 1.5rem', marginBottom: '2rem', maxWidth: '1200px', margin: '0 auto 2rem auto' }}>
          {/* Big Search Bar */}
          <div style={{ position: 'relative', width: '100%', marginBottom: '1.25rem' }}>
            <input
              type="text"
              placeholder="What type of design are you interested in?"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') goToSearch(); }}
              style={{
                width: '100%',
                padding: '1.25rem 4rem 1.25rem 2rem',
                borderRadius: '50px',
                border: '2px solid #e2e8f0', /* Added visible outline here */
                background: '#f8fafc',
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.2s ease',
                color: '#0f172a',
              }}
              onFocus={(e) => {
                e.target.style.background = '#ffffff';
                e.target.style.borderColor = '#2d43e8';
                e.target.style.boxShadow = '0 0 0 4px rgba(45, 67, 232, 0.15)';
              }}
              onBlur={(e) => {
                e.target.style.background = '#f8fafc';
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.boxShadow = 'none';
              }}
            />
            <button
              type="button"
              aria-label="Search projects"
              onClick={goToSearch}
              style={{
              position: 'absolute',
              right: '0.6rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: '#2d43e8', // Brand blue
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '46px',
              height: '46px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#1e33c8'}
            onMouseOut={(e) => e.currentTarget.style.background = '#2d43e8'}
            >
              <Search size={20} />
            </button>
          </div>

          {/* Popular Categories Row & Sort */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="category-scroll-container">
              <span style={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem', flexShrink: 0, marginRight: '0.25rem' }}>Popular:</span>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => {
                  if (category === cat) return;
                  setFeedState({ category: cat });
                }}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '30px',
                  border: '1px solid #e5e7eb',
                  background: category === cat ? '#2d43e8' : 'white',
                  color: category === cat ? 'white' : '#4b5563',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all 0.2s ease'
                }}
              >
                {cat}
              </button>
            ))}
            </div>
          </div>
        </div>

        <HorizontalFeatureScroll />

        {/* Masonry Project Grid */}
        {error ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', border: '1px solid #e8e8e8', background: 'white', borderRadius: '12px' }}>
            <p style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Could not load projects</p>
            <p style={{ color: '#9b9b9b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Check your connection and try again.</p>
            <button
              type="button"
              onClick={() => mutate()}
              className="btn btn-dark"
            >
              Retry
            </button>
          </div>
        ) : isLoadingInitialData ? (
          <div className="projects-masonry">
            {[...Array(24)].map((_, i) => <div key={i} className="masonry-item shimmer-box" style={{ aspectRatio: '4/3', borderRadius: '8px' }} />)}
          </div>
        ) : isEmpty ? (
          <div style={{ textAlign: 'center', padding: '6rem 2rem', border: '1px solid #e8e8e8', background: 'white', borderRadius: '12px' }}>
            <p style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              {searchQuery.trim() ? `No results for "${searchQuery.trim()}"` : `No projects in ${category}`}
            </p>
            <p style={{ color: '#9b9b9b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              {searchQuery.trim() ? 'Try different keywords or browse all projects.' : 'Be the first to share one.'}
            </p>
            {searchQuery.trim() ? (
              <button
                type="button"
                onClick={() => { setSearchInput(''); setFeedState({ searchQuery: '' }); }}
                className="btn btn-dark"
              >
                Clear search
              </button>
            ) : (
              <Link href="/projects/new" className="btn btn-dark">
                <Plus size={14} /> Create Project
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="projects-masonry">
              {projects.flat().map((project, index, arr) => {
                const isLast = index === arr.length - 1;
                const interact = interactions[project.id] || {};
                return (
                  <div key={project.id} ref={isLast ? lastElementRef : null} style={{ width: '100%', minWidth: 0, breakInside: 'avoid' }}>
                    <ProjectCard 
                      project={project} 
                      currentUserId={currentUserId} 
                      isLiked={interact.liked}
                      isSaved={interact.saved}
                    />
                  </div>
                );
              })}
            </div>

            {isLoadingMore && (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: '#9b9b9b', fontSize: '0.875rem' }}>
                Loading more...
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
