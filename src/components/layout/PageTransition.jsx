'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

export default function PageTransition({ children }) {
  const pathname = usePathname();
  const containerRef = useRef(null);

  useEffect(() => {
    // Re-trigger the animation without remounting the DOM
    if (containerRef.current) {
      containerRef.current.classList.remove('page-transition-container');
      // Force a reflow
      void containerRef.current.offsetWidth;
      containerRef.current.classList.add('page-transition-container');
    }
  }, [pathname]);

  return (
    <div ref={containerRef} className="page-transition-container">
      {children}
    </div>
  );
}
