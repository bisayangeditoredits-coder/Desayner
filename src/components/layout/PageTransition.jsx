'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

export default function PageTransition({ children }) {
  const pathname = usePathname();
  const containerRef = useRef(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return; // Let the initial CSS animation handle the first load
    }

    if (containerRef.current) {
      // Cancel ongoing Web Animations to restart
      containerRef.current.getAnimations().forEach(anim => anim.cancel());

      const anim = containerRef.current.animate(
        [
          { opacity: 0, transform: 'translate3d(0, 10px, 0)' },
          { opacity: 1, transform: 'translate3d(0, 0, 0)' }
        ],
        {
          duration: 350,
          easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
          fill: 'both'
        }
      );

      anim.onfinish = () => {
        if (containerRef.current) {
          containerRef.current.style.transform = 'none';
        }
      };
    }
  }, [pathname]);

  return (
    <div ref={containerRef} className="page-transition-container">
      {children}
    </div>
  );
}
