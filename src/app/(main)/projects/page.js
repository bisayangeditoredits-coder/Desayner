'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import ProjectCard from '@/components/ProjectCard';
import TagPill from '@/components/TagPill';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import '../../App.css';
import useSWRInfinite from 'swr/infinite';

import VirtualGridPage from '@/components/VirtualGridPage';
import useFeedStore from '@/store/useFeedStore';

const CATEGORIES = ['All', 'Design', 'Illustration', 'Photography', 'Branding', '3D', 'Motion', 'UI/UX', 'Typography', 'Other'];
const PAGE_SIZE = 24;

export default function ProjectsPage() {
  const { category, scrollPosition, setFeedState, setScrollPosition } = useFeedStore();
  const [currentUserId, setCurrentUserId] = useState(null);

  const supabase = createMemoizedClient();

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
    // Reached the end if previous page had fewer items than PAGE_SIZE
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
      <div className="page-content">
        <div className="page-header" style={{
          position: 'sticky',
          top: '56px',
          zIndex: 100,
          background: 'var(--primary-bg, #f1f5f9)',
          padding: '1.5rem 0 1rem',
          marginTop: '-1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.5rem', fontWeight: 800 }}>Projects</h1>
            <p style={{ fontSize: '0.85rem', color: '#9b9b9b', marginTop: '0.25rem' }}>Discover work from the community</p>
          </div>
          <a href="/projects/new" className="btn btn-dark" style={{ borderRadius: '8px', textDecoration: 'none' }}>
            <Plus size={14} strokeWidth={2.5} />
            <span className="btn-text-responsive">New Project</span>
          </a>
        </div>

        <div style={{
          display: 'flex',
          gap: '0.4rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem',
          marginBottom: '1.25rem',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
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
            {projects.map((chunk, chunkIndex) => (
              <VirtualGridPage
                key={`page-${chunkIndex}`}
                projects={chunk}
                currentUserId={currentUserId}
                isLastPage={chunkIndex === projects.length - 1}
                lastElementRef={lastElementRef}
              />
            ))}

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

function createMemoizedClient() {
  let client = null;
  if (!client) {
    client = createClient();
  }
  return client;
}
