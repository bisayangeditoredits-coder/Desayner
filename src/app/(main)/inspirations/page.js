'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import InspirationCard from '@/components/InspirationCard';
import dynamic from 'next/dynamic';
import useSWRInfinite from 'swr/infinite';
import './Inspirations.css';

const InspirationUploadModal = dynamic(() => import('@/components/InspirationUploadModal'), { ssr: false });
const InspirationDetailModal = dynamic(() => import('@/components/InspirationDetailModal'), { ssr: false });

const CATEGORIES = ['All', 'General', 'Graphic Design', 'Web Design', 'Typography', 'UI/UX', 'Photography', 'Branding', '3D & Illustration'];
const LIMIT = 15;

export default function InspirationsPage() {
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

  // 2. SWR Data Fetching
  const getKey = (pageIndex, previousPageData) => {
    if (previousPageData && !previousPageData.hasMore) return null; // Reached end
    let url = `/api/inspirations?limit=${LIMIT}&category=${encodeURIComponent(activeCat)}`;
    if (pageIndex > 0 && previousPageData?.nextCursor) {
      url += `&cursor=${encodeURIComponent(previousPageData.nextCursor)}`;
    }
    return url;
  };

  const fetcher = url => fetch(url).then(res => res.json());

  const { data, size, setSize, isValidating, mutate, error } = useSWRInfinite(getKey, fetcher, {
    revalidateFirstPage: false,
    persistSize: true, // keeps the previous page size when unmounting/remounting
  });

  const inspirations = data ? data.flatMap(page => page.inspirations) : [];
  const isLoadingInitialData = !data && !error;
  const isLoadingMore = isLoadingInitialData || (size > 0 && data && typeof data[size - 1] === "undefined");
  const isEmpty = data?.[0]?.inspirations?.length === 0;
  const hasMore = data ? data[data.length - 1]?.hasMore : false;

  // 3. Infinite Scroll Observer
  useEffect(() => {
    if (isLoadingInitialData || !hasMore) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isValidating && !isLoadingMore) {
        setSize(size + 1);
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
  }, [isLoadingInitialData, isLoadingMore, isValidating, hasMore, size, setSize]);

  const handleCardClick = useCallback((item) => {
    setSelectedInspiration(item);
  }, []);

  const handleUploadSuccess = useCallback((newItem) => {
    mutate((currentData) => {
      if (!currentData) return currentData;
      const newData = [...currentData];
      newData[0] = { ...newData[0], inspirations: [newItem, ...(newData[0].inspirations || [])] };
      return newData;
    }, false);
    setUploadOpen(false);
  }, [mutate]);

  const handleDeleteSuccess = useCallback((id) => {
    mutate((currentData) => {
      if (!currentData) return currentData;
      return currentData.map(page => ({
        ...page,
        inspirations: (page.inspirations || []).filter(item => item.id !== id)
      }));
    }, false);
    setSelectedInspiration(null);
  }, [mutate]);

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
      {isLoadingInitialData ? (
        <div className="inspirations-masonry">
          {[160, 240, 200, 300, 250, 180, 220, 280].map((height, idx) => (
            <div key={idx} className="inspirations-card-wrapper">
              <div className="inspiration-skeleton" style={{ height: `${height}px` }} />
            </div>
          ))}
        </div>
      ) : isEmpty ? (
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
          <div className="inspirations-masonry">
            {inspirations.map(item => (
              <InspirationCard
                key={item.id}
                inspiration={item}
                currentUserId={currentUserId}
                onClick={() => handleCardClick(item)}
              />
            ))}
          </div>

          {/* Infinite Scroll Sentinel Spinner */}
          {hasMore && (
            <div ref={sentinelRef} style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', marginTop: '1.5rem' }}>
              {isLoadingMore && <div className="chat-messages__spinner" />}
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