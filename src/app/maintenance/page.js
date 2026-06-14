'use client';
import { Settings, PenTool } from 'lucide-react';

export default function MaintenancePage() {
  return (
    <div style={{
      textAlign: 'center',
      background: 'white',
      padding: '4rem 3rem',
      borderRadius: '24px',
      boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
      maxWidth: '500px',
      width: '90%',
      margin: '0 auto',
      border: '1px solid rgba(226, 232, 240, 0.8)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
        <div style={{
          width: '80px',
          height: '80px',
          background: '#231f20',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'pulse 2s infinite cubic-bezier(0.4, 0, 0.6, 1)'
        }}>
          <PenTool size={40} color="white" />
        </div>
      </div>
      
      <h1 style={{
        fontSize: '2rem',
        fontWeight: 900,
        color: '#231f20',
        marginBottom: '1rem',
        letterSpacing: '-0.03em'
      }}>
        Under Maintenance
      </h1>
      
      <p style={{
        fontSize: '1rem',
        color: '#6b7280',
        lineHeight: 1.6,
        marginBottom: '2rem'
      }}>
        Desayner is currently undergoing scheduled upgrades to bring you an even better experience. We'll be back online shortly!
      </p>

      <div style={{
        background: '#f8fafc',
        padding: '1rem',
        borderRadius: '12px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        color: '#475569',
        fontSize: '0.85rem',
        fontWeight: 600
      }}>
        <Settings size={16} className="spin-slow" /> Hang tight, we are working on it.
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(0.95); opacity: 0.9; }
        }
        .spin-slow {
          animation: spin 3s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
