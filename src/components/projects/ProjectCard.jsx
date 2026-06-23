'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, Bookmark, Eye } from 'lucide-react';
import UserAvatar from '@/components/ui/UserAvatar';
import { saveProjectModalReturn } from '@/lib/projectModalNav';

import dynamic from 'next/dynamic';
import { optimizeImage } from '@/lib/utils';
import useToastStore from '@/store/useToastStore';
const SaveToCollectionModal = dynamic(() => import('./SaveToCollectionModal'), { ssr: false });

const ProjectCard = React.memo(function ProjectCard({ project, currentUserId, isLiked, isSaved, onImageLoad }) {
  const [localLiked, setLocalLiked]         = useState(project.user_liked || false);
  const [localSaved, setLocalSaved]         = useState(project.user_saved || false);
  const liked = isLiked !== undefined ? isLiked : localLiked;
  const saved = isSaved !== undefined ? isSaved : localSaved;
  const [likeCount, setLikeCount] = useState(project.likes_count || 0);
  const [viewCount, setViewCount] = useState(project.views_count || 0);
  const [showColModal, setShowColModal] = useState(false);
  // 'loading' | 'loaded' | 'error'
  const [imgStatus, setImgStatus] = useState('loading');

  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);

  // FIX: Removed per-card realtime Supabase subscription.
  // Opening 1 WebSocket channel per card (up to 24+) floods the browser connection pool
  // and burns Supabase realtime quota. Optimistic UI on like/save is sufficient for UX.

  async function handleLike(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUserId) {
      router.push('/login?redirectTo=' + encodeURIComponent(window.location.pathname + window.location.search));
      return;
    }
    const wasLiked = liked;
    if (isLiked === undefined) setLocalLiked(!wasLiked);
    setLikeCount((c) => (wasLiked ? c - 1 : c + 1));
    
    try {
      const res = await fetch(`/api/projects/${project.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: wasLiked ? 'unlike' : 'like' })
      });
      if (!res.ok) throw new Error('Like request failed');
    } catch (err) {
      console.error('Like failed', err);
      if (isLiked === undefined) setLocalLiked(wasLiked);
      setLikeCount((c) => (wasLiked ? c + 1 : c - 1));
      addToast({ type: 'error', message: 'Could not update like. Please try again.' });
    }
  }

  function handleSave(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUserId) {
      router.push('/login?redirectTo=' + encodeURIComponent(window.location.pathname + window.location.search));
      return;
    }
    setShowColModal(true);
  }

  const author = project.profiles;
  const coverSrc = optimizeImage(project.thumbnail_url || project.cover_url, 600);

  return (
    <div className="project-card-wrapper">
      <div className="project-card">
        {/* Thumbnail */}
        <a
          href={`/projects/${project.id}`}
          className="project-card__thumb-link"
          onClick={(e) => {
            // Guarantee no default Next.js scroll-to-top behavior
            e.preventDefault();
            saveProjectModalReturn();
            router.push(`/projects/${project.id}`, { scroll: false });
          }}
        >
          <div className={`project-card__thumb project-card__thumb--${imgStatus}`}>
            {coverSrc && imgStatus !== 'error' ? (
              <img
                src={coverSrc}
                alt={project.title || 'Project'}
                className="project-card__img img-fade-in"
                loading="lazy"
                decoding="async"
                onLoad={(e) => {
                  e.currentTarget.classList.add('loaded');
                  setImgStatus('loaded');
                  onImageLoad?.(project.id, e.currentTarget.naturalWidth / e.currentTarget.naturalHeight);
                }}
                onError={() => setImgStatus('error')}
              />
            ) : (
              <div className="project-card__no-cover">No cover</div>
            )}

            <div className="project-card__overlay" style={{ position: 'absolute', inset: 0 }}>
              <div className="project-card__overlay-content">
                <p className="project-card__overlay-title">{project.title}</p>
              </div>

              {/* Quick Actions (Floating Glassmorphism) */}
              <div className="project-card__overlay-actions" onClick={(e) => e.preventDefault()}>
                <button
                  type="button"
                  onClick={handleSave}
                  className={`project-card__quick-btn ${saved ? 'project-card__quick-btn--active' : ''}`}
                  title={saved ? 'Unsave' : 'Save'}
                  aria-label="Save project"
                >
                  <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
                </button>
                <button
                  type="button"
                  onClick={handleLike}
                  className={`project-card__quick-btn ${liked ? 'project-card__quick-btn--active' : ''}`}
                  title={liked ? 'Unlike' : 'Like'}
                  aria-label="Like project"
                >
                  <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>
          </div>
        </a>

        {/* Footer */}
        <div className="project-card__footer">
          <Link
            href={author?.username ? `/profile/${author.username}?source=project` : '#'}
            className="project-card__author"
            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}
            target="_blank"
            rel="noopener noreferrer"
          >
            <UserAvatar
              src={author?.avatar_url}
              name={author?.full_name || author?.username || 'Unknown'}
              size={32}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="project-card__author-name" style={{ fontSize: '0.85rem', fontWeight: 700, maxWidth: '110px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {author?.full_name || author?.username || 'Unknown'}
                </span>
                {author?.available_for_work && (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: "3px",
                    padding: "2px 5px", background: "#dcfce7", color: "#166534",
                    borderRadius: "4px", fontSize: "9px", fontWeight: 800,
                    textTransform: "uppercase"
                  }}>
                    <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#166534" }} />
                    HIRE
                  </span>
                )}
              </div>
              <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {project.category || 'Design'}
              </span>
            </div>
          </Link>

          <div className="project-card__actions">
            <div
              className="project-card__action-btn project-card__action-btn--view"
              title="Likes"
            >
              <Heart size={14} fill={liked ? '#ef4444' : 'transparent'} color={liked ? '#ef4444' : 'currentColor'} />
              <span className="font-mono" style={{ color: liked ? '#ef4444' : 'inherit' }}>{likeCount}</span>
            </div>
            
            <div
              className="project-card__action-btn project-card__action-btn--view"
              title="Views"
            >
              <Eye size={14} />
              <span className="font-mono">{viewCount}</span>
            </div>
          </div>
        </div>
      </div>
      {showColModal && (
        <SaveToCollectionModal
          itemType="project"
          itemId={project.id}
          onClose={() => setShowColModal(false)}
        />
      )}
    </div>
  );
});

ProjectCard.displayName = 'ProjectCard';
export default ProjectCard;
