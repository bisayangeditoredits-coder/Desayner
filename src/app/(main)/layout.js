import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
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
      </div>
    </MobileNavProvider>
  );
}
