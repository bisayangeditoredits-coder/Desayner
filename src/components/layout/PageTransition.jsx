'use client';

import { usePathname, useSearchParams } from 'next/navigation';

export default function PageTransition({ children }) {
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