'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function MainError({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 2rem',
      textAlign: 'center',
    }}>
      <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#111827', marginBottom: '0.5rem' }}>
        Something went wrong
      </h2>
      <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1.5rem', maxWidth: 400 }}>
        This page hit an error. Try again or head back to the feed.
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
