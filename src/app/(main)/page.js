'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import TrendingProjectCard from '@/components/TrendingProjectCard';
import PostComposer from '@/components/PostComposer';
import ReactionBar from '@/components/ReactionBar';
import UserAvatar from '@/components/UserAvatar';
import FollowButton from '@/components/FollowButton';
import ToolsMarquee from '@/components/ToolsMarquee';
import Link from 'next/link';
import Image from 'next/image';
import { MessageCircle, Bookmark, TrendingUp, ArrowRight, Users, FolderOpen } from 'lucide-react';
import '../App.css';

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
  share: { label: 'Share', bg: '#f0f0f0', color: '#0a0a0a' },
  help: { label: 'Help', bg: '#fff0f0', color: '#ff3b3b' },
  feedback: { label: 'Feedback', bg: '#f0f8ff', color: '#0ea5e9' },
};

export default function Dashboard() {
  const banners = [
    '/banner-event-homepage.jpeg',
    '/banner-event-2.png',
    '/banner-event-3.png'
  ];
  const [currentBanner, setCurrentBanner] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const [tab, setTab] = useState('projects');
  const [projects, setProjects] = useState([]);
  const [posts, setPosts] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
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

      const postsPromise = supabase
        .from('community_posts')
        .select('*, profiles!community_posts_user_id_fkey(username, full_name, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(20)
        .then(({ data }) => setPosts(data || []));

      const usersPromise = supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, followers_count, projects_count, cover_url')
        .order('followers_count', { ascending: false })
        .limit(8)
        .then(async ({ data }) => {
           if (!data) return setSuggestedUsers([]);
           
           const userIds = data.map(u => u.id);
           const { data: projectsData } = await supabase
             .from('projects')
             .select('user_id, cover_url, thumbnail_url')
             .in('user_id', userIds)
             .eq('published', true);

           const processed = data.map(u => {
             const userProj = (projectsData || []).find(p => p.user_id === u.id);
             return {
               ...u,
               banner_url: u.cover_url || (userProj ? userProj.thumbnail_url || userProj.cover_url : null)
             };
           });
           setSuggestedUsers(processed);
        });

      await Promise.all([authPromise, trendingPromise, postsPromise, usersPromise]);
      setLoading(false);
    }
    load();
  }, []);

  function onPosted(newPost) {
    setPosts(prev => [{ ...newPost, profiles: currentProfile }, ...prev]);
  }

  return (
    <>
      <div className="homepage-layout">

        {/* Main feed */}
        <div className="homepage-feed">

          <div className="event-banner-wrapper" style={{ position: 'relative', overflow: 'hidden', aspectRatio: '4 / 1', borderRadius: '12px', background: '#000' }}>
            {banners.map((src, idx) => (
              <Image
                key={src}
                src={src}
                alt={`Desayner featured event ${idx + 1}`}
                className="event-banner-img"
                width={1200}
                height={300}
                priority={idx === 0}
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
            <div style={{ position: 'absolute', bottom: '1rem', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '0.6rem', zIndex: 10 }}>
              {banners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentBanner(idx)}
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: currentBanner === idx ? '#ffffff' : 'rgba(255, 255, 255, 0.4)',
                    border: currentBanner === idx ? '1px solid rgba(0,0,0,0.1)' : 'none',
                    padding: 0,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                  }}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
            <div className="tabs homepage-tabs">
              <button className={`tab-btn ${tab === 'projects' ? 'active' : ''}`} onClick={() => setTab('projects')}>
                Projects
              </button>
              <button className={`tab-btn ${tab === 'community' ? 'active' : ''}`} onClick={() => setTab('community')}>
                Community
              </button>
            </div>

            <div style={{ paddingTop: '0.5rem' }}>
              {tab === 'projects' && (
                <div>
                  {/* --- TOP CREATORS SECTION --- */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6b6b6b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Users size={13} /> Top Designers
                      </span>
                      <Link href="/designers" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0a0a0a', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        View all <ArrowRight size={13} />
                      </Link>
                    </div>

                    <div className="top-creators-grid hide-scrollbar" style={{
                      display: 'flex',
                      overflowX: 'auto',
                      gap: '0.6rem', // Minimal spacing as requested
                      paddingBottom: '0.75rem',
                      WebkitOverflowScrolling: 'touch',
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none'
                    }}>
                      {loading ? (
                        [...Array(8)].map((_, i) => (
                          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'white', borderRadius: '12px', border: '1px solid #f0f0f0', width: '100px', minWidth: '100px', flexShrink: 0, height: '140px' }}>
                            <div className="shimmer-box" style={{ width: '48px', height: '48px', borderRadius: '50%' }} />
                            <div className="shimmer-box" style={{ width: '70px', height: '10px', borderRadius: '4px', marginTop: '0.25rem' }} />
                            <div className="shimmer-box" style={{ width: '50px', height: '8px', borderRadius: '4px' }} />
                          </div>
                        ))
                      ) : (
                        suggestedUsers.map(creator => (
                          <Link key={creator.id} href={`/profile/${creator.username}`} style={{
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            padding: '0.75rem',
                            background: '#111827',
                            border: '1px solid #e5e7eb',
                            borderRadius: '16px',
                            width: '100px',
                            minWidth: '100px',
                            flexShrink: 0,
                            height: '140px',
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
                                <img src={creator.banner_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
                              ) : (
                                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(45deg, #0a0a0a, #4b5563)' }} />
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
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6b6b6b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <TrendingUp size={13} /> Trending
                    </span>
                    <Link href="/projects" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0a0a0a', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
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
                      <Link href="/projects/new" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.25rem', background: '#0a0a0a', color: 'white', fontSize: '0.8rem', fontWeight: 700 }}>
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
              )}

              {tab === 'community' && (
                <div style={{ maxWidth: '680px', margin: '0 auto' }}>
                  {currentProfile && (
                    <div style={{ marginBottom: '1.5rem', background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      <PostComposer currentUser={currentProfile} onPosted={onPosted} />
                    </div>
                  )}

                  {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {[...Array(4)].map((_, i) => <div key={i} className="shimmer-box" style={{ height: '140px', borderRadius: '16px', border: '1px solid #f3f4f6' }} />)}
                    </div>
                  ) : posts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '16px', border: '1px dashed #d1d5db' }}>
                      <p style={{ color: '#6b7280', fontSize: '0.95rem', fontWeight: 500 }}>No posts yet. Start the conversation!</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {posts.map(post => (
                        <div key={post.id} style={{
                          background: 'white',
                          borderRadius: '16px',
                          border: '1px solid #e5e7eb',
                          padding: '1.25rem 1.5rem',
                          transition: 'box-shadow 0.2s ease',
                          cursor: 'pointer'
                        }}
                        onMouseOver={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)'}
                        onMouseOut={e => e.currentTarget.style.boxShadow = 'none'}
                        >
                          {/* Post Header */}
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', marginBottom: '0.85rem' }}>
                            <Link href={post.profiles?.username ? `/profile/${post.profiles.username}` : '#'}>
                              <UserAvatar src={post.profiles?.avatar_url} name={post.profiles?.full_name || post.profiles?.username} size={42} />
                            </Link>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                <Link href={post.profiles?.username ? `/profile/${post.profiles.username}` : '#'} style={{ fontWeight: 800, fontSize: '0.95rem', color: '#111827', textDecoration: 'none' }}>
                                  {post.profiles?.full_name || post.profiles?.username}
                                </Link>
                                <span style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 500 }}>@{post.profiles?.username}</span>
                                <span style={{ color: '#d1d5db', fontSize: '0.8rem' }}>•</span>
                                <span style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 500 }}>{timeAgo(post.created_at)}</span>
                              </div>
                              {post.post_type && post.post_type !== 'share' && (
                                <span style={{ 
                                  display: 'inline-block',
                                  marginTop: '0.2rem',
                                  padding: '0.15rem 0.6rem', 
                                  background: POST_TYPE_STYLES[post.post_type]?.bg, 
                                  color: POST_TYPE_STYLES[post.post_type]?.color, 
                                  fontSize: '0.7rem', 
                                  fontWeight: 800,
                                  borderRadius: '6px'
                                }}>
                                  {POST_TYPE_STYLES[post.post_type]?.label}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Post Content */}
                          <div style={{ paddingLeft: '3.4rem' }}>
                            <p style={{ fontSize: '0.95rem', color: '#1f2937', lineHeight: 1.6, margin: '0 0 1rem 0', whiteSpace: 'pre-wrap' }}>
                              {post.body}
                            </p>
                            {post.image_url && (
                              <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb', marginBottom: '1rem' }}>
                                <img src={post.image_url} alt="Post image" style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', display: 'block' }} />
                              </div>
                            )}

                            {/* Action Bar */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '0.5rem' }}>
                              <ReactionBar postId={post.id} currentUserId={currentUser?.id} reactionsCount={post.reactions_count} />
                              
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#6b7280', transition: 'color 0.2s ease', cursor: 'pointer' }}
                                onMouseOver={e => e.currentTarget.style.color = '#3b82f6'}
                                onMouseOut={e => e.currentTarget.style.color = '#6b7280'}
                              >
                                <div style={{ padding: '0.4rem', borderRadius: '50%', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <MessageCircle size={18} strokeWidth={2} />
                                </div>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{post.comments_count || 0}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="right-sidebar-wrapper">
            <div style={{ position: 'sticky', top: 'calc(56px + 1.5rem)' }}>
              <div style={{ marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b6b6b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
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
                      <Link href={`/profile/${u.username}`} style={{ display: 'block', fontWeight: 700, fontSize: '0.78rem', color: '#0a0a0a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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

              <div style={{ marginTop: '2rem', padding: '1rem', background: '#f9f9f9', border: '1px solid #e8e8e8' }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b6b6b', marginBottom: '0.75rem' }}>Quick Links</p>
                {[
                  { label: 'Explore Projects', href: '/projects' },
                  { label: 'Community Feed', href: '/community' },
                  { label: 'Saved Items', href: '/saved' },
                ].map(item => (
                  <Link key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '0.8rem', color: '#0a0a0a', fontWeight: 500, borderBottom: '1px solid #f0f0f0' }}>
                    {item.label} <ArrowRight size={12} color="#9b9b9b" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
      );
}
