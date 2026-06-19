'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import ProjectCard from '@/components/projects/ProjectCard';
import ProjectCardSkeleton from '@/components/projects/ProjectCardSkeleton';
import Link from 'next/link';
import { Bookmark, Folder, ArrowLeft } from 'lucide-react';
import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';
import '../../App.css';

const fetcher = (url) => fetch(url).then((r) => {
  if (!r.ok) throw new Error('Request failed');
  return r.json();
});

function useSavedProjects(viewKey, collectionId) {
  const getKey = (pageIndex, previousPageData) => {
    if (!viewKey) return null;
    if (previousPageData && !previousPageData.hasMore) return null;
    const base = `/api/saved?page=${pageIndex + 1}`;
    if (collectionId) {
      return `${base}&collectionId=${collectionId}`;
    }
    return base;
  };

  return useSWRInfinite(getKey, fetcher, { revalidateFirstPage: false });
}

export default function SavedPage() {
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const loadMoreRef = useRef(null);
  const supabase = useMemo(() => createClient(), []);

  const collectionId = selectedCollection && selectedCollection !== 'ALL'
    ? selectedCollection.id
    : null;

  const viewKey = selectedCollection
    ? (selectedCollection === 'ALL' ? 'all' : `col-${collectionId}`)
    : null;

  const { data: collectionsData, isLoading: collectionsLoading } = useSWR(
    authChecked && currentUserId ? '/api/saved/collections' : null,
    fetcher,
  );

  const { data: savedMeta } = useSWR(
    authChecked && currentUserId && !selectedCollection ? '/api/saved?page=1' : null,
    fetcher,
  );

  const {
    data: pages,
    size,
    setSize,
    isLoading: projectsLoading,
    isValidating,
  } = useSavedProjects(viewKey, collectionId);

  const projects = useMemo(
    () => (pages || []).flatMap((p) => p.projects || []),
    [pages],
  );

  const hasMore = pages?.[pages.length - 1]?.hasMore ?? false;
  const savedTotal = selectedCollection
    ? (pages?.[0]?.total ?? 0)
    : (savedMeta?.total ?? 0);
  const collections = collectionsData?.collections || [];

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
      setAuthChecked(true);
    }
    loadUser();
  }, [supabase]);

  const loadMore = useCallback(() => {
    if (!isValidating && hasMore) setSize(size + 1);
  }, [isValidating, hasMore, setSize, size]);

  useEffect(() => {
    if (!selectedCollection || !loadMoreRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: '200px' },
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [selectedCollection, loadMore]);

  const loading = !authChecked || (selectedCollection && projectsLoading && !pages?.length);
  const gridLoading = !authChecked || (!selectedCollection && collectionsLoading);

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Saved</h1>
          <p style={{ fontSize: '0.85rem', color: '#9b9b9b', marginTop: '0.25rem' }}>
            Your bookmarked projects and collections
          </p>
        </div>
      </div>

      {gridLoading ? (
        <div className="projects-masonry">
          {[...Array(6)].map((_, i) => <ProjectCardSkeleton key={i} />)}
        </div>
      ) : !selectedCollection && savedTotal === 0 && collections.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', border: '1px solid #e8e8e8', background: 'white', borderRadius: '12px' }}>
          <Bookmark size={28} style={{ color: '#e0e0e0', display: 'block', margin: '0 auto 1rem' }} />
          <p style={{ color: '#9b9b9b', fontSize: '0.875rem', marginBottom: '1rem' }}>No saved projects yet.</p>
          <Link href="/" className="btn" style={{ display: 'inline-block', padding: '0.5rem 1.25rem', border: '1px solid #e8e8e8', fontSize: '0.8rem', fontWeight: 700, color: '#231f20', textDecoration: 'none' }}>
            Browse Projects
          </Link>
        </div>
      ) : selectedCollection ? (
        <div>
          <button
            type="button"
            onClick={() => setSelectedCollection(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.9rem', marginBottom: '1.5rem', color: '#231f20', padding: 0 }}
          >
            <ArrowLeft size={16} /> Back to Collections
          </button>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 700 }}>
            {selectedCollection === 'ALL' ? 'All Saved Items' : selectedCollection.name}
          </h2>

          {loading ? (
            <div className="projects-masonry">
              {[...Array(6)].map((_, i) => <ProjectCardSkeleton key={i} />)}
            </div>
          ) : projects.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', background: '#fafafa', borderRadius: '12px', border: '1px solid #e8e8e8' }}>
              <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>No projects in this collection.</p>
            </div>
          ) : (
            <>
              <div className="projects-masonry">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} currentUserId={currentUserId} />
                ))}
              </div>
              {hasMore && (
                <div ref={loadMoreRef} style={{ padding: '2rem', textAlign: 'center' }}>
                  {isValidating && (
                    <div className="projects-masonry" style={{ marginTop: '1rem' }}>
                      {[...Array(4)].map((_, i) => <ProjectCardSkeleton key={i} />)}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          <div
            role="button"
            tabIndex={0}
            onClick={() => setSelectedCollection('ALL')}
            onKeyDown={(e) => e.key === 'Enter' && setSelectedCollection('ALL')}
            style={{ padding: '1.5rem', background: 'white', border: '1px solid #e8e8e8', borderRadius: '12px', cursor: 'pointer', transition: 'border-color 0.2s, box-shadow 0.2s', display: 'flex', flexDirection: 'column', gap: '0.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = '#d1d1d1'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e8e8e8'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)'; }}
          >
            <Folder size={24} color="#231f20" />
            <div>
              <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.2rem' }}>All Saved Items</h3>
              <p style={{ color: '#9b9b9b', fontSize: '0.85rem' }}>{savedTotal} items</p>
            </div>
          </div>

          {collections.map((col) => (
            <div
              key={col.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedCollection(col)}
              onKeyDown={(e) => e.key === 'Enter' && setSelectedCollection(col)}
              style={{ padding: '1.5rem', background: 'white', border: '1px solid #e8e8e8', borderRadius: '12px', cursor: 'pointer', transition: 'border-color 0.2s, box-shadow 0.2s', display: 'flex', flexDirection: 'column', gap: '0.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = '#d1d1d1'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e8e8e8'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)'; }}
            >
              <Folder size={24} color="#231f20" />
              <div>
                <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{col.name}</h3>
                <p style={{ color: '#9b9b9b', fontSize: '0.85rem' }}>{col.itemCount} items</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
