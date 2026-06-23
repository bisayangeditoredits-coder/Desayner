'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { consumeProjectModalReturn } from '@/lib/projectModalNav';

export default function ProjectModalWrapper({ children, isStandalone = false }) {
  const router = useRouter();

  const onDismiss = useCallback(() => {
    if (isStandalone) {
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push('/projects');
      }
    } else {
      router.back();
    }
  }, [router, isStandalone]);

  useEffect(() => {
    // Lock HTML scroll to avoid body scroll jump
    const originalOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';

    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      onDismiss();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.documentElement.style.overflow = originalOverflow;
    };
  }, [onDismiss]);

  return (
    <>
      <style>{`
        .modal-overlay {
          padding: 2rem;
        }
        .modal-content {
          width: 95vw;
          max-height: 95vh;
          border-radius: 0px;
        }
        .modal-close-btn {
          top: 1.5rem;
          right: 2rem;
        }
        @media (max-width: 768px) {
          .modal-overlay {
            padding: 0 !important;
          }
          .modal-content {
            width: 100% !important;
            max-height: 100% !important;
            height: 100% !important;
            border-radius: 0 !important;
          }
          .modal-close-btn {
            position: fixed !important;
            top: 0.75rem !important;
            right: 0.75rem !important;
            background: rgba(0,0,0,0.4) !important;
          }
        }
      `}</style>
      <>
        <motion.div
          className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(15, 23, 42, 0.8)', // Deep slate overlay
          backdropFilter: 'blur(8px)',
        }}
        onClick={onDismiss}
      >
        <motion.div
          className="modal-content"
          initial={{ y: 40, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} // smooth expo-out
          style={{
            maxWidth: '1600px', // Like behance/dribbble wide modal
            background: '#ffffff',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
          }}
          onClick={(e) => e.stopPropagation()} // Prevent dismiss when clicking inside
        >
          <div style={{ overflowY: 'auto', flex: 1, position: 'relative' }}>
            {children}
          </div>
        </motion.div>

        <div
          className="modal-close-btn"
          style={{ position: 'fixed', zIndex: 100000, top: '1.5rem', right: '2rem' }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); onDismiss(); }}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white',
              transition: 'background 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)')}
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </div>
      </motion.div>
    </>
  </>
  );
}
