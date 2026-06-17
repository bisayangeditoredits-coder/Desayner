'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock } from 'lucide-react';

export default function ContestsLandingPage() {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/contests')
      .then(res => res.json())
      .then(data => {
        if (data.contests) setContests(data.contests);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const activeContests = contests.filter(c => c.status === 'active' || c.status === 'voting');
  const pastContests = contests.filter(c => c.status === 'completed');

  return (
    <div className="page-content" style={{ padding: '0 2rem 4rem', maxWidth: '1200px', margin: '0 auto', width: '100%', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Super Minimal Header */}
      <div style={{ padding: '5rem 0 4rem', textAlign: 'left', borderBottom: '1px solid #f1f5f9', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1rem 0', letterSpacing: '-0.02em' }}>
          Challenges
        </h1>
        <p style={{ fontSize: '1.125rem', color: '#64748b', margin: 0, maxWidth: '600px', lineHeight: 1.6 }}>
          Weekly design prompts to hone your skills. Create, submit, and see how you stack up against the community.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '4rem 0', color: '#94a3b8' }}>Loading challenges...</div>
      ) : (
        <>
          {/* Active Contests */}
          <div style={{ marginBottom: '5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: '0 0 2rem 0' }}>
              Active
            </h2>
            
            {activeContests.length === 0 ? (
              <div style={{ color: '#94a3b8' }}>No active challenges at the moment.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '2rem' }}>
                {activeContests.map(contest => (
                  <Link href={`/contests/${contest.id}`} key={contest.id} style={{ textDecoration: 'none', display: 'block' }}>
                    <div style={{
                      background: 'white', borderRadius: '12px', padding: '2rem',
                      transition: 'border-color 0.2s', cursor: 'pointer', height: '100%', 
                      display: 'flex', flexDirection: 'column',
                      border: '1px solid #e2e8f0',
                      boxShadow: 'none'
                    }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = '#cbd5e1'; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = '#e2e8f0'; }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                          {contest.status}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#64748b', fontSize: '0.8rem', fontWeight: 500 }}>
                          <Clock size={14} /> Ends soon
                        </div>
                      </div>
                      
                      <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem', lineHeight: 1.3, letterSpacing: '-0.01em' }}>{contest.title}</h3>
                      <p style={{ fontSize: '0.95rem', color: '#64748b', marginBottom: '2rem', flex: 1, lineHeight: 1.5 }}>
                        {contest.description}
                      </p>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Prize</div>
                          <div style={{ fontSize: '0.875rem', color: '#0f172a', fontWeight: 500 }}>{contest.prize}</div>
                        </div>
                        <div style={{ color: '#0f172a', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: '4px' }}>
                          View Details
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Past Contests */}
          {pastContests.length > 0 && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: '0 0 2rem 0' }}>
                Past
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {pastContests.map(contest => (
                  <Link href={`/contests/${contest.id}`} key={contest.id} style={{ textDecoration: 'none' }}>
                    <div style={{
                      background: 'transparent', borderRadius: '12px', padding: '1.5rem',
                      transition: 'background 0.2s', cursor: 'pointer', border: '1px solid #f1f5f9'
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = '#f8fafc'; }}
                    onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.5rem' }}>{contest.title}</h3>
                      <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>View entries</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
