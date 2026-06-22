'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function PageTransition({ children }) {
  const pathname = usePathname();
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    setIsAnimating(true);
  }, [pathname]);

  return (
    <div 
      key={pathname}
      className={`page-transition-container ${isAnimating ? 'anim-fade-slide-in' : ''}`}
      style={{ width: '100%', minHeight: '100vh' }}
      onAnimationEnd={() => setIsAnimating(false)}
    >
      {children}
    </div>
  );
}
