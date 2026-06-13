'use client';
import React, { useState, useRef, useCallback, memo } from 'react';
import { Image as ImageIcon, Send, X } from 'lucide-react';

/**
 * MessageInput
 *
 * Text field + optional image attachment.
 * Images are compressed to WebP < 1MB before upload via existing processImage pipeline.
 * Pressing Enter (without Shift) sends the message.
 */
const MessageInput = memo(function MessageInput({ onSend, onTyping, sending, disabled }) {
  const [body, setBody]               = useState('');
  const [imageFile, setImageFile]     = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading]     = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);
  const previewUrlRef = useRef(null);

  // ── Handle text change ────────────────────────────────────
  function handleChange(e) {
    setBody(e.target.value);
    onTyping?.();
  }

  // ── Handle image pick ─────────────────────────────────────
  async function handleImagePick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (!file.type.startsWith('image/')) {
      setUploadError('Only images are supported.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image must be under 10MB.');
      return;
    }

    setUploadError('');

    // Compress using existing processImage pipeline
    let compressed;
    try {
      const { processImage } = await import('@/lib/processImage');
      const { promise } = processImage(file);
      const { optimizedBlob } = await promise;
      compressed = optimizedBlob;
    } catch (err) {
      console.error('Compression failed, using original file', err);
      compressed = file; // fallback to original if compression fails
    }

    // Revoke previous preview
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const url = URL.createObjectURL(compressed);
    previewUrlRef.current = url;
    setImageFile(compressed);
    setImagePreview(url);
  }

  // ── Remove image ──────────────────────────────────────────
  function removeImage() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setImageFile(null);
    setImagePreview(null);
  }

  // ── Send ──────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const trimmed = body.trim();
    if (!trimmed && !imageFile) return;
    if (sending || uploading) return;

    let imageUrl = null;

    // Upload image if present
    if (imageFile) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('cover', imageFile, 'chat_image.webp');
        formData.append('thumb', imageFile, 'chat_thumb.webp');
        formData.append('folder', 'chat');

        const upRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        if (!upRes.ok) throw new Error('Upload URL failed');
        const { publicUrl } = await upRes.json();

        imageUrl = publicUrl;
      } catch {
        setUploadError('Image upload failed. Try again.');
        setUploading(false);
        return;
      }
      setUploading(false);
      removeImage();
    }

    const success = await onSend({ body: trimmed || null, imageUrl });
    if (success !== null) {
      setBody('');
      setUploadError('');
    }
  }, [body, imageFile, sending, uploading, onSend]);

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const isLoading = sending || uploading;

  return (
    <div className="msg-input-wrap">
      {uploadError && (
        <p className="msg-input__error">{uploadError}</p>
      )}

      {imagePreview && (
        <div className="msg-input__preview">
          <img src={imagePreview} alt="Preview" className="msg-input__preview-img" />
          <button
            type="button"
            onClick={removeImage}
            className="msg-input__preview-remove"
            aria-label="Remove image"
          >
            <X size={12} />
          </button>
        </div>
      )}

      <div className="msg-input">
        {/* Image attach button */}
        <button
          type="button"
          className="msg-input__icon-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isLoading}
          aria-label="Attach image"
        >
          <ImageIcon size={18} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImagePick}
          style={{ display: 'none' }}
        />

        {/* Text area */}
        <textarea
          className="msg-input__textarea"
          value={body}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Write a message…"
          disabled={disabled || isLoading}
          rows={1}
          maxLength={2000}
        />

        {/* Send button */}
        <button
          type="button"
          className={`msg-input__send ${(body.trim() || imageFile) && !isLoading ? 'msg-input__send--active' : ''}`}
          onClick={handleSend}
          disabled={disabled || isLoading || (!body.trim() && !imageFile)}
          aria-label="Send message"
        >
          {isLoading
            ? <span className="msg-input__spinner" />
            : <Send size={16} />
          }
        </button>
      </div>
    </div>
  );
});

export default MessageInput;
