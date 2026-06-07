'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, Bookmark, Eye } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import UserAvatar from './UserAvatar';
import ProgressiveImage from './ProgressiveImage';

import dynamic from 'next/dynamic';
const SaveToCollectionModal = dynamic(() => import('./SaveToCollectionModal'), { ssr: false });

export default function ProjectCard({ project, currentUserId }) {
  const [liked, setLiked]         = useState(project.user_liked || false);
  const [saved, setSaved]         = useState(project.user_saved || false);
  const [likeCount, setLikeCount] = useState(project.likes_count || 0);
  const [viewCount, setViewCount] = useState(project.views_count || 0);
  const [showColModal, setShowColModal] = useState(false);
  const supabase = createClient();
  const router = require('next/navigation').useRouter();

  const trackView = async () => {
    if (!project.id) return;
    
    const trackViewWithRetry = async (retries = 2) => {
      try {
        const res = await fetch('/api/view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: project.id })
        });
        
        if (!res.ok && retries > 0) {
          console.warn('View tracking failed, retrying...');
          setTimeout(() => trackViewWithRetry(retries - 1), 500);
          return;
        }
        
        if (res.ok) {
          const data = await res.json();
          // Only increment view if not cached (hasn't viewed in last hour)
          if (data.success && !data.cached) {
            setViewCount(prev => prev + 1);
          }
        }
      } catch (err) {
        if (retries > 0) {
          console.warn('View tracking error, retrying:', err.message);
          setTimeout(() => trackViewWithRetry(retries - 1), 500);
        } else {
          console.error('View tracking failed:', err);
        }
      }
    };
    
    trackViewWithRetry();
  };

  async function handleLike(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUserId) {
      router.push('/login?redirectTo=' + encodeURIComponent(window.location.pathname));
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
      router.push('/login?redirectTo=' + encodeURIComponent(window.location.pathname));
      return;
    }
    setShowColModal(true);
  }

  const author = project.profiles;

  return (
    <div style={{ width: '100%', minWidth: 0 }}>
      <motion.div 
        className="project-card" 
        whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
      >
        {/* Thumbnail */}
        <Link href={`/projects/${project.id}`} className="project-card__thumb-link" prefetch={true} onClick={trackView}>
          <div className="project-card__thumb">
            {project.cover_url ? (
              // ProgressiveImage: loads thumbnail_url (~500px WebP) first,
              // then cross-fades to full cover_url. Falls back to cover_url for both if no thumbnail.
              <ProgressiveImage
                src={project.cover_url}
                thumbnail={project.thumbnail_url || project.cover_url}
                alt={project.title}
                aspectRatio="4/3"
                imgStyle={{ objectFit: 'cover' }}
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
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={handleLike}
              className={`project-card__action-btn ${liked ? 'project-card__action-btn--liked' : ''}`}
              title={liked ? 'Unlike' : 'Like'}
            >
              <Eye size={14} />
              {viewCount > 0 && <span>{viewCount}</span>}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={handleLike}
              className={`project-card__action-btn ${liked ? 'project-card__action-btn--liked' : ''}`}
              title={liked ? 'Unlike' : 'Like'}
            >
              <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
              {likeCount > 0 && <span>{likeCount}</span>}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={handleSave}
              className={`project-card__action-btn ${saved ? 'project-card__action-btn--saved' : ''}`}
              title={saved ? 'Unsave' : 'Save'}
            >
              <Bookmark size={14} fill={saved ? 'currentColor' : 'none'} />
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
