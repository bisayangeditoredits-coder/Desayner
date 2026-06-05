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
    
    async function checkOnboarding() {
      // 1. Get current authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (mounted) setChecking(false);
        return; // Guests are allowed to navigate public pages in (main)
      }

      // 2. Query user profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('avatar_url, cover_url')
        .eq('id', user.id)
        .single();

      if (mounted) {
        if (error || !profile || !profile.avatar_url || !profile.cover_url) {
          // If avatar or cover photo is missing, redirect to onboarding page
          router.replace('/onboarding');
        } else {
          setChecking(false);
        }
      }
    }
    
    checkOnboarding();
    
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
