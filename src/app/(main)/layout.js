import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MobileBottomNav from '@/components/MobileBottomNav';
import { MobileNavProvider } from '@/components/MobileNavProvider';
import OnboardingGuard from '@/components/OnboardingGuard';
import RealtimeNotifier from '@/components/RealtimeNotifier';
import ToastContainer from '@/components/ToastContainer';

export default function MainLayout({ children, modal }) {
  return (
    <MobileNavProvider>
      <OnboardingGuard>
        <div className="app-layout">
          <Sidebar />
          <main className="main-content" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Header />
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
