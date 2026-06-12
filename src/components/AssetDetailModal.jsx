'use client';
import React, { useState, useCallback } from 'react';
import { X, Download, Bookmark, Trash2, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import UserAvatar from './UserAvatar';

export default function AssetDetailModal({ asset, currentUserId, onClose, onDeleteSuccess }) {
  const [saved, setSaved]           = useState(asset.user_saved || false);
  const [savesCount, setSavesCount] = useState(asset.saves_count || 0);
  const [downloadsCount, setDownloadsCount] = useState(asset.downloads_count || 0);
  const [deleting, setDeleting]     = useState(false);
  const [downloading, setDownloading] = useState(false);

  const supabase = useMemo(() => createClient(), []);
  const creator  = asset.profiles;
  const isOwner  = currentUserId === asset.user_id;

  const handleSave = useCallback(async (e) => {
    e.preventDefault();
    if (!currentUserId) {
      window.location.href = '/login?redirectTo=' + encodeURIComponent(window.location.pathname);
      return;
    }

    const wasSaved = saved;
    setSaved(!wasSaved);
    setSavesCount((prev) => (wasSaved ? prev - 1 : prev + 1));

    if (wasSaved) {
      await supabase
        .from('asset_saves')
        .delete()
        .eq('user_id', currentUserId)
        .eq('asset_id', asset.id);
    } else {
      await supabase
        .from('asset_saves')
        .insert({
          user_id: currentUserId,
          asset_id: asset.id,
        });
    }
  }, [saved, currentUserId, asset.id, supabase]);

  const handleDownload = useCallback(async () => {
    if (downloading) return;
    setDownloading(true);

    try {
      // 1. Securely increment download metrics on backend edge serverless
      const res = await fetch('/api/assets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId: asset.id }),
      });

      if (res.ok) {
        const data = await res.json();
        setDownloadsCount(data.downloads_count);
      }
    } catch (err) {
      console.error('Failed to log download:', err);
    } finally {
      setDownloading(false);
      // 2. Redirect download destination
      if (asset.link) {
        window.open(asset.link, '_blank');
      }
    }
  }, [asset.id, asset.link, downloading]);

  const handleDelete = useCallback(async () => {
    if (!window.confirm('Are you sure you want to delete this asset?')) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('assets')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', asset.id);

      if (error) throw error;
      onDeleteSuccess(asset.id);
    } catch (err) {
      console.error(err);
      alert('Failed to delete asset');
    } finally {
      setDeleting(false);
    }
  }, [asset.id, supabase, onDeleteSuccess]);

  return (
    <div className="inspiration-modal-overlay" onClick={onClose}>
      <div className="inspiration-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
        <div className="asset-modal-body">
          {/* Left Panel: Stretched Cover mockup preview */}
          <div className="asset-modal-preview-panel">
            {asset.preview_url || asset.thumbnail_url ? (
              <img
                src={asset.preview_url || asset.thumbnail_url}
                alt={asset.title || 'Asset'}
                className="asset-modal-preview-img"
              />
            ) : (
              <div style={{ fontSize: '3rem' }}>📦</div>
            )}
          </div>

          {/* Right Panel: Context Details */}
          <div className="asset-modal-info-panel">
            <div>
              {/* Creator details header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <UserAvatar
                    src={creator?.avatar_url}
                    name={creator?.full_name || creator?.username}
                    size={36}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 800 }}>
                      {creator?.full_name || creator?.username || 'Creator'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>
                      @{creator?.username || 'creator'}
                    </span>
                  </div>
                </div>
                <button className="toast-close-btn" onClick={onClose} aria-label="Close modal">
                  <X size={16} />
                </button>
              </div>

              {/* Title & Description */}
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
                {asset.title}
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-dim, #475569)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                {asset.description}
              </p>

              {/* Spec details grid */}
              <div className="asset-detail-specs">
                <div className="asset-spec-item">
                  <span className="asset-spec-label">Format / Platform</span>
                  <span className="asset-spec-value">{asset.category}</span>
                </div>
                <div className="asset-spec-item">
                  <span className="asset-spec-label">Pricing</span>
                  <span className="asset-spec-value">{asset.price}</span>
                </div>
                <div className="asset-spec-item">
                  <span className="asset-spec-label">Downloads</span>
                  <span className="asset-spec-value">{downloadsCount}</span>
                </div>
                <div className="asset-spec-item">
                  <span className="asset-spec-label">Bookmarks</span>
                  <span className="asset-spec-value">{savesCount}</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions Toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderTop: 'var(--border, 1px solid #e2e8f0)', paddingTop: '1.5rem' }}>
              <button
                onClick={handleDownload}
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: 'center', borderRadius: '8px', padding: '0.7rem', gap: '0.5rem' }}
              >
                <Download size={16} />
                <span>Get Template / Download</span>
                <ExternalLink size={12} style={{ opacity: 0.8 }} />
              </button>

              <button
                onClick={handleSave}
                className="btn btn-outline"
                style={{ borderRadius: '8px', padding: '0.7rem' }}
                title={saved ? 'Unsave' : 'Save'}
              >
                <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} className={saved ? 'asset-save-btn--active' : ''} />
              </button>

              {isOwner && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="btn btn-danger"
                  style={{ borderRadius: '8px', padding: '0.7rem', background: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444' }}
                  title="Delete asset"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
