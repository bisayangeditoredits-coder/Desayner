'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import ProjectCard from '@/components/ProjectCard';
import TagPill from '@/components/TagPill';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import '../../App.css';

import VirtualGridPage from '@/components/VirtualGridPage';
import useFeedStore from '@/store/useFeedStore';

const CATEGORIES = ['All', 'Design', 'Illustration', 'Photography', 'Branding', '3D', 'Motion', 'UI/UX', 'Typography', 'Other'];
const PAGE_SIZE = 24;

export default function ProjectsPage() {
  const { projects, page, category, hasMore, scrollPosition, setFeedState, setScrollPosition } = useFeedStore();
  const [loading, setLoading] = useState(projects.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const isHydrated = useRef(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  
  const observerRef = useRef(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    }
    loadUser();
  }, []);

  // Load data
  useEffect(() => {
    if (projects.length > 0 && !isHydrated.current) {
      isHydrated.current = true;
      return;
    }
    isHydrated.current = true;

    async function load() {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);

      const offset = (page - 1) * PAGE_SIZE;
      
      let query = supabase
        .from('projects')
        .select('*, profiles!projects_user_id_fkey(username, full_name, avatar_url)')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);
        
      if (category !== 'All') query = query.eq('category', category);
      
      const { data, error } = await query;
      if (error) console.error('Projects query error:', error);
      
      const newProjects = data || [];
      if (newProjects.length < PAGE_SIZE) {
        setFeedState({ hasMore: false });
      }
      
      if (page === 1) {
        setFeedState({ projects: [newProjects] });
      } else {
        const existingIds = new Set(projects.flat().map(p => p.id));
        const filtered = newProjects.filter(p => !existingIds.has(p.id));
        if (filtered.length > 0) {
          setFeedState({ projects: [...projects, filtered] });
        }
      }
      
      setLoading(false);
      setLoadingMore(false);
    }
    load();
  }, [category, page]);

  // Scroll restoration
  useEffect(() => {
    if (projects.length > 0 && scrollPosition > 0) {
      setTimeout(() => {
        window.scrollTo({ top: scrollPosition, behavior: 'instant' });
      }, 10);
    }
    return () => setScrollPosition(window.scrollY);
  }, []);

  // Infinite scroll observer
  const lastElementRef = useCallback((node) => {
    if (loading || loadingMore) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setFeedState({ page: page + 1 });
        }
      },
      { rootMargin: '300px' }
    );

    if (node) observerRef.current.observe(node);
  }, [loading, loadingMore, hasMore]);

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
            <Link href="/projects/new" className="btn btn-dark projects-header-btn">
              <Plus size={14} strokeWidth={2.5} />
              <span className="btn-text-responsive">New Project</span>
            </Link>
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
                  setFeedState({ category: cat, page: 1, hasMore: true, projects: [] });
                }} 
              />
            ))}
          </div>

          {loading && page === 1 ? (
            <div className="projects-masonry">
              {[...Array(24)].map((_, i) => <div key={i} className="masonry-item shimmer-box" style={{ aspectRatio: '4/3', borderRadius: '8px' }} />)}
            </div>
          ) : projects.length === 0 || (projects.length === 1 && projects[0].length === 0) ? (
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
              
              {loadingMore && (
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
