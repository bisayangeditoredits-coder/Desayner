'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function PageTransition({ children }) {
  const pathname = usePathname();
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 450); // Guaranteed removal after animation duration
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div 
      className={`page-transition-container ${isAnimating ? 'anim-fade-slide-in' : ''}`}
      style={{ width: '100%', minHeight: '100vh' }}
    >
      {children}
    </div>
  );
}
