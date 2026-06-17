'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, X } from 'lucide-react';

export default function AnnouncementBanner() {
  const [activeContest, setActiveContest] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    async function fetchContest() {
      try {
        const res = await fetch('/api/contests');
        const data = await res.json();
        const active = data.contests?.find(c => c.status === 'active');
        if (active) {
          const dismissed = localStorage.getItem(`dismissed_contest_${active.id}`);
          if (!dismissed) {
            setActiveContest(active);
            setIsVisible(true);
          }
        }
      } catch (err) {
        console.error('Failed to fetch active contest for banner', err);
      }
    }
    fetchContest();
  }, []);

  if (!isVisible || !activeContest) return null;

  const dismiss = () => {
    setIsVisible(false);
    localStorage.setItem(`dismissed_contest_${activeContest.id}`, 'true');
  };

  return (
    <div style={{ 
      background: '#e3ec1e', // Bright yellow brand color
      color: '#0f172a', // Dark text for contrast
      padding: '0.75rem 1.5rem', 
      display: 'flex', 
      flexWrap: 'wrap',
      gap: '1rem',
      alignItems: 'center', 
      justifyContent: 'space-between',
      borderRadius: '12px',
      marginBottom: '1.5rem',
      marginTop: '1.5rem',
      boxShadow: '0 4px 6px -1px rgba(234, 179, 8, 0.2)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ background: 'rgba(0,0,0,0.05)', padding: '0.5rem', borderRadius: '50%', display: 'flex' }}>
          <Trophy size={18} />
        </div>
        <div>
          <span style={{ fontWeight: 800, marginRight: '0.5rem' }}>New Contest:</span>
          <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>{activeContest.title} — Win {activeContest.prize}!</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link 
          href={`/contests/${activeContest.id}`} 
          style={{ 
            background: '#0f172a', // Dark button
            color: 'white', 
            padding: '0.4rem 1rem', 
            borderRadius: '50px', 
            fontSize: '0.85rem', 
            fontWeight: 700, 
            textDecoration: 'none',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          Join Now
        </Link>
        <button onClick={dismiss} style={{ background: 'none', border: 'none', color: '#334155', cursor: 'pointer', padding: 0, display: 'flex' }}>
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
