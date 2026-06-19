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
import AnnouncementBar from '@/components/layout/AnnouncementBar';

export default function MainLayout({ children, modal }) {
  return (
    <NotificationsProvider>
      <MobileNavProvider>
        <ProfileHydrator />
        <OnboardingGuard>
          <div className="app-layout">
            <Sidebar />
            <main className="main-content" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
              <AnnouncementBar />
              <Header />
              <OnboardingChecklist />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {children}
              </div>
            </main>
            <MobileBottomNav />
          </div>
          {modal}
          <ToastContainer />
        </OnboardingGuard>
      </MobileNavProvider>
    </NotificationsProvider>
  );
}
