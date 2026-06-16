import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '70vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      textAlign: 'center',
      fontFamily: 'var(--font-montserrat), sans-serif',
    }}>
      <p style={{
        fontSize: '4rem',
        fontWeight: 900,
        color: '#2d43e8',
        margin: '0 0 0.5rem',
        lineHeight: 1,
      }}>
        404
      </p>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', marginBottom: '0.5rem' }}>
        Page not found
      </h1>
      <p style={{ color: '#6b7280', fontSize: '0.95rem', marginBottom: '1.5rem', maxWidth: 400 }}>
        The page you are looking for does not exist or may have been moved.
      </p>
      <Link
        href="/"
        style={{
          background: '#2d43e8',
          color: 'white',
          borderRadius: 8,
          padding: '0.65rem 1.25rem',
          fontWeight: 700,
          fontSize: '0.875rem',
          textDecoration: 'none',
        }}
      >
        Back to home
      </Link>
    </div>
  );
}
