'use client';
import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import TrendingProjectCard from '@/components/TrendingProjectCard';
import ReactionBar from '@/components/ReactionBar';
import UserAvatar from '@/components/UserAvatar';
import FollowButton from '@/components/FollowButton';
import ToolsMarquee from '@/components/ToolsMarquee';
import WelcomeModal from '@/components/WelcomeModal';
import AdBanner from '@/components/AdBanner';
import Link from 'next/link';
import Image from 'next/image';
import { MessageCircle, Bookmark, TrendingUp, ArrowRight, Users, FolderOpen } from 'lucide-react';
import { stripCloudinaryProxy } from '@/lib/utils';
import '../App.css';

// Only use the custom main banner requested by the user
const BANNERS = [
  '/banner-event-homepage.jpeg'
];

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const POST_TYPE_STYLES = {
  share: { label: 'Share', bg: '#f0f0f0', color: '#231f20' },
  help: { label: 'Help', bg: '#fff0f0', color: '#ff3b3b' },
  feedback: { label: 'Feedback', bg: '#f0f8ff', color: '#0ea5e9' },
};

export default function Dashboard() {
  const [currentBanner, setCurrentBanner] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % BANNERS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const [projects, setProjects] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  // Stable Supabase client — not recreated on every render
  const supabase = useMemo(() => createClient(), []);
  const trendingProjects = projects.slice(0, 10);

  useEffect(() => {
    async function load() {
      const authPromise = supabase.auth.getUser().then(async ({ data: { user } }) => {
        if (user) {
          setCurrentUser(user);
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          if (profile) setCurrentProfile(profile);
        }
      });

      const trendingPromise = fetch('/api/trending')
        .then(res => res.json())
        .then(data => setProjects(data.projects || []))
        .catch(err => console.error('Failed to fetch trending', err));

      const usersPromise = fetch('/api/designers/top')
        .then(res => res.json())
        .then(data => setSuggestedUsers(data.designers || []))
        .catch(err => console.error('Failed to fetch designers', err));

      await Promise.allSettled([authPromise, trendingPromise, usersPromise]);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <>
      <WelcomeModal />
      <div className="homepage-layout">

        {/* Main feed */}
        <div className="homepage-feed">

          <div className="event-banner-wrapper" style={{ position: 'relative', overflow: 'hidden', aspectRatio: '4 / 1', borderRadius: '12px', background: '#000' }}>
            {BANNERS.map((src, idx) => (
              <Image
                key={src}
                src={src}
                alt={`Desayner featured event ${idx + 1}`}
                className="event-banner-img"
                width={1200}
                height={300}
                priority={idx === 0}
                unoptimized
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: currentBanner === idx ? 1 : 0,
                  transition: 'opacity 0.8s ease-in-out',
                  objectFit: 'cover',
                  zIndex: currentBanner === idx ? 1 : 0,
                  borderRadius: '12px'
                }}
              />
            ))}
            {/* Carousel Navigation Dots */}
            {BANNERS.length > 1 && (
              <div style={{ position: 'absolute', bottom: '1rem', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '0.6rem', zIndex: 10 }}>
                {BANNERS.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentBanner(idx)}
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: currentBanner === idx ? '#ffffff' : 'rgba(255, 255, 255, 0.4)',
                      transition: 'background 0.3s'
                    }}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

            <div style={{ paddingTop: '0.5rem' }}>
                  {/* --- TOP CREATORS SECTION --- */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6b6b6b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }} className="font-grotesk">
                        <Users size={13} /> Top Designers
                      </span>
                      <Link href="/designers" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#231f20', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        View all <ArrowRight size={13} />
                      </Link>
                    </div>

                    <div className="top-creators-grid swipe-grid-on-mobile hide-scrollbar">
                      {loading ? (
                        [...Array(8)].map((_, i) => (
                          <div key={i} className="swipe-grid-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'white', borderRadius: '12px', border: '1px solid #f0f0f0' }}>
                            <div className="shimmer-box" style={{ width: '48px', height: '48px', borderRadius: '50%' }} />
                            <div className="shimmer-box" style={{ width: '70px', height: '10px', borderRadius: '4px', marginTop: '0.25rem' }} />
                            <div className="shimmer-box" style={{ width: '50px', height: '8px', borderRadius: '4px' }} />
                          </div>
                        ))
                      ) : (
                        suggestedUsers.map(creator => (
                          <Link key={creator.id} href={`/profile/${creator.username}`} className="swipe-grid-item" style={{
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            padding: '0.75rem',
                            background: '#111827',
                            border: '1px solid #e5e7eb',
                            borderRadius: '16px',
                            textDecoration: 'none',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
                            overflow: 'hidden'
                          }}
                            onMouseOver={e => {
                              e.currentTarget.style.transform = 'translateY(-3px)';
                              e.currentTarget.style.boxShadow = '0 6px 15px rgba(0,0,0,0.1)';
                            }}
                            onMouseOut={e => {
                              e.currentTarget.style.transform = 'none';
                              e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.02)';
                            }}>
                            {/* Background Image */}
                            <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                              {creator.banner_url ? (
                                <>
                                  <img 
                                    src={stripCloudinaryProxy(creator.banner_url)} 
                                    alt="" 
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8, position: 'relative', zIndex: 1 }} 
                                  />
                                  <div style={{ width: '100%', height: '100%', background: 'linear-gradient(45deg, #231f20, #4b5563)', position: 'absolute', inset: 0, zIndex: 0 }} />
                                </>
                              ) : (
                                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(45deg, #231f20, #4b5563)' }} />
                              )}
                            </div>
                            
                            {/* Gradient Overlay for Text Readability */}
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0) 10%, rgba(0,0,0,0.85) 100%)', zIndex: 1 }} />

                            <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                              <div style={{ width: '42px', height: '42px', borderRadius: '50%', overflow: 'hidden', marginBottom: '0.4rem', border: '2px solid rgba(255,255,255,0.9)', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                                <UserAvatar src={creator.avatar_url} name={creator.full_name || creator.username} size={42} />
                              </div>
                              <span style={{
                                fontSize: '0.78rem',
                                fontWeight: 800,
                                color: 'white',
                                textAlign: 'center',
                                width: '100%',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                textShadow: '0 1px 2px rgba(0,0,0,0.6)'
                              }}>
                                {creator.full_name?.split(' ')[0] || creator.username}
                              </span>
                              <span style={{ fontSize: '0.65rem', color: '#d1d5db', fontWeight: 600 }}>
                                {creator.followers_count || 0} followers
                              </span>
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>

                  <ToolsMarquee />

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6b6b6b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }} className="font-grotesk">
                      <TrendingUp size={13} /> Trending
                    </span>
                    <Link href="/projects" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#231f20', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      View all <ArrowRight size={13} />
                    </Link>
                  </div>

                  {loading ? (
                    <div className="trending-projects-grid">
                      {[...Array(10)].map((_, i) => (
                        <div key={i} className="trending-project-card trending-project-card--loading">
                          <div className="trending-project-card__image-shell shimmer-box" />
                          <div className="trending-project-card__loading-lines">
                            <span className="shimmer-box" />
                            <span className="shimmer-box" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : trendingProjects.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem', border: '1px solid #e8e8e8', background: 'white' }}>
                      <FolderOpen size={32} style={{ color: '#e8e8e8', display: 'block', margin: '0 auto 1rem' }} />
                      <p style={{ color: '#9b9b9b', marginBottom: '1rem', fontSize: '0.9rem' }}>No projects yet. Be the first!</p>
                      <Link href="/projects/new" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.25rem', background: '#231f20', color: 'white', fontSize: '0.8rem', fontWeight: 700 }}>
                        Create Project
                      </Link>
                    </div>
                  ) : (
                    <div className="trending-projects-grid">
                      {trendingProjects.map((project, index) => (
                        <TrendingProjectCard
                          key={project.id}
                          project={project}
                          currentUserId={currentUser?.id}
                          rank={index + 1}
                        />
                      ))}
                    </div>
                  )}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="right-sidebar-wrapper">
            <div style={{ position: 'sticky', top: 'calc(56px + 1.5rem)' }}>
              <div style={{ padding: '1rem', background: '#f9f9f9', border: '1px solid #e8e8e8', marginBottom: '2rem' }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b6b6b', marginBottom: '0.75rem' }} className="font-grotesk">Quick Links</p>
                {[
                  { label: 'Explore Projects', href: '/projects' },
                  { label: 'Saved Items', href: '/saved' },
                ].map(item => (
                  <Link key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '0.8rem', color: '#231f20', fontWeight: 500, borderBottom: '1px solid #f0f0f0' }}>
                    {item.label} <ArrowRight size={12} color="#9b9b9b" />
                  </Link>
                ))}
              </div>

              <div style={{ marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b6b6b', display: 'flex', alignItems: 'center', gap: '0.4rem' }} className="font-grotesk">
                  <Users size={12} /> Who to follow
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {suggestedUsers.slice(0, 5).map(u => (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0', borderBottom: '1px solid #f0f0f0' }}>
                    <Link href={`/profile/${u.username}`}>
                      <UserAvatar src={u.avatar_url} name={u.full_name || u.username} size={30} />
                    </Link>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <Link href={`/profile/${u.username}`} style={{ display: 'block', fontWeight: 700, fontSize: '0.78rem', color: '#231f20', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {u.full_name || u.username}
                      </Link>
                      <span style={{ fontSize: '0.7rem', color: '#9b9b9b' }}>{u.projects_count || 0} projects</span>
                    </div>
                    <FollowButton
                      targetUserId={u.id}
                      currentUserId={currentUser?.id}
                      compact
                    />
                  </div>
                ))}
              </div>
              
              {/* Sidebar Ad Placement */}
              <div style={{ marginTop: '2.5rem', position: 'sticky', top: '2rem' }}>
                <span style={{ fontSize: '0.65rem', color: '#ccc', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem', textAlign: 'center' }}>Advertisement</span>
                <AdBanner variant="vertical" style={{ height: '480px' }} />
              </div>
            </div>
          </div>
        </div>
      </>
      );
}
