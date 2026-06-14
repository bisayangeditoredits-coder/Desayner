export const metadata = {
  title: 'Under Maintenance - Desayner',
  description: 'Desayner is currently under maintenance.',
};

export default function MaintenanceLayout({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f6f7f8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </div>
  );
}
