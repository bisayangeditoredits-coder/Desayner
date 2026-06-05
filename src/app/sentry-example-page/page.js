'use client';

export default function SentryExamplePage() {
  return (
    <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>Sentry Test Page</h1>
      <p>Click the button below to throw a test error. This will be caught by Sentry.</p>
      <button
        onClick={() => {
          const Sentry = require('@sentry/nextjs');
          Sentry.captureException(new Error('Sentry Test Error from Creldesk Studio!'));
          alert('Test error sent to Sentry!');
        }}
        style={{
          padding: '10px 20px',
          background: '#e02424',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontWeight: 'bold',
          marginTop: '20px'
        }}
      >
        Throw Test Error
      </button>
    </div>
  );
}
