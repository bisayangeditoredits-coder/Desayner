import '../../../App.css';
import Link from 'next/link';

export default function MockupsComingSoonPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: '2rem' }}>
      <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1rem', color: '#231f20' }}>🚀 Coming Soon</h1>
      <p style={{ fontSize: '1.1rem', color: '#6b7280', maxWidth: '500px', marginBottom: '2rem', lineHeight: '1.6' }}>
        We are working hard to build a high-quality Free Mockups library for you. Stay tuned for amazing new assets coming to Desayner very soon!
      </p>
      <Link href="/" style={{ padding: '0.75rem 1.5rem', background: '#231f20', color: 'white', fontWeight: 700, borderRadius: '8px', textDecoration: 'none' }}>
        Return to Home
      </Link>
    </div>
  );
}