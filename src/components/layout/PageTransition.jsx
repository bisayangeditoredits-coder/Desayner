'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';

export default function PageTransition({ children }) {
  const pathname = usePathname();
  const controls = useAnimation();

  useEffect(() => {
    // Snap to start position
    controls.set({ opacity: 0, y: 15 });
    
    // Animate to final position
    controls.start({
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
    });
  }, [pathname, controls]);

  return (
    <motion.div 
      animate={controls}
      initial={{ opacity: 0, y: 15 }} // ensures no flash on SSR before hydration
      onAnimationComplete={() => {
        // Remove transform after animation to prevent clipping of fixed/absolute children (like dropdowns)
        controls.set({ y: undefined });
      }}
      style={{ width: '100%', minHeight: '100vh' }}
    >
      {children}
    </motion.div>
  );
}
