'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';

import useProjectsFeed from '@/hooks/useProjectsFeed';
import FeedHeader from '@/components/projects/FeedHeader';
import CategoryFilter from '@/components/projects/CategoryFilter';
import MasonryGrid from '@/components/layout/MasonryGrid';
import ProjectCard from '@/components/projects/ProjectCard';
import ProjectCardSkeleton from '@/components/projects/ProjectCardSkeleton';
import '../App.css';

export default function Dashboard() {
  const router = useRouter();
  
  const {
    projects,
    isLoadingInitialData,
    isLoadingMore,
    isEmpty,
    hasMore,
    isGuestRestricted,
    lastElementRef,
    searchInput,
    setSearchInput,
    category,
    setFeedState,
    sort,
    interactions
  } = useProjectsFeed();

  function goToSearch() {
    const q = searchInput.trim();
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`);
    }
  }

  return (
    <div className="page-content feed-page">
      <FeedHeader 
        searchInput={searchInput} 
        setSearchInput={setSearchInput} 
        goToSearch={goToSearch} 
      />

      <div className="feed-controls-wrapper">
        <CategoryFilter 
          currentCategory={category} 
          setFeedState={setFeedState} 
        />
      </div>

      {isLoadingInitialData ? (
        <MasonryGrid isLoading={true} skeletonCount={12} />
      ) : isEmpty ? (
        <div className="feed-empty-state">
          <p className="feed-empty-state__title">
            {searchInput.trim() ? `No results for "${searchInput.trim()}"` : `No projects in ${category}`}
          </p>
          <p className="feed-empty-state__desc">
            {searchInput.trim() ? 'Try different keywords or browse all projects.' : 'Be the first to share one.'}
          </p>
          {searchInput.trim() ? (
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
          <div className="feed-masonry-wrapper">
            <MasonryGrid 
              items={projects} 
              isLoading={false} 
              renderItem={(project, onImageLoad) => {
                const interact = interactions[project.id] || {};
                const isLast = project.id === projects[projects.length - 1]?.id;

                return (
                  <div key={project.id} className="projects-masonry__item" ref={isLast ? lastElementRef : null}>
                    <ProjectCard
                      project={project}
                      isLiked={interact.liked}
                      isSaved={interact.saved}
                      onImageLoad={onImageLoad}
                    />
                  </div>
                );
              }}
            />

            {isGuestRestricted && <div className="guest-restriction-gradient"></div>}
          </div>

          {isGuestRestricted ? (
            <div className="guest-restriction-prompt">
              <div className="guest-restriction-prompt__inner">
                <h2>Log in or sign up to view more projects</h2>
                <Link href="/signup" className="btn-auth-google">
                  <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                  Continue with Google
                </Link>

                <div className="auth-divider">
                  <div></div>
                  <span>Or</span>
                  <div></div>
                </div>

                <Link href="/signup" className="btn-auth-email">
                  Continue with Email
                </Link>
              </div>
            </div>
          ) : isLoadingMore && (
            <div className="projects-masonry loading-more">
              {[...Array(4)].map((_, i) => <ProjectCardSkeleton key={i} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
