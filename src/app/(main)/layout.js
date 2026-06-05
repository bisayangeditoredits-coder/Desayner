import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MobileBottomNav from '@/components/MobileBottomNav';
import { MobileNavProvider } from '@/components/MobileNavProvider';

export default function MainLayout({ children }) {
  return (
    <MobileNavProvider>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Header />
          {children}
        </main>
        <MobileBottomNav />
      </div>
    </MobileNavProvider>
  );
}
