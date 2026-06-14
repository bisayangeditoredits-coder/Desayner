import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MobileBottomNav from '@/components/MobileBottomNav';
import { MobileNavProvider } from '@/components/MobileNavProvider';
import OnboardingGuard from '@/components/OnboardingGuard';
import dynamic from 'next/dynamic';

const OnboardingChecklist = dynamic(() => import('@/components/OnboardingChecklist'));
const RealtimeNotifier = dynamic(() => import('@/components/RealtimeNotifier'));
const ToastContainer = dynamic(() => import('@/components/ToastContainer'));

export default function MainLayout({ children, modal }) {
  return (
    <MobileNavProvider>
      <OnboardingGuard>
        <div className="app-layout">
          <Sidebar />
          <main className="main-content" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Header />
            <OnboardingChecklist />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {children}
            </div>
          </main>
          <MobileBottomNav />
        </div>
        {modal}
        <RealtimeNotifier />
        <ToastContainer />
      </OnboardingGuard>
    </MobileNavProvider>
  );
}
