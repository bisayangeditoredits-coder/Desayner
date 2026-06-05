import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MobileBottomNav from '@/components/MobileBottomNav';
import { MobileNavProvider } from '@/components/MobileNavProvider';
import OnboardingGuard from '@/components/OnboardingGuard';

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
      </OnboardingGuard>
    </MobileNavProvider>
  );
}
