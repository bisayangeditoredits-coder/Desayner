'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShoppingBag, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import AssetCard from '@/components/AssetCard';
import AssetUploadModal from '@/components/AssetUploadModal';
import AssetDetailModal from '@/components/AssetDetailModal';
import './AssetStore.css';

const CATEGORIES = ['All', 'Figma', 'Framer', 'Webflow', 'UI Kit', 'Icon Pack', 'Font', 'Mockup', 'Other'];
const LIMIT = 12;

export default function AssetStorePage() {
  const [assets, setAssets]         = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore]       = useState(true);
  const [loading, setLoading]       = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeCat, setActiveCat]   = useState('All');
  const [currentUserId, setCurrentUserId] = useState(null);

  // Modals
  const [uploadOpen, setUploadOpen]     = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  const supabase    = createClient();
  const sentinelRef = useRef(null);

  // 1. Identify logged-in user details
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, [supabase]);

  // 2. Fetch Assets
  const fetchAssets = useCallback(async (category, cursor = null) => {
    try {
      const isFirst = !cursor;
      if (isFirst) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      let url = `/api/assets?limit=${LIMIT}&category=${encodeURIComponent(category)}`;
      if (cursor) {
        url += `&cursor=${encodeURIComponent(cursor)}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load assets feed');
      const data = await res.json();

      setAssets(prev => isFirst ? data.assets : [...prev, ...data.assets]);
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // 3. Trigger reload on category change
  useEffect(() => {
    fetchAssets(activeCat);
  }, [activeCat, fetchAssets]);

  // 4. Infinite Scroll Observer
  useEffect(() => {
    if (loading || !hasMore) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loadingMore && nextCursor) {
        fetchAssets(activeCat, nextCursor);
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
  }, [loading, loadingMore, hasMore, nextCursor, activeCat, fetchAssets]);

  const handleCardClick = useCallback((item) => {
    setSelectedAsset(item);
  }, []);

  const handleUploadSuccess = useCallback((newItem) => {
    setAssets(prev => [newItem, ...prev]);
    setUploadOpen(false);
  }, []);

  const handleDeleteSuccess = useCallback((id) => {
    setAssets(prev => prev.filter(item => item.id !== id));
    setSelectedAsset(null);
  }, []);

  return (
    <div className="assets-container">
      {/* Header */}
      <div className="assets-header">
        <div>
          <h1 className="assets-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingBag size={22} style={{ color: 'var(--accent-blue, #0009fa)' }} /> Asset Store
          </h1>
          <p className="assets-desc">Premium templates, UI Kits, assets, and source files shared by creators.</p>
        </div>

        {currentUserId && (
          <button className="inspiration-share-btn" onClick={() => setUploadOpen(true)}>
            <Plus size={16} /> Publish Asset
          </button>
        )}
      </div>

      {/* Category Horizontal Filter Selector */}
      <div className="assets-categories">
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

      {/* Grid Display */}
      {loading ? (
        <div className="assets-grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="asset-card" style={{ cursor: 'default' }}>
              <div className="asset-image-panel">
                <div className="inspiration-skeleton" style={{ height: '100%' }} />
              </div>
              <div className="asset-info">
                <div style={{ height: '12px', width: '60px', background: '#f1f5f9', borderRadius: '4px', marginBottom: '8px' }} />
                <div style={{ height: '18px', width: '80%', background: '#e2e8f0', borderRadius: '4px', marginBottom: '8px' }} />
                <div style={{ height: '14px', width: '95%', background: '#f1f5f9', borderRadius: '4px', marginBottom: '16px' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#e2e8f0' }} />
                    <div style={{ height: '10px', width: '50px', background: '#e2e8f0', borderRadius: '4px' }} />
                  </div>
                  <div style={{ width: '30px', height: '12px', background: '#e2e8f0', borderRadius: '4px' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : assets.length === 0 ? (
        <div className="assets-empty-state">
          <div style={{ width: '56px', height: '56px', background: 'var(--primary-bg, #f1f5f9)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifycontent: 'center', margin: '0 auto 1.25rem', justifyContent: 'center' }}>
            <ShoppingBag size={24} style={{ color: 'var(--text-muted, #94a3b8)' }} />
          </div>
          <h3 style={{ fontWeight: 800, fontSize: '1.15rem', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>No templates listed</h3>
          <p style={{ color: 'var(--text-dim, #475569)', fontSize: '0.875rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
            Be the first to list a Figma/Framer template or visual resource in this category!
          </p>
          {currentUserId ? (
            <button className="btn btn-dark" style={{ borderRadius: '20px', fontSize: '0.85rem' }} onClick={() => setUploadOpen(true)}>
              Publish First Asset
            </button>
          ) : (
            <a href="/login" className="btn btn-dark" style={{ borderRadius: '20px', fontSize: '0.85rem' }}>
              Sign In to Publish
            </a>
          )}
        </div>
      ) : (
        <>
          <div className="assets-grid">
            {assets.map(item => (
              <AssetCard
                key={item.id}
                asset={item}
                currentUserId={currentUserId}
                onClick={() => handleCardClick(item)}
              />
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

      {/* Upload Modal Overlay */}
      {uploadOpen && (
        <AssetUploadModal
          onClose={() => setUploadOpen(false)}
          onSuccess={handleUploadSuccess}
        />
      )}

      {/* Detail Modal Overlay */}
      {selectedAsset && (
        <AssetDetailModal
          asset={selectedAsset}
          currentUserId={currentUserId}
          onClose={() => setSelectedAsset(null)}
          onDeleteSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
}