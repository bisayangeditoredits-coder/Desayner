'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import ProjectCard from '@/components/projects/ProjectCard';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
import useSWRInfinite from 'swr/infinite';
import useFeedStore from '@/store/useFeedStore';
import ProjectCardSkeleton from '@/components/projects/ProjectCardSkeleton';
import HorizontalFeatureScroll from '@/components/marketing/HorizontalFeatureScroll';
import '../App.css';

const WelcomeModal = dynamic(() => import('@/components/onboarding/WelcomeModal'), { ssr: false });

const BANNERS = [
  '/featured-contest-cover.jpeg'
];

const CATEGORIES = ['All', 'Design', 'Illustration', 'Photography', 'Branding', '3D', 'Motion', 'UI/UX', 'Typography', 'Other'];
const PAGE_SIZE = 24;

const MASONRY_BREAKPOINTS = [
  { minWidth: 1440, columns: 5 },
  { minWidth: 1024, columns: 4 },
  { minWidth: 768, columns: 3 },
  { minWidth: 0, columns: 2 },
];

function getMasonryColumnCount(width) {
  return MASONRY_BREAKPOINTS.find((breakpoint) => width >= breakpoint.minWidth)?.columns ?? 2;
}

function splitIntoColumns(items, columnCount, getWeight = () => 1) {
  const totalColumns = Math.max(1, Math.min(columnCount, items.length || columnCount));
  const columns = Array.from({ length: totalColumns }, () => []);
  const columnHeights = Array.from({ length: totalColumns }, () => 0);

  items.forEach((item) => {
    let targetIndex = 0;
    for (let i = 1; i < totalColumns; i += 1) {
      if (columnHeights[i] < columnHeights[targetIndex]) {
        targetIndex = i;
      }
    }

    columns[targetIndex].push(item);
    columnHeights[targetIndex] += getWeight(item);
  });

  return columns;
}

