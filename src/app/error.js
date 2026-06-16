'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      textAlign: 'center',
      fontFamily: 'var(--font-montserrat), sans-serif',
    }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', marginBottom: '0.5rem' }}>
        Something went wrong
      </h2>
      <p style={{ color: '#6b7280', fontSize: '0.95rem', marginBottom: '1.5rem', maxWidth: 400 }}>
        An unexpected error occurred. You can try again or return to the home page.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => reset()}
          style={{
            background: '#2d43e8',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            padding: '0.65rem 1.25rem',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
        <Link
          href="/"
          style={{
            background: 'white',
            color: '#374151',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            padding: '0.65rem 1.25rem',
            fontWeight: 700,
            fontSize: '0.875rem',
            textDecoration: 'none',
          }}
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
