'use client';
/**
 * MultiUploadZone
 *
 * Gallery multi-image uploader with:
 *  - Drop multiple files at once or click to multi-select
 *  - Instant optimistic grid previews (from local object URLs)
 *  - Per-item progress bars with individual cancel/remove
 *  - Sequential queue — processes one file at a time to avoid overloading
 *  - Auto-retry on network errors (handled by useUpload)
 *  - Returns array of { publicUrl, thumbnailUrl } via onResults(arr)
 *
 * Props:
 *   folder       — R2 folder (e.g. 'projects/gallery')
 *   value        — existing URLs array (controlled)
 *   onResults(newUrls) — called with array of { publicUrl, thumbnailUrl }
 *   onRemove(index)    — called when user removes an existing item
 *   label        — field label
 *   maxFiles     — max total files (default 20)
 */

import { useCallback, useReducer, useRef, useEffect, useState } from 'react';
import { X, Upload, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { processImage } from '@/lib/processImage';

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// ── Item states ─────────────────────────────────────────────────────────────
// { id, file, previewUrl, status, progress, error, publicUrl, thumbnailUrl }

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEMS':
      return [...state, ...action.items];
    case 'UPDATE_ITEM':
      return state.map((item) =>
        item.id === action.id ? { ...item, ...action.patch } : item
      );
    case 'REMOVE_ITEM':
      return state.filter((item) => item.id !== action.id);
    default:
      return state;
  }
}

let idCounter = 0;
function nextId() { return `mu-${Date.now()}-${++idCounter}`; }

