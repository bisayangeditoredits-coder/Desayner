import React from 'react';

export default function TagPill({ label, active, onClick, small }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: small ? '0.25rem 0.6rem' : '0.35rem 0.8rem',
        border: '1px solid',
        borderColor: active ? '#0a0a0a' : '#e8e8e8',
        background: active ? '#0a0a0a' : 'white',
        color: active ? 'white' : '#6b6b6b',
        fontSize: small ? '0.72rem' : '0.78rem',
        fontWeight: 600,
        borderRadius: '20px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        fontFamily: 'var(--font-grotesk, inherit)',
        letterSpacing: '0.02em',
      }}
    >
      {label}
    </button>
  );
}
