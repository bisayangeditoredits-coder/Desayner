'use client';
import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bookmark, Download } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import UserAvatar from './UserAvatar';
import ProgressiveImage from './ProgressiveImage';
import dynamic from 'next/dynamic';
const SaveToCollectionModal = dynamic(() => import('./SaveToCollectionModal'), { ssr: false });

function getTagClassName(category) {
  const norm = (category || '').toLowerCase().replace(/\s+/g, '-');
  return `asset-tag asset-tag--${norm}`;
}

export default function AssetCard({ asset, currentUserId, onClick }) {
  const [saved, setSaved]         = useState(asset.user_saved || false);
  const [savesCount, setSavesCount] = useState(asset.saves_count || 0);
  const [showColModal, setShowColModal] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const router   = useRouter();

  const handleSave = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUserId) {
      router.push('/login?redirectTo=' + encodeURIComponent(window.location.pathname));
      return;
    }
    
    setShowColModal(true);
  }, [currentUserId, router]);

  const author = asset.profiles;
  const isFree = (asset.price || '').toLowerCase() === 'free' || asset.price === '0';

  return (
    <div className="asset-card" onClick={onClick}>
      {/* Visual Preview */}
      <div className="asset-image-panel">
        {asset.thumbnail_url ? (
          <ProgressiveImage
            src={asset.thumbnail_url}
            alt={asset.title}
            className="asset-img"
            aspectRatio="16/9"
            imgStyle={{ objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--secondary-bg, #e2e8f0)', color: 'var(--text-muted, #94a3b8)' }}>
            📦
          </div>
        )}
      </div>

      {/* Info details */}
      <div className="asset-info">
        <div className="asset-meta-row">
          <span className={getTagClassName(asset.category)}>
            {asset.category}
          </span>
          <span className={`asset-price-badge ${isFree ? 'asset-price-badge--free' : 'asset-price-badge--paid'}`}>
            {asset.price}
          </span>
        </div>

        <h3 className="asset-title-text">{asset.title}</h3>
        <p className="asset-desc-text">{asset.description}</p>

        {/* Footer */}
        <div className="asset-footer-row">
          <div className="asset-author-wrap">
            <UserAvatar
              src={author?.avatar_url}
              name={author?.full_name || author?.username}
              size={20}
            />
            <span className="asset-author-name">
              {author?.full_name || author?.username || 'Creator'}
            </span>
          </div>

          <div className="asset-stats-wrap">
            <div className="asset-stat-item" title="Downloads">
              <Download size={13} />
              <span>{asset.downloads_count || 0}</span>
            </div>

            <button
              onClick={handleSave}
              className={`asset-save-btn ${saved ? 'asset-save-btn--active' : ''}`}
              title={saved ? 'Unsave' : 'Save'}
              aria-label={saved ? 'Unsave' : 'Save'}
            >
              <Bookmark size={15} fill={saved ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
      </div>
      
      {showColModal && (
        <SaveToCollectionModal
          itemType="resource"
          itemId={asset.id}
          onClose={() => setShowColModal(false)}
        />
      )}
    </div>
  );
}