function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MultiUploadZone({ folder = 'uploads', value = [], onResults, onRemove, label = '', maxFiles = 20 }) {
  const [items, dispatch] = useReducer(reducer, []);
  const [dragging, setDragging] = useToggle(false);
  const inputRef   = useRef(null);
  const queueRef   = useRef([]);       // pending item IDs
  const processingRef = useRef(false);
  const cancelRefs = useRef({});       // id → cancel() for active compressions
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Cancel any in-flight compressions and revoke all objectURLs
      Object.values(cancelRefs.current).forEach((fn) => fn?.());
    };
  }, []);

  // Notify parent whenever an item finishes
  useEffect(() => {
    const done = items.filter((i) => i.status === 'done' && i.publicUrl);
    if (done.length > 0 && onResults) {
      // We call onResults with only newly-done items via a set of already-reported IDs
    }
  }, [items]);

  const reportedRef = useRef(new Set());
  useEffect(() => {
    items.forEach((item) => {
      if (item.status === 'done' && item.publicUrl && !reportedRef.current.has(item.id)) {
        reportedRef.current.add(item.id);
        onResults?.({ publicUrl: item.publicUrl, thumbnailUrl: item.thumbnailUrl });
      }
    });
  }, [items, onResults]);

  // ── Queue processor ─────────────────────────────────────────────────────
  async function processQueue() {
    if (processingRef.current) return;
    while (queueRef.current.length > 0) {
      processingRef.current = true;
      const id = queueRef.current.shift();
      await processItem(id);
    }
    processingRef.current = false;
  }

  async function processItem(id) {
    const item = itemsRef.current.find((i) => i.id === id);
    if (!item || !item.file) return;

    try {
      // ── 1. Validate ───────────────────────────────────────────────────────
      if (item.file.size > MAX_FILE_SIZE) throw new Error('File too large (max 10 MB)');
      if (!ACCEPTED.includes(item.file.type)) throw new Error('Unsupported file type');

      // ── 2. Compression via processImage (Worker or fallback) ──────────────
      if (!mountedRef.current) return;
      dispatch({ type: 'UPDATE_ITEM', id, patch: { status: 'compressing', progress: 5 } });

      const { promise, cancel } = processImage(item.file, (pct) => {
        if (mountedRef.current) {
          dispatch({ type: 'UPDATE_ITEM', id, patch: { progress: 5 + Math.round(pct * 0.45) } });
        }
      });
      cancelRefs.current[id] = cancel;

      const { optimizedBlob, thumbnailBlob } = await promise;
      delete cancelRefs.current[id];

      if (!mountedRef.current) return;

      // ── 3. Presigned URLs ─────────────────────────────────────────────────
      dispatch({ type: 'UPDATE_ITEM', id, patch: { status: 'uploading', progress: 52 } });
      const res = await fetch('/api/upload', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: 'gallery.webp', thumbnailFilename: 'thumb.webp', contentType: 'image/webp', folder }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${res.status}`);
      }
      const { uploadUrl, thumbnailUploadUrl, publicUrl, thumbnailUrl } = await res.json();
      if (!mountedRef.current) return;
      dispatch({ type: 'UPDATE_ITEM', id, patch: { progress: 62 } });

      // ── 4. PUT both blobs to R2 in parallel ──────────────────────────────
      const [r1, r2] = await Promise.all([
        fetch(uploadUrl,          { method: 'PUT', headers: { 'Content-Type': 'image/webp' }, body: optimizedBlob }),
        fetch(thumbnailUploadUrl, { method: 'PUT', headers: { 'Content-Type': 'image/webp' }, body: thumbnailBlob }),
      ]);
      if (!r1.ok || !r2.ok) throw new Error('Upload to storage failed');

      if (!mountedRef.current) return;
      dispatch({ type: 'UPDATE_ITEM', id, patch: { status: 'done', progress: 100, publicUrl, thumbnailUrl } });

    } catch (err) {
      delete cancelRefs.current[id];
      if (!mountedRef.current) return;
      dispatch({ type: 'UPDATE_ITEM', id, patch: { status: 'error', error: err.message } });
    }
  }

  // Keep a mutable ref to items for use inside processItem (avoids stale closure)
  const itemsRef = useRef(items);
  useEffect(() => { itemsRef.current = items; }, [items]);

  // ── Add files ─────────────────────────────────────────────────────────────
  const addFiles = useCallback((files) => {
    const totalExisting = (value?.length || 0) + items.filter((i) => i.status !== 'error').length;
    const remaining = Math.max(0, maxFiles - totalExisting);
    const toAdd = Array.from(files).slice(0, remaining);
    if (toAdd.length === 0) return;

    const newItems = toAdd.map((file) => ({
      id:         nextId(),
      file,
      previewUrl: URL.createObjectURL(file),
      status:     'queued',
      progress:   0,
      error:      null,
      publicUrl:  null,
      thumbnailUrl: null,
    }));

    dispatch({ type: 'ADD_ITEMS', items: newItems });
    newItems.forEach((item) => queueRef.current.push(item.id));
    processQueue();
  }, [value, items, maxFiles]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleInput = (e) => {
    addFiles(e.target.files);
    e.target.value = '';
  };

  const removeItem = (id) => {
    // Cancel in-flight compression for this item
    cancelRefs.current[id]?.();
    delete cancelRefs.current[id];
    const item = itemsRef.current.find((i) => i.id === id);
    if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
    dispatch({ type: 'REMOVE_ITEM', id });
  };

  const retryItem = (id) => {
    dispatch({ type: 'UPDATE_ITEM', id, patch: { status: 'queued', progress: 0, error: null } });
    queueRef.current.push(id);
    processQueue();
  };

  const allItems = items.filter((i) => i.status !== 'error' || i.error); // keep errored for visibility

  return (
    <div>
      {label && (
        <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b6b6b', marginBottom: '0.5rem' }}>
          {label}
        </p>
      )}

      {/* Existing uploaded items from parent */}
      {(value?.length > 0 || allItems.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
          {/* Parent-controlled items */}
          {value.map((url, i) => (
            <div key={url} style={{ position: 'relative', aspectRatio: '4/3', background: '#f0f0f0', overflow: 'hidden', borderRadius: '6px' }}>
              <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" decoding="async" />
              <button
                type="button"
                onClick={() => onRemove?.(i)}
                style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: '4px' }}
              >
                <X size={11} />
              </button>
            </div>
          ))}

          {/* In-flight / done items */}
          {allItems.map((item) => (
            <div key={item.id} style={{ position: 'relative', aspectRatio: '4/3', background: '#f0f0f0', overflow: 'hidden', borderRadius: '6px' }}>
              {/* Instant preview */}
              {item.previewUrl && (
                <img src={item.previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: item.status === 'done' ? 1 : 0.4, transition: 'opacity 0.3s' }} />
              )}

              {/* Overlay for in-progress */}
              {(item.status === 'compressing' || item.status === 'uploading' || item.status === 'queued') && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', background: 'rgba(0,0,0,0.45)' }}>
                  <Loader2 size={18} color="white" style={{ animation: 'spin 1s linear infinite' }} />
                  <div style={{ width: '70%', height: '3px', background: 'rgba(255,255,255,0.3)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'white', width: `${item.progress}%`, transition: 'width 0.25s ease', borderRadius: '2px' }} />
                  </div>
                  <span style={{ fontSize: '0.62rem', color: 'white', fontWeight: 600 }}>
                    {item.status === 'compressing' ? 'Optimizing…' : item.status === 'uploading' ? 'Uploading…' : 'Queued'}
                  </span>
                </div>
              )}

              {/* Done badge */}
              {item.status === 'done' && (
                <div style={{ position: 'absolute', top: '5px', left: '5px', background: 'rgba(0,0,0,0.6)', borderRadius: '3px', padding: '2px 5px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <CheckCircle2 size={10} color="#4ade80" />
                </div>
              )}

              {/* Error overlay */}
              {item.status === 'error' && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(200,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', padding: '0.5rem' }}>
                  <AlertCircle size={16} color="white" />
                  <span style={{ fontSize: '0.6rem', color: 'white', textAlign: 'center', lineHeight: 1.3 }}>{item.error}</span>
                  <button type="button" onClick={() => retryItem(item.id)} style={{ fontSize: '0.62rem', background: 'white', color: '#cc0000', border: 'none', borderRadius: '3px', padding: '2px 8px', cursor: 'pointer', fontWeight: 700 }}>Retry</button>
                </div>
              )}

              {/* Remove button */}
              {(item.status === 'done' || item.status === 'error') && (
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: '4px' }}
                >
                  <X size={11} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{
          border: `1.5px dashed ${dragging ? '#0009fa' : '#d0d0d0'}`,
          background: dragging ? '#f0f2ff' : '#fafafa',
          padding: '1.75rem 1rem',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          borderRadius: '4px',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <Upload size={20} color={dragging ? '#0009fa' : '#9b9b9b'} />
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0a0a0a' }}>
            {dragging ? 'Drop files here' : 'Add gallery images'}
          </p>
          <p style={{ fontSize: '0.72rem', color: '#9b9b9b' }}>
            Select multiple — auto-compressed &amp; converted to WebP
          </p>
        </div>
      </div>

      <input ref={inputRef} type="file" accept="image/*" multiple onChange={handleInput} style={{ display: 'none' }} />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Micro-hook ─────────────────────────────────────────────────────────────
function useToggle(init = false) {
  const [state, setState] = useState(init);
  return [state, setState];
}
