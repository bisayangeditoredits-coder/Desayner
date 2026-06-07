'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Eye } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import UserAvatar from './UserAvatar';
import ProgressiveImage from './ProgressiveImage';

export default function InspirationCard({ inspiration, currentUserId, onClick }) {
  const [liked, setLiked]         = useState(inspiration.user_liked || false);
  const [likesCount, setLikesCount] = useState(inspiration.likes_count || 0);
  const [viewsCount, setViewsCount] = useState(inspiration.views_count || 0);
  const supabase = createClient();
  const router   = useRouter();

  const handleCardClick = useCallback(() => {
    // Track view when card is clicked (with retry logic)
    if (inspiration.id) {
      const trackViewWithRetry = async (retries = 2) => {
        try {
          const res = await fetch(`/api/inspirations/${inspiration.id}/views`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (!res.ok && retries > 0) {
            // Retry on failure
            console.warn('View tracking failed, retrying...');
            setTimeout(() => trackViewWithRetry(retries - 1), 500);
          } else if (res.ok) {
            const data = await res.json();
            if (data.success && typeof data.views === 'number') {
              setViewsCount(data.views);
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
    }
    onClick?.();
  }, [inspiration.id, onClick]);

  const handleLike = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUserId) {
      router.push('/login?redirectTo=' + encodeURIComponent(window.location.pathname));
      return;
    }

    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikesCount((prev) => (wasLiked ? prev - 1 : prev + 1));

    if (wasLiked) {
      await supabase
        .from('inspiration_likes')
        .delete()
        .eq('user_id', currentUserId)
        .eq('inspiration_id', inspiration.id);
    } else {
      await supabase
        .from('inspiration_likes')
        .insert({
          user_id: currentUserId,
          inspiration_id: inspiration.id,
        });
    }
  }, [liked, currentUserId, inspiration.id, router, supabase]);

  const creator = inspiration.profiles;

  return (
    <div className="inspirations-card-wrapper">
      <div className="inspiration-card" onClick={handleCardClick}>
        <div className="inspiration-image-wrap">
          <img
            src={inspiration.thumbnail_url || inspiration.image_url}
            alt={inspiration.title || 'Inspiration'}
            loading="lazy"
            decoding="async"
            className="inspiration-img"
          />
          <div className="inspiration-overlay">
            <div className="inspiration-overlay-top">
              <button
                onClick={handleLike}
                className={`inspiration-like-btn ${liked ? 'inspiration-like-btn--liked' : ''}`}
                aria-label={liked ? 'Unlike' : 'Like'}
              >
                <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
              </button>
            </div>
            <div className="inspiration-overlay-bottom">
              <div className="inspiration-user-info">
                <UserAvatar
                  src={creator?.avatar_url}
                  name={creator?.full_name || creator?.username}
                  size={20}
                />
                <span className="inspiration-user-name">
                  {creator?.full_name || creator?.username || 'Designer'}
                </span>
              </div>
              <div className="inspiration-stats">
                <div className="inspiration-stat">
                  <Eye size={10} />
                  <span>{viewsCount}</span>
                </div>
                <div className="inspiration-stat">
                  <Heart size={10} fill="currentColor" />
                  <span>{likesCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
