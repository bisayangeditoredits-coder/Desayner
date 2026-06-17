'use client';
import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import useSWR from 'swr';
import { ArrowUp, Plus, Trophy, Calendar, Users, ChevronLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import SubmitContestModal from '@/components/SubmitContestModal';

export default function ContestDetailPage() {
  const params = useParams();
  const id = params.id;
  
  const [currentUser, setCurrentUser] = useState(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUser(user);
    });
  }, [supabase]);

  // Lightweight Realtime using SWR polling
  const fetcher = url => fetch(url).then(res => res.json());
  const { data, error: swrError, mutate } = useSWR(`/api/contests/${id}`, fetcher, {
    refreshInterval: 30000, // Poll every 30s to save Vercel limits (CPU & Edge requests)
    revalidateOnFocus: true
  });

  const contest = data?.contest;
  
  // Realtime Ranking: Sort submissions by votes dynamically
  const submissions = useMemo(() => {
    if (!contest?.contest_submissions) return [];
    return [...contest.contest_submissions].sort((a, b) => {
      const votesA = a.contest_votes?.length || 0;
      const votesB = b.contest_votes?.length || 0;
      return votesB - votesA;
    });
  }, [contest?.contest_submissions]);

  const loading = !data && !swrError;
  const error = swrError?.message || data?.error;

  const hasSubmitted = submissions.some(s => s.user_id === currentUser?.id);

  const handleVote = async (submissionId) => {
    if (!currentUser) {
      alert("Please login to vote!");
      return;
    }
    
    if (contest?.status !== 'active' || contest?.is_voting_closed) {
      alert("Voting is currently closed for this contest!");
      return;
    }

    const subIndex = submissions.findIndex(s => s.id === submissionId);
    if (subIndex === -1) return;

    const sub = submissions[subIndex];
    const hasVoted = sub.contest_votes?.some(v => v.user_id === currentUser.id);

    if (hasVoted) {
      return;
    }

    // Optimistic UI Update using SWR mutate
    const updatedSubmissions = submissions.map(s => {
      if (s.id === submissionId) {
        return {
          ...s,
          contest_votes: [...(s.contest_votes || []), { user_id: currentUser.id }]
        };
      }
      return s;
    });

    mutate({ ...data, contest: { ...contest, contest_submissions: updatedSubmissions } }, false);

    try {
      const res = await fetch(`/api/contests/submissions/${submissionId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'vote' })
      });
      if (!res.ok) throw new Error('Vote failed');
      mutate(); // Revalidate to fetch actual server state
    } catch (err) {
      console.error(err);
      mutate(); // Revert optimistic update on failure
    }
  };

  const handleSubmissionAdded = (newSubmission) => {
    // Add user's profile info to the optimistic submission
    const enrichedSubmission = {
      ...newSubmission,
      profiles: {
        full_name: currentUser.user_metadata?.full_name || 'You',
        username: currentUser.user_metadata?.username || 'your_username',
        avatar_url: currentUser.user_metadata?.avatar_url || ''
      },
      contest_votes: []
    };
    
    // Optimistically inject the new submission
    mutate({ ...data, contest: { ...contest, contest_submissions: [enrichedSubmission, ...submissions] } }, false);
  };

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading contest...</div>;
  if (error || !contest) return <div style={{ padding: '4rem', textAlign: 'center', color: '#ef4444' }}>{error || 'Contest not found'}</div>;

  return (
    <div className="page-content" style={{ padding: '0 2rem 4rem', maxWidth: '1200px', margin: '0 auto', width: '100%', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Top Navigation / Breadcrumb */}
      <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
        <Link href="/contests" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600, transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#0f172a'} onMouseOut={e => e.currentTarget.style.color = '#64748b'}>
          <ChevronLeft size={16} /> All Contests
        </Link>
      </div>

      {/* Minimal Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '4rem' }}>
        
        {/* Title and Action Button Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem' }}>
          <div style={{ flex: 1, minWidth: '300px', maxWidth: '800px' }}>
            <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 900, color: '#0f172a', margin: '0 0 1rem 0', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              {contest.title}
            </h1>
            <p style={{ fontSize: '1.125rem', color: '#475569', lineHeight: 1.6, margin: 0, fontWeight: 400 }}>
              {contest.description}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem', minWidth: '200px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: contest.status === 'active' ? '#10b981' : '#64748b', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: contest.status === 'active' ? '#10b981' : '#64748b' }} />
              {contest.status}
            </span>
            
            {contest.status === 'active' && (
              !currentUser ? (
                <Link href="/login" style={{ background: '#0f172a', color: 'white', padding: '1rem 2rem', borderRadius: '100px', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#334155'} onMouseOut={e => e.currentTarget.style.background = '#0f172a'}>
                  Log in to Submit
                </Link>
              ) : hasSubmitted ? (
                <div style={{ color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 0' }}>
                  <CheckCircle2 size={20} /> Entry Submitted
                </div>
              ) : (contest.max_entries && submissions.length >= contest.max_entries) ? (
                <div style={{ color: '#ef4444', fontWeight: 700, padding: '1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Entry Limit Reached
                </div>
              ) : (
                <button 
                  onClick={() => setIsSubmitModalOpen(true)}
                  style={{ background: '#0f172a', color: 'white', border: 'none', padding: '1rem 2rem', borderRadius: '100px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }}
                  onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)'; }}
                  onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.1)'; }}
                >
                  <Plus size={18} /> Submit Design
                </button>
              )
            )}
          </div>
        </div>

        {/* Minimal Meta Data Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem', flexWrap: 'wrap', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', padding: '1.5rem 0', marginTop: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Trophy size={18} color="#94a3b8" />
            <div>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Prize</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>{contest.prize}</div>
            </div>
          </div>
          <div style={{ width: '1px', height: '30px', background: '#f1f5f9' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Calendar size={18} color="#94a3b8" />
            <div>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Deadline</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>{new Date(contest.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
            </div>
          </div>
          <div style={{ width: '1px', height: '30px', background: '#f1f5f9' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Users size={18} color="#94a3b8" />
            <div>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Entries</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>
                {submissions.length} {contest.max_entries ? `/ ${contest.max_entries}` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submissions Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Entries</h2>
      </div>
      
      {submissions.length === 0 ? (
        <div style={{ padding: '6rem 2rem', textAlign: 'center', background: '#fafafa', borderRadius: '24px', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: '#f1f5f9', width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Image src="/favicon.ico" alt="Empty" width={32} height={32} style={{ opacity: 0.2 }} />
          </div>
          <p style={{ margin: 0, fontSize: '1rem', fontWeight: 500 }}>No entries yet. Be the first to submit!</p>
        </div>
      ) : (
        <div className="projects-masonry" style={{ gap: '2rem' }}>
          {submissions.map((sub, index) => {
            const votesCount = sub.contest_votes?.length || 0;
            const hasVoted = currentUser && sub.contest_votes?.some(v => v.user_id === currentUser.id);
            const rank = index + 1;
            // Only show rank badges if the entry actually has votes (to prevent showing 1st place when everyone is at 0)
            const isTop3 = votesCount > 0 && rank <= 3;
            
            return (
              <div key={sub.id} style={{ breakInside: 'avoid', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  
                  {/* Thumbnail */}
                  <div 
                    onClick={() => setSelectedImage(sub.image_url)}
                    style={{ 
                      position: 'relative', width: '100%', aspectRatio: '4/3', backgroundColor: '#f1f5f9', 
                      borderRadius: '8px', overflow: 'hidden', cursor: 'zoom-in' 
                    }}
                  >
                    <Image src={sub.image_url} alt={sub.title} fill style={{ objectFit: 'cover' }} unoptimized={true} />
                    
                    {/* Rank Badge */}
                    {isTop3 && (
                      <div style={{
                        position: 'absolute', top: '1rem', left: '1rem', zIndex: 10,
                        background: rank === 1 ? 'linear-gradient(135deg, #fde047, #f59e0b)' : rank === 2 ? 'linear-gradient(135deg, #f1f5f9, #94a3b8)' : 'linear-gradient(135deg, #fed7aa, #d97706)',
                        color: rank === 1 ? '#78350f' : rank === 2 ? '#0f172a' : '#fffbeb',
                        padding: '0.4rem 0.8rem', borderRadius: '50px', fontWeight: 800, fontSize: '0.75rem',
                        display: 'flex', alignItems: 'center', gap: '0.35rem',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.15)', border: '2px solid rgba(255,255,255,0.4)'
                      }}>
                        {rank === 1 && <Trophy size={14} fill="currentColor" />}
                        {rank === 1 ? 'Top 1' : rank === 2 ? 'Top 2' : 'Top 3'}
                      </div>
                    )}
                    
                    {/* Hover overlay */}
                    <div style={{ position: 'absolute', inset: 0, opacity: 0, transition: 'opacity 0.2s', background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 40%)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '1rem' }}
                      onMouseOver={e => e.currentTarget.style.opacity = 1}
                      onMouseOut={e => e.currentTarget.style.opacity = 0}
                    >
                      <p style={{ margin: 0, color: 'white', fontWeight: 600, fontSize: '0.9rem', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{sub.title}</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={{ padding: '0.75rem 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                      {sub.profiles?.avatar_url && (
                        <img 
                          src={sub.profiles.avatar_url} 
                          alt="User" 
                          width={24} 
                          height={24} 
                          style={{ borderRadius: '50%', objectFit: 'cover' }}
                          onError={(e) => { 
                            e.currentTarget.style.display = 'none'; 
                            if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'block'; 
                          }}
                        />
                      )}
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#cbd5e1', display: sub.profiles?.avatar_url ? 'none' : 'block' }} />
                      <span style={{ fontSize: '0.875rem', color: '#0f172a', fontWeight: 600 }}>
                        {sub.profiles?.full_name || sub.profiles?.username}
                      </span>
                    </div>

                    <button 
                      onClick={(e) => { 
                        e.preventDefault(); 
                        if (contest?.status === 'active' && !contest?.is_voting_closed) handleVote(sub.id); 
                      }}
                      style={{ 
                        border: hasVoted ? '1px solid #10b981' : '1px solid #e2e8f0', 
                        background: hasVoted ? '#ecfdf5' : (contest?.status !== 'active' || contest?.is_voting_closed) ? '#f1f5f9' : 'white', 
                        cursor: (contest?.status !== 'active' || contest?.is_voting_closed) ? 'not-allowed' : hasVoted ? 'default' : 'pointer', 
                        padding: '0.4rem 0.75rem', 
                        borderRadius: '50px',
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.4rem',
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                        opacity: (contest?.status !== 'active' || contest?.is_voting_closed) ? 0.6 : 1
                      }}
                      onMouseOver={e => {
                        if(!hasVoted && contest?.status === 'active' && !contest?.is_voting_closed) {
                          e.currentTarget.style.borderColor = '#cbd5e1';
                          e.currentTarget.style.background = '#f8fafc';
                        }
                      }}
                      onMouseOut={e => {
                        if(!hasVoted && contest?.status === 'active' && !contest?.is_voting_closed) {
                          e.currentTarget.style.borderColor = '#e2e8f0';
                          e.currentTarget.style.background = 'white';
                        }
                      }}
                    >
                      <ArrowUp size={14} color={hasVoted ? "#10b981" : "#64748b"} strokeWidth={3} />
                      <span style={{ fontSize: '0.8rem', color: hasVoted ? '#10b981' : '#475569', fontWeight: 800 }}>
                        {hasVoted ? 'Voted' : 'Vote'}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: hasVoted ? '#10b981' : '#64748b', fontWeight: 600, borderLeft: hasVoted ? '1px solid #a7f3d0' : '1px solid #e2e8f0', paddingLeft: '0.4rem' }}>
                        {votesCount}
                      </span>
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submit Modal */}
      <SubmitContestModal 
        contestId={id} 
        isOpen={isSubmitModalOpen} 
        onClose={() => setIsSubmitModalOpen(false)} 
        onSubmitted={handleSubmissionAdded} 
      />

      {/* Image Viewer Modal */}
      {selectedImage && (
        <div 
          onClick={() => setSelectedImage(null)}
          style={{ 
            position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out',
            padding: '2rem'
          }}
        >
          <img 
            src={selectedImage} 
            alt="Submission Full" 
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }} 
            onClick={(e) => e.stopPropagation()} 
          />
          
          <button 
            onClick={() => setSelectedImage(null)}
            style={{ position: 'absolute', top: '2rem', right: '2rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}
          >
            &times;
          </button>
        </div>
      )}
    </div>
  );
}
