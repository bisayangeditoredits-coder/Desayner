import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function MainLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Header />
        {children}
      </main>
    </div>
  );
}
