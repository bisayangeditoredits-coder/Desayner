'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function OnboardingGuard({ children }) {
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;
    
    async function checkSession() {
      // Just check auth briefly without enforcing profile completeness
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (mounted) setChecking(false);
        return; 
      }

      // Check if profile exists, but we don't force them to /onboarding anymore
      if (mounted) {
        setChecking(false);
      }
    }
    
    checkSession();
    
    return () => {
      mounted = false;
    };
  }, [pathname, router, supabase]);

  if (checking) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: '#f1f5f9',
        fontFamily: 'var(--font-body)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div className="shimmer-box" style={{ width: '48px', height: '48px', borderRadius: '50%' }} />
          <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Securing session...</p>
        </div>
      </div>
    );
  }

  return children;
}
