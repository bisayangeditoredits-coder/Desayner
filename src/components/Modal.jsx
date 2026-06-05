'use client';
import { useEffect } from 'react';
import { X } from 'lucide-react';
import styles from './Modal.module.css';

/**
 * Reusable modal shell.
 *
 * Props:
 *   title    – string shown in the header
 *   size     – 'sm' | 'md' | 'lg'  (default 'md')
 *   onClose  – called when backdrop or X is clicked
 *   footer   – optional ReactNode rendered in the footer strip
 *   children – the scrollable body content
 */
export default function Modal({ title, size = 'md', onClose, footer, children }) {
  // Close on Escape key
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className={styles.backdrop}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
    >
      <div className={`${styles.modal} ${styles[size]}`}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {children}
        </div>

        {/* Optional footer */}
        {footer && (
          <div className={styles.footer}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
