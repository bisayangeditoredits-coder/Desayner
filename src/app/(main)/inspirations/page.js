'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import InspirationCard from '@/components/InspirationCard';
import InspirationUploadModal from '@/components/InspirationUploadModal';
import InspirationDetailModal from '@/components/InspirationDetailModal';
import './Inspirations.css';

const CATEGORIES = ['All', 'General', 'Graphic Design', 'Web Design', 'Typography', 'UI/UX', 'Photography', 'Branding', '3D & Illustration'];
const LIMIT = 15;

export default function InspirationsPage() {
  const [inspirations, setInspirations] = useState([]);
  const [nextCursor, setNextCursor]   = useState(null);
  const [hasMore, setHasMore]         = useState(true);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeCat, setActiveCat]     = useState('All');
  const [currentUserId, setCurrentUserId] = useState(null);

  // Modals
  const [uploadOpen, setUploadOpen]                   = useState(false);
  const [selectedInspiration, setSelectedInspiration] = useState(null);
  
  // Masonry column tracking
  const [cols, setCols] = useState(4);

  const supabase    = createClient();
  const sentinelRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 480) setCols(2);
      else if (window.innerWidth <= 768) setCols(2);
      else if (window.innerWidth <= 1200) setCols(3);
      else setCols(4);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 1. Identify logged-in user details
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, [supabase]);

  // 2. Core paginated data loading
  const fetchInspirations = useCallback(async (category, cursor = null) => {
    try {
      const isFirst = !cursor;
      if (isFirst) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      let url = `/api/inspirations?limit=${LIMIT}&category=${encodeURIComponent(category)}`;
      if (cursor) {
        url += `&cursor=${encodeURIComponent(cursor)}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load inspirations feed');
      const data = await res.json();

      setInspirations(prev => isFirst ? data.inspirations : [...prev, ...data.inspirations]);
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // 3. Reload when category changes
  useEffect(() => {
    fetchInspirations(activeCat);
  }, [activeCat, fetchInspirations]);

  // 4. Set up Infinite Scroll Observer
  useEffect(() => {
    if (loading || !hasMore) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loadingMore && nextCursor) {
        fetchInspirations(activeCat, nextCursor);
      }
    }, { threshold: 0.1 });

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [loading, loadingMore, hasMore, nextCursor, activeCat, fetchInspirations]);

  const handleCardClick = useCallback((item) => {
    setSelectedInspiration(item);
  }, []);

  const handleUploadSuccess = useCallback((newItem) => {
    setInspirations(prev => [newItem, ...prev]);
    setUploadOpen(false);
  }, []);

  const handleDeleteSuccess = useCallback((id) => {
    setInspirations(prev => prev.filter(item => item.id !== id));
    setSelectedInspiration(null);
  }, []);

  return (
    <div className="inspirations-container">
      {/* Top Header */}
      <div className="inspirations-header">
        <div>
          <h1 className="inspirations-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={22} style={{ color: 'var(--accent-blue, #0009fa)' }} /> Inspirations
          </h1>
          <p className="inspirations-desc">Visual designs, layouts, and style resources shared by creators.</p>
        </div>

        {currentUserId && (
          <button className="inspiration-share-btn" onClick={() => setUploadOpen(true)}>
            <Plus size={16} /> Share Inspiration
          </button>
        )}
      </div>

      {/* Categories Horizontal Selector */}
      <div className="inspirations-categories">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCat(cat)}
            className={`category-pill ${activeCat === cat ? 'active' : ''}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Masonry Feed */}
      {loading ? (
        <div style={{ display: 'flex', gap: '1.25rem', width: '100%' }}>
          {Array.from({ length: cols }).map((_, colIndex) => (
            <div key={colIndex} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
              {[160, 240, 200, 300].slice(0, 2).map((height, idx) => (
                <div key={idx} className="inspirations-card-wrapper">
                  <div className="inspiration-skeleton" style={{ height: `${height}px` }} />
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : inspirations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 2rem', background: 'var(--card-bg, #ffffff)', border: 'var(--border, 1px solid #e2e8f0)', borderRadius: '16px', maxWidth: '600px', margin: '2rem auto' }}>
          <div style={{ width: '56px', height: '56px', background: 'var(--primary-bg, #f1f5f9)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifycontent: 'center', margin: '0 auto 1.25rem', justifyContent: 'center' }}>
            <Sparkles size={24} style={{ color: 'var(--text-muted, #94a3b8)' }} />
          </div>
          <h3 style={{ fontWeight: 800, fontSize: '1.15rem', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>No designs posted yet</h3>
          <p style={{ color: 'var(--text-dim, #475569)', fontSize: '0.875rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
            Be the first to share an inspiration design mockup in this category!
          </p>
          {currentUserId ? (
            <button className="btn btn-dark" style={{ borderRadius: '20px', fontSize: '0.85rem' }} onClick={() => setUploadOpen(true)}>
              Share First Design
            </button>
          ) : (
            <a href="/login" className="btn btn-dark" style={{ borderRadius: '20px', fontSize: '0.85rem' }}>
              Sign In to Share
            </a>
          )}
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '1.25rem', width: '100%' }}>
            {Array.from({ length: cols }).map((_, colIndex) => (
              <div key={colIndex} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
                {inspirations.filter((_, i) => i % cols === colIndex).map(item => (
                  <InspirationCard
                    key={item.id}
                    inspiration={item}
                    currentUserId={currentUserId}
                    onClick={() => handleCardClick(item)}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Infinite Scroll Sentinel Spinner */}
          {hasMore && (
            <div ref={sentinelRef} style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', marginTop: '1.5rem' }}>
              {loadingMore && <div className="chat-messages__spinner" />}
            </div>
          )}
        </>
      )}

      {/* Upload Overlay Modal */}
      {uploadOpen && (
        <InspirationUploadModal
          onClose={() => setUploadOpen(false)}
          onSuccess={handleUploadSuccess}
        />
      )}

      {/* Detail Overlay Modal */}
      {selectedInspiration && (
        <InspirationDetailModal
          inspiration={selectedInspiration}
          currentUserId={currentUserId}
          onClose={() => setSelectedInspiration(null)}
          onDeleteSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
}