'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DesignHubRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/design-hub/stock-photos');
  }, [router]);
  return null;
}
