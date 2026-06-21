'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

/**
 * PageTransition — wraps page content with a subtle fade-in animation
 * on every route change, giving the app a polished, fluid feel.
 */
export default function PageTransition({ children }) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionState, setTransitionState] = useState('visible'); // 'visible' | 'fading'
  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    if (pathname === prevPathnameRef.current) return;
    prevPathnameRef.current = pathname;

    // Start fade-in for new content
    setTransitionState('fading');
    setDisplayChildren(children);

    const t = setTimeout(() => {
      setTransitionState('visible');
    }, 20); // tiny tick so browser registers class change

    return () => clearTimeout(t);
  }, [pathname, children]);

  return (
    <div
      style={{
        opacity: transitionState === 'fading' ? 0 : 1,
        transform: transitionState === 'fading' ? 'translateY(6px)' : 'translateY(0)',
        transition: 'opacity 0.22s ease, transform 0.22s ease',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {displayChildren}
    </div>
  );
}
