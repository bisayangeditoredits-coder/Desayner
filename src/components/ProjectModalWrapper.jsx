'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProjectModalWrapper({ children }) {
  const router = useRouter();

  const onDismiss = useCallback(() => {
    router.back();
  }, [router]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onDismiss();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onDismiss]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(15, 23, 42, 0.8)', // Deep slate overlay
          backdropFilter: 'blur(8px)',
          overflowY: 'auto',
          padding: '2rem'
        }}
        onClick={onDismiss}
      >
        <div style={{ position: 'absolute', top: '1.5rem', right: '2rem' }}>
          <button
            onClick={onDismiss}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
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
            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
          >
            <X size={24} />
          </button>
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, type: 'spring', bounce: 0.2 }}
          style={{
            width: '95vw',
            maxWidth: '1600px', // Like behance/dribbble wide modal
            background: '#ffffff',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxHeight: '95vh',
            display: 'flex',
            flexDirection: 'column',
          }}
          onClick={(e) => e.stopPropagation()} // Prevent dismiss when clicking inside
        >
          <div style={{ overflowY: 'auto', flex: 1, position: 'relative' }}>
            {children}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
