'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{
        margin: 0,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
        fontFamily: 'system-ui, sans-serif',
        background: '#f8fafc',
      }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', marginBottom: '0.5rem' }}>
          Something went wrong
        </h2>
        <p style={{ color: '#6b7280', fontSize: '0.95rem', marginBottom: '1.5rem', maxWidth: 400 }}>
          A critical error occurred. Please try again.
        </p>
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
      </body>
    </html>
  );
}
