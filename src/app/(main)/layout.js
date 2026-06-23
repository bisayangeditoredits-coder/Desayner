import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import { MobileNavProvider } from '@/components/layout/MobileNavProvider';
import OnboardingGuard from '@/components/auth/OnboardingGuard';
import ProfileHydrator from '@/components/auth/ProfileHydrator';
import { NotificationsProvider } from '@/components/misc/NotificationsProvider';
import dynamic from 'next/dynamic';

const OnboardingChecklist = dynamic(() => import('@/components/onboarding/OnboardingChecklist'));
const ToastContainer = dynamic(() => import('@/components/ui/ToastContainer'));
const BackToTop = dynamic(() => import('@/components/layout/BackToTop'));
import AnnouncementBar from '@/components/layout/AnnouncementBar';


import ErrorBoundary from '@/components/ui/ErrorBoundary';
import AppLayoutWrapper from '@/components/layout/AppLayoutWrapper';

export default function MainLayout({ children, modal }) {
  return (
    <NotificationsProvider>
      <MobileNavProvider>
        <ProfileHydrator />
        <OnboardingGuard>
          <AppLayoutWrapper>
            <ErrorBoundary fallback={<div className="sidebar" style={{ padding: '2rem' }}>Sidebar failed to load.</div>}>
              <Sidebar />
            </ErrorBoundary>
            <main className="main-content" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
              <AnnouncementBar />
              <ErrorBoundary fallback={<div style={{ padding: '1rem', borderBottom: '1px solid #e8e8e8' }}>Header failed to load.</div>}>
                <Header />
              </ErrorBoundary>
              <OnboardingChecklist />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <ErrorBoundary>
                  {children}
                </ErrorBoundary>
              </div>
            </main>
            <MobileBottomNav />
          </AppLayoutWrapper>
          {modal}
          <ToastContainer />
          <BackToTop />
        </OnboardingGuard>
      </MobileNavProvider>
    </NotificationsProvider>
  );
}
