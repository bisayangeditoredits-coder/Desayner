'use client';
import useLayoutStore from '@/store/useLayoutStore';
import { useEffect, useState } from 'react';

export default function AppLayoutWrapper({ children }) {
  const { isSidebarCollapsed } = useLayoutStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR and first hydration, use the store's initial state (false).
  // Once mounted, it will use the persisted state. This prevents hydration errors.
  const collapsedState = mounted ? isSidebarCollapsed : false;

  return (
    <div className="app-layout" data-collapsed={collapsedState ? "true" : undefined}>
      {children}
    </div>
  );
}
