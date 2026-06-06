import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MobileBottomNav from '@/components/MobileBottomNav';
import { MobileNavProvider } from '@/components/MobileNavProvider';
import OnboardingGuard from '@/components/OnboardingGuard';
import RealtimeNotifier from '@/components/RealtimeNotifier';
import ToastContainer from '@/components/ToastContainer';

export default function MainLayout({ children }) {
  return (
    <MobileNavProvider>
      <OnboardingGuard>
        <div className="app-layout">
          <Sidebar />
          <main className="main-content">
            <Header />
            {children}
          </main>
          <MobileBottomNav />
        </div>
        <RealtimeNotifier />
        <ToastContainer />
      </OnboardingGuard>
    </MobileNavProvider>
  );
}
