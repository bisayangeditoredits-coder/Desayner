import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MobileBottomNav from '@/components/MobileBottomNav';
import { MobileNavProvider } from '@/components/MobileNavProvider';
import OnboardingGuard from '@/components/OnboardingGuard';
import ProfileHydrator from '@/components/ProfileHydrator';
import { NotificationsProvider } from '@/components/NotificationsProvider';
import dynamic from 'next/dynamic';

const OnboardingChecklist = dynamic(() => import('@/components/OnboardingChecklist'));
const ToastContainer = dynamic(() => import('@/components/ToastContainer'));
import AnnouncementBar from '@/components/AnnouncementBar';

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
