'use client';

import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

export default function PageTransition({ children }) {
  const pathname = usePathname();

  return (
    <motion.div 
      key={pathname}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="page-transition-container"
      style={{ width: '100%', minHeight: '100vh' }}
    >
      {children}
    </motion.div>
  );
}
