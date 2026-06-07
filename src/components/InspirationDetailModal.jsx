'use client';
import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Bookmark, Trash2, X, Calendar, Folder, Eye } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import UserAvatar from './UserAvatar';
import SaveToCollectionModal from './SaveToCollectionModal';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function InspirationDetailModal({ inspiration, currentUserId, onClose, onDeleteSuccess }) {
  const [liked, setLiked]         = useState(inspiration.user_liked || false);
  const [likesCount, setLikesCount] = useState(inspiration.likes_count || 0);
  const [viewsCount, setViewsCount] = useState(inspiration.views_count || 0);
  const [saved, setSaved]           = useState(false);
  const [savesCount, setSavesCount] = useState(inspiration.saves_count || 0);
  const [deleting, setDeleting]     = useState(false);
  const [showColModal, setShowColModal] = useState(false);
  const [isZoomed, setIsZoomed]     = useState(false);
  const [viewTracked, setViewTracked] = useState(false);

  const supabase = createClient();
  const router   = useRouter();
  const creator  = inspiration.profiles;
  const isOwner  = currentUserId === inspiration.user_id;

  // Track view on modal open (only once) with retry logic
  React.useEffect(() => {
    if (!viewTracked && inspiration.id) {
      const trackViewWithRetry = async (retries = 2) => {
        try {
          const res = await fetch(`/api/inspirations/${inspiration.id}/views`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (!res.ok && retries > 0) {
            console.warn('View tracking failed, retrying...');
            setTimeout(() => trackViewWithRetry(retries - 1), 500);
          } else if (res.ok) {
            const data = await res.json();
            if (data.success) {
              setViewsCount(prev => prev + 1);
              setViewTracked(true);
            }
          }
        } catch (err) {
          if (retries > 0) {
            console.warn('View tracking error, retrying:', err.message);
            setTimeout(() => trackViewWithRetry(retries - 1), 500);
          } else {
            console.error('View tracking failed:', err);
            setViewTracked(true); // Don't retry forever
          }
        }
      };
      
      trackViewWithRetry();
    }
  }, [inspiration.id, viewTracked]);

  React.useEffect(() => {
    if (currentUserId) {
      supabase
        .from('inspiration_saves')
        .select('id')
        .eq('user_id', currentUserId)
        .eq('inspiration_id', inspiration.id)
        .single()
        .then(({ data }) => setSaved(!!data));
    }
  }, [currentUserId, inspiration.id, supabase]);

  const handleLike = useCallback(async (e) => {
    e.preventDefault();
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

  const handleDelete = useCallback(async () => {
    if (!window.confirm('Are you sure you want to delete this inspiration?')) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('inspirations')
        .delete()
        .eq('id', inspiration.id);

      if (error) throw error;
      onDeleteSuccess(inspiration.id);
    } catch (err) {
      console.error(err);
      alert('Failed to delete inspiration');
    } finally {
      setDeleting(false);
    }
  }, [inspiration.id, supabase, onDeleteSuccess]);

  const handleSave = useCallback(async () => {
    if (!currentUserId) {
      router.push('/login?redirectTo=' + encodeURIComponent(window.location.pathname));
      return;
    }
    setShowColModal(true);
  }, [currentUserId, router]);

  return (
    <div className="inspiration-modal-overlay" onClick={onClose}>
      <div className="inspiration-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="inspiration-modal-body">
          {/* Left Panel: High-res visual image */}
          <div className="inspiration-modal-image-panel" style={{ overflow: 'hidden' }}>
            <img
              src={inspiration.image_url}
              alt={inspiration.title || 'Inspiration'}
              className="inspiration-modal-image"
              style={{ maxHeight: '100%', objectFit: 'contain', cursor: 'zoom-in' }}
              onClick={() => setIsZoomed(true)}
            />
          </div>

          {/* Full Screen Lightbox Zoom */}
          {isZoomed && (
            <div
              className="lightbox-overlay"
              onClick={() => setIsZoomed(false)}
              role="dialog"
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 99999,
                background: 'rgba(0,0,0,0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'zoom-out'
              }}
            >
              <button 
                style={{ position: 'absolute', top: '24px', right: '24px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '50%', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                onClick={() => setIsZoomed(false)}
              >
                <X size={24} />
              </button>
              <img
                src={inspiration.image_url}
                alt={inspiration.title || 'Inspiration'}
                style={{ maxWidth: '95vw', maxHeight: '95vh', objectFit: 'contain', borderRadius: '8px' }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          {/* Right Panel: Content details, meta, actions */}
          <div className="inspiration-modal-info-panel">
            <div>
              {/* Creator Card */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <UserAvatar
                    src={creator?.avatar_url}
                    name={creator?.full_name || creator?.username}
                    size={36}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 800 }}>
                      {creator?.full_name || creator?.username || 'Designer'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>
                      @{creator?.username || 'designer'}
                    </span>
                  </div>
                </div>
                <button className="toast-close-btn" onClick={onClose} aria-label="Close modal">
                  <X size={16} />
                </button>
              </div>

              {/* Title & Description */}
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
                {inspiration.title}
              </h2>
              {inspiration.description && (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-dim, #475569)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                  {inspiration.description}
                </p>
              )}

              {/* Metadata Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: 'var(--border, 1px solid #e2e8f0)', paddingTop: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-dim, #475569)' }}>
                  <Folder size={14} />
                  <span>Category: <strong>{inspiration.category}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-dim, #475569)' }}>
                  <Eye size={14} />
                  <span><strong>{viewsCount}</strong> {viewsCount === 1 ? 'View' : 'Views'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-dim, #475569)' }}>
                  <Calendar size={14} />
                  <span>Shared: <strong>{timeAgo(inspiration.created_at)}</strong></span>
                </div>
              </div>
            </div>

            {/* Bottom Actions Toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderTop: 'var(--border, 1px solid #e2e8f0)', paddingTop: '1.5rem' }}>
              <button
                onClick={handleLike}
                className="btn btn-outline"
                style={{ flex: 1, justifyContent: 'center', borderRadius: '8px', padding: '0.65rem', gap: '0.5rem' }}
              >
                <Heart size={16} className={liked ? 'inspiration-like-btn--liked' : ''} fill={liked ? 'currentColor' : 'none'} />
                <span>{likesCount} {likesCount === 1 ? 'Like' : 'Likes'}</span>
              </button>

              <button
                onClick={handleSave}
                className="btn btn-outline"
                style={{ borderRadius: '8px', padding: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                title={saved ? "Unsave" : "Save inspiration"}
              >
                <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} className={saved ? 'text-blue-500' : ''} />
                <span className="hidden sm:inline">{saved ? 'Saved' : 'Save'}</span>
                <span>{savesCount > 0 ? savesCount : ''}</span>
              </button>

              {isOwner && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="btn btn-danger"
                  style={{ borderRadius: '8px', padding: '0.65rem', background: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444' }}
                  title="Delete inspiration"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      {showColModal && (
        <SaveToCollectionModal
          itemType="inspiration"
          itemId={inspiration.id}
          onClose={() => setShowColModal(false)}
        />
      )}
    </div>
  );
}
