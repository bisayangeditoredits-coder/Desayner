'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import ProjectCard from '@/components/ProjectCard';
import TagPill from '@/components/TagPill';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { Plus } from 'lucide-react';
import useSWRInfinite from 'swr/infinite';
import useFeedStore from '@/store/useFeedStore';
import '../App.css';

const WelcomeModal = dynamic(() => import('@/components/WelcomeModal'), { ssr: false });

const BANNERS = [
  '/banner-event-homepage.jpeg'
];

const CATEGORIES = ['All', 'Design', 'Illustration', 'Photography', 'Branding', '3D', 'Motion', 'UI/UX', 'Typography', 'Other'];
const PAGE_SIZE = 24;

export default function Dashboard() {
  const [currentBanner, setCurrentBanner] = useState(0);

  // Banner carousel logic
  useEffect(() => {
    if (BANNERS.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % BANNERS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const { category, scrollPosition, interactions, setFeedState, setScrollPosition, setInteractions } = useFeedStore();
  const [currentUserId, setCurrentUserId] = useState(null);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    }
    loadUser();
  }, [supabase]);

  // SWR Fetcher definition
  const fetcher = async ([key, cat, pageIndex]) => {
    const offset = pageIndex * PAGE_SIZE;
    const res = await fetch(`/api/projects?category=${encodeURIComponent(cat)}&limit=${PAGE_SIZE}&offset=${offset}`);
    if (!res.ok) throw new Error('Failed to fetch projects');
    const { projects } = await res.json();
    return projects || [];
  };

  const getKey = (pageIndex, previousPageData) => {
    if (previousPageData && previousPageData.length < PAGE_SIZE) return null;
    return ['projects_feed', category, pageIndex];
  };

  const { data, size, setSize, isValidating, error } = useSWRInfinite(getKey, fetcher, {
    revalidateFirstPage: false,
    persistSize: true,
  });

  const projects = data || [];
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

  // Scroll restoration based on previously cached state
  useEffect(() => {
    if (projects.length > 0 && scrollPosition > 0) {
      setTimeout(() => {
        window.scrollTo({ top: scrollPosition, behavior: 'instant' });
      }, 10);
    }
    return () => setScrollPosition(window.scrollY);
  }, []);

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

  return (
    <>
      <WelcomeModal />
      <div className="page-content" style={{ padding: '0 1.5rem 2rem' }}>
        
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

        {/* Category Tabs */}
        <div style={{
          position: 'sticky',
          top: '56px',
          zIndex: 99,
          display: 'flex',
          gap: '0.4rem',
          overflowX: 'auto',
          paddingBottom: '0.75rem',
          paddingTop: '0.5rem',
          marginBottom: '1.25rem',
          marginLeft: '-1.5rem',
          marginRight: '-1.5rem',
          paddingLeft: '1.5rem',
          paddingRight: '1.5rem',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          background: 'rgba(241, 245, 249, 0.92)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }} className="category-scroll-container">
          {CATEGORIES.map(cat => (
            <TagPill
              key={cat}
              label={cat}
              active={category === cat}
              onClick={() => {
                if (category === cat) return;
                setFeedState({ category: cat });
              }}
            />
          ))}
        </div>

        {/* Masonry Project Grid */}
        {isLoadingInitialData ? (
          <div className="projects-masonry">
            {[...Array(24)].map((_, i) => <div key={i} className="masonry-item shimmer-box" style={{ aspectRatio: '4/3', borderRadius: '8px' }} />)}
          </div>
        ) : isEmpty ? (
          <div style={{ textAlign: 'center', padding: '6rem 2rem', border: '1px solid #e8e8e8', background: 'white', borderRadius: '12px' }}>
            <p style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>No projects in {category}</p>
            <p style={{ color: '#9b9b9b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Be the first to share one.</p>
            <Link href="/projects/new" className="btn btn-dark">
              <Plus size={14} /> Create Project
            </Link>
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