export default function Dashboard() {
  const router = useRouter();

  const { category, searchQuery, sort, scrollPosition, interactions, setFeedState, setScrollPosition, setInteractions } = useFeedStore();
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [projectRatios, setProjectRatios] = useState({});

  const handleProjectImageLoad = useCallback((projectId, ratio) => {
    if (!ratio || !Number.isFinite(ratio)) return;
    setProjectRatios((prev) => (prev[projectId] === ratio ? prev : { ...prev, [projectId]: ratio }));
  }, []);

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
      setIsAuthLoaded(true);
    }
    loadUser();
  }, [supabase]);

  // SWR Fetcher definition
  const fetcher = async ([key, cat, query, sortOpt, pageIndex, cursor]) => {
    const offset = pageIndex * PAGE_SIZE;
    let url = `/api/projects?category=${encodeURIComponent(cat)}&limit=${PAGE_SIZE}&offset=${offset}&sort=${encodeURIComponent(sortOpt)}`;
    if (query) url += `&q=${encodeURIComponent(query)}`;
    if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch projects');
    return await res.json(); // returns { projects, nextCursor }
  };

  const getKey = (pageIndex, previousPageData) => {
    if (previousPageData) {
      const prevProjects = previousPageData.projects || [];
      if (prevProjects.length < PAGE_SIZE) return null;
    }
    const cursor = previousPageData ? previousPageData.nextCursor : null;
    return ['projects_feed', category, searchQuery, sort, pageIndex, cursor];
  };

  const { data, size, setSize, isValidating, error, mutate } = useSWRInfinite(getKey, fetcher, {
    revalidateFirstPage: false,
    persistSize: true,
  });

  // Flatten pages and deduplicate by ID.
  // When a new project is published between page fetches the SQL OFFSET shifts,
  // causing the same row to appear on two consecutive pages → duplicate React keys.
  const projects = useMemo(() => {
    if (!data) return [];
    const seen = new Set();
    return data
      .map(page => page.projects || [])
      .flat()
      .filter((p) => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });
  }, [data]);
  const isLoadingInitialData = !data && !error;
  const isLoadingMore = isLoadingInitialData || (size > 0 && data && typeof data[size - 1] === "undefined");
  const isEmpty = data?.[0]?.projects?.length === 0;

  const GUEST_LIMIT = 32;
  const isGuestRestricted = isAuthLoaded && !currentUserId && projects.length >= GUEST_LIMIT;
  const displayProjects = isGuestRestricted ? projects.slice(0, GUEST_LIMIT) : projects;
  const [masonryColumnCount, setMasonryColumnCount] = useState(5);

  useEffect(() => {
    const updateColumnCount = () => {
      const nextCount = getMasonryColumnCount(window.innerWidth);
      setMasonryColumnCount((currentCount) => (currentCount === nextCount ? currentCount : nextCount));
    };

    updateColumnCount();
    window.addEventListener('resize', updateColumnCount, { passive: true });

    return () => {
      window.removeEventListener('resize', updateColumnCount);
    };
  }, []);

  const effectiveMasonryColumnCount = Math.max(
    2,
    Math.min(masonryColumnCount, Math.ceil(displayProjects.length / 3) || masonryColumnCount)
  );

  const estimateProjectHeight = useCallback((project) => {
    const ratio = projectRatios[project.id] || 1.2;
    return (1 / ratio) + 0.35;
  }, [projectRatios]);

  const masonryColumns = useMemo(
    () => splitIntoColumns(displayProjects, effectiveMasonryColumnCount, estimateProjectHeight),
    [displayProjects, effectiveMasonryColumnCount, estimateProjectHeight]
  );
  const skeletonColumns = useMemo(
    () => splitIntoColumns(Array.from({ length: 12 }, (_, index) => index), effectiveMasonryColumnCount),
    [effectiveMasonryColumnCount]
  );

  const lastProjectId = displayProjects[displayProjects.length - 1]?.id;
  const hasMore = data ? (data[data.length - 1]?.projects?.length === PAGE_SIZE) : false;

  // Background interaction hydration
  useEffect(() => {
    if (!currentUserId || !projects.length) return;

    const missingIds = projects
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

  // Scroll restoration based on previously cached state (Run once on mount when data is ready)
  useEffect(() => {
    if (!scrollRestoredRef.current && projects.length > 0 && scrollPosition > 0) {
      scrollRestoredRef.current = true;
      window.scrollTo({ top: scrollPosition, behavior: 'instant' });
    }
  }, [projects.length, scrollPosition]);

  // Save scroll position only on unmount
  useEffect(() => {
    return () => setScrollPosition(window.scrollY);
  }, [setScrollPosition]);

  // Infinite scroll observer
  const observerRef = useRef(null);
  const lastElementRef = useCallback((node) => {
    if (isLoadingInitialData || isLoadingMore || !hasMore || isGuestRestricted) return;
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
  }, [isLoadingInitialData, isLoadingMore, hasMore, isValidating, size, setSize, isGuestRestricted]);

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



        {/* Banner Section — only render when there are banners */}
        {BANNERS.length > 0 && (
          <div className="event-banner-wrapper" style={{ position: 'relative', overflow: 'hidden', aspectRatio: '4 / 1', borderRadius: 0, marginBottom: '1.5rem', marginTop: '1.5rem' }}>
            <Image
              src={BANNERS[0]}
              alt="Desayner featured banner"
              className="event-banner-img"
              width={1200}
              height={300}
              priority
              sizes="100vw"
              unoptimized={true}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: 0,
                display: 'block',
              }}
            />
          </div>
        )}

        {/* Horizontal Features Carousel (Moved above Search) */}
        <HorizontalFeatureScroll />

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

        {/* HorizontalFeatureScroll was moved up */}

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
            {skeletonColumns.map((column, columnIndex) => (
              <div className="projects-masonry__column" key={`skeleton-column-${columnIndex}`}>
                {column.map((item) => (
                  <div className="projects-masonry__item" key={`skeleton-${item}`}>
                    <ProjectCardSkeleton />
                  </div>
                ))}
              </div>
            ))}
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
            <div style={{ position: 'relative' }}>
              <div className="projects-masonry">
                {masonryColumns.map((column, columnIndex) => (
                  <div className="projects-masonry__column" key={`column-${columnIndex}`}>
                    {column.map((project) => {
                      const interact = interactions[project.id] || {};
                      const isLast = project.id === lastProjectId;

                      return (
                        <div key={project.id} className="projects-masonry__item" ref={isLast ? lastElementRef : null}>
                          <ProjectCard
                            project={project}
                            currentUserId={currentUserId}
                            isLiked={interact.liked}
                            isSaved={interact.saved}
                            onImageLoad={handleProjectImageLoad}
                          />
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {isGuestRestricted && (
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '450px',
                  background: 'linear-gradient(to bottom, rgba(248, 250, 252, 0) 0%, rgba(248, 250, 252, 0.9) 60%, rgba(248, 250, 252, 1) 100%)',
                  pointerEvents: 'none',
                  zIndex: 5
                }}></div>
              )}
            </div>

            {isGuestRestricted ? (
              <div style={{
                position: 'relative',
                paddingTop: '0',
                paddingBottom: '6rem',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
              }}>
                <div style={{
                  maxWidth: '360px',
                  width: '90%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'stretch'
                }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '2rem', lineHeight: 1.2 }}>
                    Log in or sign up to view more projects
                  </h2>

                  <Link href="/auth" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    width: '100%',
                    padding: '0.75rem 1.25rem',
                    background: 'white',
                    color: '#0f172a',
                    fontWeight: 600,
                    borderRadius: '50px',
                    border: '1px solid #e2e8f0',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    marginBottom: '1.5rem',
                    transition: 'all 0.2s ease'
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                    Continue with Google
                  </Link>


                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
                    <span style={{ margin: '0 1rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Or</span>
                    <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
                  </div>

                  <Link href="/auth" style={{
                    display: 'block',
                    width: '100%',
                    padding: '0.75rem 1.25rem',
                    background: 'transparent',
                    color: '#0f172a',
                    fontWeight: 600,
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    border: '1px solid #0f172a',
                    transition: 'all 0.2s ease',
                    marginBottom: '1rem'
                  }}>
                    Continue with Email
                  </Link>
                </div>
              </div>
            ) : isLoadingMore && (
              <div className="projects-masonry" style={{ marginTop: '0.5rem' }}>
                {[...Array(4)].map((_, i) => <ProjectCardSkeleton key={i} />)}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
