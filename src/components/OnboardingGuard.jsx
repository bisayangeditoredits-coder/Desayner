'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import OnboardingModal from '@/components/OnboardingModal';
import OnboardingGuideModal from '@/components/OnboardingGuideModal';

export default function OnboardingGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const [checking, setChecking] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let mounted = true;
    
    async function checkSession() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (mounted) setChecking(false);
        return; 
      }
      if (mounted) setUser(user);

      // Check if profile exists and is complete (avatar, username, bio, tools required)
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url, username, bio, tools')
        .eq('id', user.id)
        .single();

      if (!profile || !profile.avatar_url || !profile.username || !profile.bio || !profile.tools || profile.tools.length === 0) {
        if (mounted) {
          setNeedsOnboarding(true);
        }
      }

      if (mounted) {
        setChecking(false);
      }
    }
    
    checkSession();
    
    return () => {
      mounted = false;
    };
  }, [pathname, supabase]);

  if (checking) return null;

  return (
    <>
      <div style={{ 
        filter: needsOnboarding ? 'blur(10px) brightness(0.9)' : 'none', 
        transition: 'filter 0.4s ease-out',
        pointerEvents: needsOnboarding ? 'none' : 'auto',
        userSelect: needsOnboarding ? 'none' : 'auto',
        height: needsOnboarding ? '100vh' : 'auto',
        overflow: needsOnboarding ? 'hidden' : 'auto'
      }}>
        {children}
      </div>

      {needsOnboarding && (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          zIndex: 99999, 
          background: 'rgba(15, 23, 42, 0.8)', 
          backdropFilter: 'blur(8px)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '1rem',
          animation: 'fadeIn 0.4s ease-out'
        }}>
          <OnboardingModal user={user} onComplete={() => {
            setNeedsOnboarding(false);
            setShowGuide(true);
          }} />
        </div>
      )}

      {/* Render the Guide Modal after profile completion */}
      <OnboardingGuideModal 
        open={showGuide} 
        onOpenChange={setShowGuide} 
      />
    </>
  );
}
