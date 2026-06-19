'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import useProfileStore from '@/store/useProfileStore';

const OnboardingModal = dynamic(() => import('@/components/onboarding/OnboardingModal'), { ssr: false });
const OnboardingGuideModal = dynamic(() => import('@/components/onboarding/OnboardingGuideModal'), { ssr: false });

export default function OnboardingGuard({ children }) {
  const user = useProfileStore((s) => s.user);
  const needsOnboarding = useProfileStore((s) => s.needsOnboarding);
  const loading = useProfileStore((s) => s.loading);
  const invalidate = useProfileStore((s) => s.invalidate);
  const [showGuide, setShowGuide] = useState(false);

  if (loading) {
    return <>{children}</>;
  }

  return (
    <>
      <div style={{
        filter: needsOnboarding ? 'blur(10px) brightness(0.9)' : 'none',
        transition: 'filter 0.4s ease-out',
        pointerEvents: needsOnboarding ? 'none' : 'auto',
        userSelect: needsOnboarding ? 'none' : 'auto',
        height: needsOnboarding ? '100vh' : 'auto',
        overflow: needsOnboarding ? 'hidden' : 'auto',
      }}>
        {children}
      </div>

      {needsOnboarding && user && (
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
          animation: 'fadeIn 0.4s ease-out',
        }}>
          <OnboardingModal
            user={user}
            onComplete={() => {
              useProfileStore.setState({ needsOnboarding: false });
              invalidate();
              setShowGuide(true);
            }}
          />
        </div>
      )}

      <OnboardingGuideModal
        open={showGuide}
        onOpenChange={setShowGuide}
      />
    </>
  );
}
