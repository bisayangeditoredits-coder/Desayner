'use client';
import React, { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, Heart, Bookmark, UserPlus, CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import useToastStore from '@/store/useToastStore';
import { saveProjectModalReturn } from '@/lib/projectModalNav';
import './Toast.css';

function getToastIcon(type) {
  switch (type) {
    case 'message':
      return <MessageCircle size={16} />;
    case 'like':
      return <Heart size={16} fill="currentColor" />;
    case 'comment':
      return <MessageCircle size={16} />;
    case 'save':
      return <Bookmark size={16} fill="currentColor" />;
    case 'follow':
      return <UserPlus size={16} />;
    case 'success':
      return <CheckCircle size={16} />;
    case 'error':
      return <AlertCircle size={16} />;
    default:
      return <Info size={16} />;
  }
}

function ToastItem({ toast }) {
  const router = useRouter();
  const removeToast = useToastStore((state) => state.removeToast);
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = useCallback((e) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    setIsExiting(true);
    // Let the slide-out CSS keyframes play before removing from DOM
    setTimeout(() => {
      removeToast(toast.id);
    }, 240);
  }, [removeToast, toast.id]);

  const handleClick = useCallback(() => {
    if (toast.link) {
      if (/^\/projects\/[^/]+$/.test(toast.link)) {
        saveProjectModalReturn();
      }
      router.push(toast.link);
    }
    handleDismiss();
  }, [toast.link, router, handleDismiss]);

  // Coordinate visual exit timing with Zustand removal
  useEffect(() => {
    if (toast.duration > 0) {
      const exitTimer = setTimeout(() => {
        setIsExiting(true);
      }, toast.duration - 240);
      return () => clearTimeout(exitTimer);
    }
  }, [toast.duration]);

  return (
    <div
      className={`toast-item ${isExiting ? 'toast-slide-out' : ''}`}
      onClick={handleClick}
      style={{ cursor: toast.link ? 'pointer' : 'default' }}
    >
      {toast.avatarUrl ? (
        <img
          src={toast.avatarUrl}
          alt=""
          style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
        />
      ) : (
        <div className={`toast-icon-wrap toast-icon-wrap--${toast.type}`}>
          {getToastIcon(toast.type)}
        </div>
      )}

      <div className="toast-content-wrap">
        {toast.title && <span className="toast-title">{toast.title}</span>}
        <span className="toast-message">{toast.message}</span>
      </div>

      <button className="toast-close-btn" onClick={handleDismiss} aria-label="Dismiss notification">
        <X size={14} />
      </button>

      {toast.duration > 0 && (
        <div
          className="toast-progress-bar"
          style={{ animationDuration: `${toast.duration}ms` }}
        />
      )}
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
