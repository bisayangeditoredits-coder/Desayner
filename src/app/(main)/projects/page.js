'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import ProjectCard from '@/components/ProjectCard';
import TagPill from '@/components/TagPill';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import '../../App.css';

const CATEGORIES = ['All', 'Design', 'Illustration', 'Photography', 'Branding', '3D', 'Motion', 'UI/UX', 'Typography', 'Other'];
const PAGE_SIZE = 24;

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [category, setCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
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
      console.log('Projects fetched:', data);
      
      const newProjects = data || [];
      if (newProjects.length < PAGE_SIZE) {
        setHasMore(false);
      }
      
      if (page === 1) {
        setProjects(newProjects);
      } else {
        setProjects(prev => {
          // avoid duplicates just in case
          const existingIds = new Set(prev.map(p => p.id));
          return [...prev, ...newProjects.filter(p => !existingIds.has(p.id))];
        });
      }
      
      setLoading(false);
      setLoadingMore(false);
    }
    load();
  }, [category, page]);

  // Infinite scroll observer — rootMargin preloads the next page
  // 300px before the sentinel reaches the viewport for a seamless feed
  const lastElementRef = useCallback((node) => {
    if (loading || loadingMore) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => prev + 1);
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
            top: '56px', // match top header height
            zIndex: 100,
            background: 'var(--primary-bg, #f1f5f9)', // assuming the background is this color
            padding: '1.5rem 0 1rem', // match the padding of the page
            marginTop: '-1.5rem', // offset the page padding so it sticks flush
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h1 className="page-title" style={{ fontSize: '1.5rem', fontWeight: 800 }}>Projects</h1>
              <p style={{ fontSize: '0.85rem', color: '#9b9b9b', marginTop: '0.25rem' }}>Discover work from the community</p>
            </div>
            <Link href="/projects/new" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.2rem', background: '#0a0a0a', color: 'white', fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none' }}>
              <Plus size={14} strokeWidth={2.5} /> New Project
            </Link>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            {CATEGORIES.map(cat => (
              <TagPill 
                key={cat} 
                label={cat} 
                active={category === cat} 
                onClick={() => {
                  if (category === cat) return;
                  setCategory(cat);
                  setPage(1);
                  setHasMore(true);
                  setProjects([]);
                }} 
              />
            ))}
          </div>

          {loading && page === 1 ? (
            <div className="projects-masonry">
              {[...Array(24)].map((_, i) => <div key={i} className="masonry-item shimmer-box" style={{ aspectRatio: '4/3', borderRadius: '0' }} />)}
            </div>
          ) : projects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '6rem 2rem', border: '1px solid #e8e8e8', background: 'white' }}>
              <p style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>No projects in {category}</p>
              <p style={{ color: '#9b9b9b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Be the first to share one.</p>
              <Link href="/projects/new" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.5rem', background: '#0a0a0a', color: 'white', fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none' }}>
                <Plus size={14} /> Create Project
              </Link>
            </div>
          ) : (
            <>
              <div className="projects-masonry">
                {projects.map((project, index) => {
                  if (index === projects.length - 1) {
                    return (
                      <div ref={lastElementRef} key={project.id}>
                        <ProjectCard project={project} currentUserId={currentUserId} />
                      </div>
                    );
                  }
                  return <ProjectCard key={project.id} project={project} currentUserId={currentUserId} />;
                })}
              </div>
              
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
