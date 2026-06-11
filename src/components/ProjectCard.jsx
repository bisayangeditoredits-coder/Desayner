'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, Bookmark, Eye } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import UserAvatar from './UserAvatar';
import { saveProjectModalReturn } from '@/lib/projectModalNav';

import dynamic from 'next/dynamic';
const SaveToCollectionModal = dynamic(() => import('./SaveToCollectionModal'), { ssr: false });

export default function ProjectCard({ project, currentUserId }) {
  const [liked, setLiked]         = useState(project.user_liked || false);
  const [saved, setSaved]         = useState(project.user_saved || false);
  const [likeCount, setLikeCount] = useState(project.likes_count || 0);
  const [viewCount, setViewCount] = useState(project.views_count || 0);
  const [saveCount, setSaveCount] = useState(project.saves_count || 0);
  const [showColModal, setShowColModal] = useState(false);
  // 'loading' | 'loaded' | 'error'
  const [imgStatus, setImgStatus] = useState('loading');

  // FIX: Memoize supabase client — don't create a new instance on every render
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

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
    setLiked(!wasLiked);
    setLikeCount((c) => (wasLiked ? c - 1 : c + 1));
    if (wasLiked) {
      await supabase.from('project_likes').delete()
        .eq('user_id', currentUserId).eq('project_id', project.id);
    } else {
      await supabase.from('project_likes').insert({ user_id: currentUserId, project_id: project.id });
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

  return (
    <div className="project-card-wrapper">
      <motion.div 
        className="project-card" 
        whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
      >
        {/* Thumbnail */}
        <Link
          href={`/projects/${project.id}`}
          className="project-card__thumb-link"
          prefetch={true}
          onClick={saveProjectModalReturn}
        >
          <div className={`project-card__thumb project-card__thumb--${imgStatus}`}>
            {project.cover_url && imgStatus !== 'error' ? (
              <Image
                src={project.thumbnail_url || project.cover_url}
                alt={project.title || 'Project'}
                className="project-card__img"
                width={600}
                height={450}
                sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                onLoad={() => setImgStatus('loaded')}
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
              <span>{viewCount}</span>
            </div>

            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={handleLike}
              className={`project-card__action-btn ${liked ? 'project-card__action-btn--liked' : ''}`}
              title={liked ? 'Unlike' : 'Like'}
            >
              <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
              <span>{likeCount}</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={handleSave}
              className={`project-card__action-btn ${saved ? 'project-card__action-btn--saved' : ''}`}
              title={saved ? 'Unsave' : 'Save'}
            >
              <Bookmark size={14} fill={saved ? 'currentColor' : 'none'} />
              <span>{saveCount}</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
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
