'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function PageTransitionInner({ children }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const transitionKey = `${pathname}?${searchParams.toString()}`;

  return (
    <div
      key={transitionKey}
      className="page-transition-container anim-fade-slide-in"
      style={{ width: '100%', minHeight: '100vh' }}
    >
      {children}
    </div>
  );
}

export default function PageTransition({ children }) {
  return (
    <Suspense fallback={<div className="page-transition-container" style={{ width: '100%', minHeight: '100vh' }}>{children}</div>}>
      <PageTransitionInner>{children}</PageTransitionInner>
    </Suspense>
  );
}