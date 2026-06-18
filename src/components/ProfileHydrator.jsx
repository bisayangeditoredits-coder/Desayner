'use client';

import { useEffect } from 'react';
import useProfileStore from '@/store/useProfileStore';

export default function ProfileHydrator() {
  const hydrate = useProfileStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return null;
}
