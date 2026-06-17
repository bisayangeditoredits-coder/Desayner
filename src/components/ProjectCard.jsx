'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, Bookmark, Eye } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import UserAvatar from './UserAvatar';
import { saveProjectModalReturn } from '@/lib/projectModalNav';

import dynamic from 'next/dynamic';
import { optimizeImage } from '@/lib/utils';
import useToastStore from '@/store/useToastStore';
const SaveToCollectionModal = dynamic(() => import('./SaveToCollectionModal'), { ssr: false });

export default function ProjectCard({ project, currentUserId, isLiked, isSaved }) {
  const [localLiked, setLocalLiked]         = useState(project.user_liked || false);
  const [localSaved, setLocalSaved]         = useState(project.user_saved || false);
  const liked = isLiked !== undefined ? isLiked : localLiked;
  const saved = isSaved !== undefined ? isSaved : localSaved;
  const [likeCount, setLikeCount] = useState(project.likes_count || 0);
  const [viewCount, setViewCount] = useState(project.views_count || 0);
  const [saveCount, setSaveCount] = useState(project.saves_count || 0);
  const [showColModal, setShowColModal] = useState(false);
  // 'loading' | 'loaded' | 'error'
  const [imgStatus, setImgStatus] = useState('loading');

  // FIX: Memoize supabase client — don't create a new instance on every render
  const supabase = useMemo(() => createClient(), []);
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
        <Link
          href={`/projects/${project.id}`}
          className="project-card__thumb-link"
          prefetch={false}
          onClick={saveProjectModalReturn}
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
                }}
                onError={() => setImgStatus('error')}
              />
            ) : (
              <div className="project-card__no-cover">No cover</div>
            )}

            {/* Hover overlay — positioned absolute inside the relative thumb */}
            <div className="project-card__overlay" style={{ position: 'absolute', inset: 0 }}>
              <p className="project-card__overlay-title">{project.title}</p>
              {project.category && (
                <span className="project-card__overlay-cat">{project.category}</span>
              )}
            </div>
          </div>
        </Link>

        {/* Footer */}
        <div className="project-card__footer">
          <Link
            href={author?.username ? `/profile/${author.username}` : '#'}
            className="project-card__author"
          >
            <UserAvatar
              src={author?.avatar_url}
              name={author?.full_name || author?.username || 'Unknown'}
              size={24}
            />
            <span className="project-card__author-name">
              {author?.full_name || author?.username || 'Unknown'}
            </span>
          </Link>

          <div className="project-card__actions">
            <div
              className="project-card__action-btn project-card__action-btn--view"
              title="Views"
              style={{ cursor: 'default' }}
            >
              <Eye size={14} />
              <span className="font-mono">{viewCount}</span>
            </div>

            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={handleLike}
              className={`project-card__action-btn ${liked ? 'project-card__action-btn--liked' : ''}`}
              title={liked ? 'Unlike' : 'Like'}
            >
              <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
              <span className="font-mono">{likeCount}</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={handleSave}
              className={`project-card__action-btn ${saved ? 'project-card__action-btn--saved' : ''}`}
              title={saved ? 'Unsave' : 'Save'}
            >
              <Bookmark size={14} fill={saved ? 'currentColor' : 'none'} />
              <span className="font-mono">{saveCount}</span>
            </motion.button>
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
}
