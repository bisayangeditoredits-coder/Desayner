'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import ProjectCard from '@/components/ProjectCard';
import PostComposer from '@/components/PostComposer';
import ReactionBar from '@/components/ReactionBar';
import UserAvatar from '@/components/UserAvatar';
import Link from 'next/link';
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
  const [tab, setTab] = useState('projects');
  const [projects, setProjects] = useState([]);
  const [posts, setPosts] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (profile) setCurrentProfile(profile);
      }

      try {
        const res = await fetch('/api/trending');
        const data = await res.json();
        setProjects(data.projects || []);
      } catch (err) {
        console.error('Failed to fetch trending', err);
      }

      const { data: postsData } = await supabase
        .from('community_posts')
        .select('*, profiles!community_posts_user_id_fkey(username, full_name, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(20);
      setPosts(postsData || []);

      const { data: usersData } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, followers_count, projects_count')
        .order('followers_count', { ascending: false })
        .limit(8);
      setSuggestedUsers(usersData || []);

      setLoading(false);
    }
    load();
  }, []);

  function onPosted(newPost) {
    setPosts(prev => [{ ...newPost, profiles: currentProfile }, ...prev]);
  }

  return (
    <>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', minHeight: '100vh', width: '100%', margin: '0 auto', padding: '1.5rem 1rem', gap: '2rem' }}>

          {/* Main feed */}
          <div style={{ borderRight: '1px solid var(--glass-border)', paddingRight: '2rem' }}>

            {/* --- EVENT BANNER SECTION --- */}
            {/* 
              BANNER IMAGE SIZE GUIDE: 
              Recommended aspect ratio is roughly 3:1 to 4:1 (e.g., 1200x300 pixels or 1200x400 pixels). 
              Use WebP, JPG, or optimized PNG for fast loading. 
              To change the image, simply replace the 'url(/event-banner.png)' in the background property below.
            */}
            <div style={{ padding: '0 2rem 1.5rem 2rem' }}>
              <div style={{
                position: 'relative',
                width: '100%',
                height: '240px',
                borderRadius: '12px',
                overflow: 'hidden',
                background: '#1a1a1a url(/event-banner.png) center/cover no-repeat',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: '2rem'
              }}>
                <div style={{ position: 'relative', zIndex: 10, maxWidth: '600px' }}>
                  <span style={{ background: '#0009fa', color: 'white', padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', borderRadius: '4px', marginBottom: '0.75rem', display: 'inline-block' }}>Upcoming Event</span>
                  <h2 style={{ color: 'white', fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', lineHeight: 1.2 }}>Welcome to Desayner</h2>
                  <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>Join top creators for a day of design, networking, and exclusive reveals.</p>
                  <button style={{ background: 'white', color: '#0a0a0a', padding: '0.6rem 1.25rem', fontSize: '0.85rem', fontWeight: 700, borderRadius: '6px', border: 'none', cursor: 'pointer' }}>Register Now</button>
                </div>
                {/* Dark overlay gradient to ensure text readability */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 70%)', zIndex: 1 }}></div>
              </div>
            </div>
            {/* --- END EVENT BANNER SECTION --- */}
            <div className="tabs" style={{ padding: '0 2rem' }}>
              <button className={`tab-btn ${tab === 'projects' ? 'active' : ''}`} onClick={() => setTab('projects')}>
                Projects
              </button>
              <button className={`tab-btn ${tab === 'community' ? 'active' : ''}`} onClick={() => setTab('community')}>
                Community
              </button>
            </div>

            <div style={{ paddingTop: '1.5rem' }}>
              {tab === 'projects' && (
                <div>
                  {/* --- TOP CREATORS SECTION --- */}
                  <div style={{ marginBottom: '2.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6b6b6b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Users size={13} /> Top Creators
                      </span>
                      <Link href="/creators" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0a0a0a', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        View all <ArrowRight size={13} />
                      </Link>
                    </div>
                    
                    <div className="top-creators-scroll" style={{ 
                      display: 'flex', 
                      gap: '1.25rem', 
                      overflowX: 'auto', 
                      paddingBottom: '0.75rem',
                      scrollbarWidth: 'none', /* Firefox */
                      msOverflowStyle: 'none' /* IE/Edge */
                    }}>
                      <style>{`.top-creators-scroll::-webkit-scrollbar { display: none; }`}</style>
                      
                      {loading ? (
                        [...Array(6)].map((_, i) => (
                          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', minWidth: '80px' }}>
                            <div className="shimmer-box" style={{ width: '64px', height: '64px', borderRadius: '50%' }} />
                            <div className="shimmer-box" style={{ width: '50px', height: '10px', borderRadius: '4px' }} />
                          </div>
                        ))
                      ) : (
                        suggestedUsers.map(creator => (
                          <Link key={creator.id} href={`/profile/${creator.username}`} style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            gap: '0.5rem',
                            minWidth: '80px',
                            textDecoration: 'none'
                          }}>
                            <div style={{
                              width: '64px', 
                              height: '64px', 
                              borderRadius: '50%', 
                              padding: '2px',
                              background: 'linear-gradient(45deg, #0009fa, #0ea5e9)',
                              flexShrink: 0
                            }}>
                              <div style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                border: '2px solid white'
                              }}>
                                <UserAvatar src={creator.avatar_url} name={creator.full_name || creator.username} size={56} />
                              </div>
                            </div>
                            <span style={{ 
                              fontSize: '0.75rem', 
                              fontWeight: 700, 
                              color: '#0a0a0a',
                              textAlign: 'center',
                              width: '100%',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {creator.full_name?.split(' ')[0] || creator.username}
                            </span>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6b6b6b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <TrendingUp size={13} /> Trending
                    </span>
                    <Link href="/projects" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0a0a0a', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      View all <ArrowRight size={13} />
                    </Link>
                  </div>

                  {loading ? (
                    <div className="projects-masonry">
                      {[...Array(8)].map((_, i) => <div key={i} className="masonry-item shimmer-box" style={{ aspectRatio: '4/3', borderRadius: '0' }} />)}
                    </div>
                  ) : projects.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem', border: '1px solid #e8e8e8', background: 'white' }}>
                      <FolderOpen size={32} style={{ color: '#e8e8e8', display: 'block', margin: '0 auto 1rem' }} />
                      <p style={{ color: '#9b9b9b', marginBottom: '1rem', fontSize: '0.9rem' }}>No projects yet. Be the first!</p>
                      <Link href="/projects/new" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.25rem', background: '#0a0a0a', color: 'white', fontSize: '0.8rem', fontWeight: 700 }}>
                        Create Project
                      </Link>
                    </div>
                  ) : (
                    <div className="projects-masonry">
                      {projects.map(project => (
                        <ProjectCard key={project.id} project={project} currentUserId={currentUser?.id} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'community' && (
                <div>
                  {currentProfile && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <PostComposer currentUser={currentProfile} onPosted={onPosted} />
                    </div>
                  )}

                  {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                      {[...Array(4)].map((_, i) => <div key={i} className="shimmer-box" style={{ height: '120px', border: '1px solid #e8e8e8' }} />)}
                    </div>
                  ) : posts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem', border: '1px solid #e8e8e8', background: 'white' }}>
                      <p style={{ color: '#9b9b9b', fontSize: '0.9rem' }}>No posts yet. Start the conversation!</p>
                    </div>
                  ) : (
                    posts.map(post => (
                      <div key={post.id} className="post-card">
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
                          <Link href={`/profile/${post.profiles?.username}`}>
                            <UserAvatar src={post.profiles?.avatar_url} name={post.profiles?.full_name || post.profiles?.username} size={36} />
                          </Link>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                              <Link href={`/profile/${post.profiles?.username}`} style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0a0a0a' }}>
                                {post.profiles?.full_name || post.profiles?.username}
                              </Link>
                              <span style={{ fontSize: '0.75rem', color: '#9b9b9b' }}>{timeAgo(post.created_at)}</span>
                              {post.post_type && post.post_type !== 'share' && (
                                <span style={{ padding: '0.15rem 0.5rem', background: POST_TYPE_STYLES[post.post_type]?.bg, color: POST_TYPE_STYLES[post.post_type]?.color, fontSize: '0.7rem', fontWeight: 700 }}>
                                  {POST_TYPE_STYLES[post.post_type]?.label}
                                </span>
                              )}
                            </div>
                            <p style={{ fontSize: '0.875rem', color: '#0a0a0a', lineHeight: 1.6 }}>{post.body}</p>
                            {post.image_url && (
                              <img src={post.image_url} alt="" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', border: '1px solid #e8e8e8', marginTop: '0.75rem' }} />
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingLeft: '3rem' }}>
                          <ReactionBar postId={post.id} currentUserId={currentUser?.id} reactionsCount={post.reactions_count} />
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#9b9b9b', fontWeight: 600 }}>
                            <MessageCircle size={13} /> {post.comments_count > 0 && post.comments_count}
                          </span>
                        </div>
                      </div>
                    ))
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
                  <Link href={`/profile/${u.username}`} style={{ padding: '0.25rem 0.6rem', border: '1px solid #e8e8e8', fontSize: '0.7rem', fontWeight: 700, color: '#0a0a0a', background: 'white', flexShrink: 0 }}>
                    Follow
                  </Link>
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
