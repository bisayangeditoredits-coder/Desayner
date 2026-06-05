'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import ProjectCard from '@/components/ProjectCard';
import FollowButton from '@/components/FollowButton';
import UserAvatar from '@/components/UserAvatar';
import Link from 'next/link';
import { Globe, MapPin, Calendar, MessageSquare } from 'lucide-react';
import { CREATIVE_TOOLS } from '@/lib/constants';
import '../../../App.css';

/** Small button that starts a conversation with a user */
function MessageButton({ profileId }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function startChat() {
    setLoading(true);
    try {
      const res = await fetch('/api/conversations/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: profileId }),
      });
      const { conversationId } = await res.json();
      if (conversationId) router.push(`/messages?open=${conversationId}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={startChat}
      disabled={loading}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
        padding: '0.45rem 1rem', border: '1px solid #e8e8e8',
        fontSize: '0.78rem', fontWeight: 700, color: '#0a0a0a',
        background: 'white', cursor: loading ? 'wait' : 'pointer',
        fontFamily: 'inherit',
      }}
    >
      <MessageSquare size={13} />
      {loading ? 'Opening…' : 'Message'}
    </button>
  );
}

export default function ProfilePage() {
  const { username } = useParams();
  const [profile, setProfile]           = useState(null);
  const [projects, setProjects]         = useState([]);
  const [savedProjects, setSavedProjects] = useState([]);
  const [tab, setTab]                   = useState('projects');
  const [currentUser, setCurrentUser]   = useState(null);
  const [isFollowing, setIsFollowing]   = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading]           = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUser(user);

      const { data: profileData } = await supabase
        .from('profiles').select('*').eq('username', username).single();
      if (!profileData) { setLoading(false); return; }
      setProfile(profileData);
      setFollowerCount(profileData.followers_count || 0);

      const { data: projectsData } = await supabase
        .from('projects')
        .select('*, profiles!projects_user_id_fkey(username, full_name, avatar_url)')
        .eq('user_id', profileData.id)
        .eq('published', true)
        .order('created_at', { ascending: false });
      setProjects(projectsData || []);

      // Saved projects — only visible to the profile owner
      if (user && user.id === profileData.id) {
        const { data: savedData } = await supabase
          .from('project_saves')
          .select('projects(*, profiles!projects_user_id_fkey(username, full_name, avatar_url))')
          .eq('user_id', profileData.id)
          .order('created_at', { ascending: false });
        setSavedProjects((savedData || []).map(r => r.projects).filter(Boolean));
      }

      if (user && user.id !== profileData.id) {
        const { data: followData } = await supabase
          .from('follows')
          .select('follower_id')
          .eq('follower_id', user.id)
          .eq('following_id', profileData.id)
          .maybeSingle();
        setIsFollowing(!!followData);
      }

      setLoading(false);
    }
    load();
  }, [username]);

  const isOwn = currentUser && profile && currentUser.id === profile.id;

  if (loading) return (
    <>
      <div style={{ padding: '4rem', textAlign: 'center', color: '#9b9b9b', fontSize: '0.875rem' }}>Loading...</div>
    </>
  );

  if (!profile) return (
    <>
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <p style={{ fontWeight: 700, marginBottom: '0.5rem' }}>User not found</p>
        <p style={{ color: '#9b9b9b', fontSize: '0.875rem' }}>@{username} doesn't exist.</p>
      </div>
    </>
  );

  return (
    <>

        {/* Cover Photo */}
        {profile.cover_url ? (
          <div style={{ width: '100%', height: '240px', background: '#e5e7eb', position: 'relative' }}>
            <img src={profile.cover_url} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ) : (
          <div style={{ width: '100%', height: '120px', background: 'linear-gradient(135deg, #f9fafb, #f3f4f6)' }} />
        )}

        {/* Profile header */}
        <div className="profile-header" style={{ paddingTop: '0', position: 'relative' }}>
          <div style={{ maxWidth: '960px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', flexWrap: 'wrap' }}>
              
              {/* Avatar overlapping cover */}
              <div style={{ marginTop: '-40px', position: 'relative', zIndex: 10, padding: '4px', background: 'white', borderRadius: '50%' }}>
                <UserAvatar src={profile.avatar_url} name={profile.full_name || profile.username} size={100} />
              </div>

              <div style={{ flex: 1, minWidth: '200px', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.2 }}>
                      {profile.full_name || profile.username}
                    </h1>
                    <p style={{ fontSize: '0.82rem', color: '#9b9b9b', marginTop: '0.1rem' }}>@{profile.username}</p>
                  </div>
                  <div style={{ marginTop: '0.2rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {isOwn ? (
                      <Link href="/settings" style={{ padding: '0.45rem 1rem', border: '1px solid #e8e8e8', fontSize: '0.78rem', fontWeight: 700, color: '#0a0a0a', background: 'white', textDecoration: 'none', display: 'inline-block' }}>
                        Edit Profile
                      </Link>
                    ) : (
                      <>
                        <FollowButton targetUserId={profile.id} currentUserId={currentUser?.id} initialFollowing={isFollowing} />
                        {currentUser && (
                          <MessageButton profileId={profile.id} />
                        )}
                      </>
                    )}
                  </div>
                </div>

                {profile.bio ? (
                  <p style={{ fontSize: '0.875rem', color: '#0a0a0a', lineHeight: 1.65, marginBottom: '0.75rem', maxWidth: '520px' }}>
                    {profile.bio}
                  </p>
                ) : isOwn ? (
                  <Link href="/settings" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    fontSize: '0.82rem', color: '#9b9b9b', marginBottom: '0.75rem',
                    border: '1px dashed #d1d5db', padding: '0.4rem 0.75rem',
                    textDecoration: 'none', background: 'white',
                    transition: 'border-color 0.15s, color 0.15s',
                  }}>
                    ✏️ Add a bio to tell people about yourself →
                  </Link>
                ) : null}

                {profile.tools && profile.tools.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                    {profile.tools.map(toolId => {
                      const t = CREATIVE_TOOLS.find(c => c.id === toolId);
                      if (!t) return null;
                      return (
                        <div key={toolId} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.75rem', background: '#f5f5f5', border: '1px solid #e8e8e8', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, color: '#0a0a0a' }} title={t.name}>
                          <img src={t.iconPath} alt={t.name} style={{ width: '14px', height: '14px', objectFit: 'contain' }} />
                          {t.name}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                  {profile.location && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: '#9b9b9b' }}>
                      <MapPin size={12} /> {profile.location}
                    </span>
                  )}
                  {profile.website && (
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: '#0a0a0a', fontWeight: 600 }}>
                      <Globe size={12} /> {profile.website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: '#9b9b9b' }}>
                    <Calendar size={12} /> Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', gap: '2rem', flexShrink: 0, paddingTop: '1.5rem' }}>
                {[
                  { label: 'Projects',   value: profile.projects_count || projects.length },
                  { label: 'Followers',  value: followerCount },
                  { label: 'Following',  value: profile.following_count || 0 },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.04em', color: '#0a0a0a' }}>{s.value}</div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9b9b9b' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ borderBottom: '1px solid #e8e8e8', padding: '0 2rem', background: 'white', position: 'sticky', top: '56px', zIndex: 700 }}>
          <div className="tabs">
            <button className={`tab-btn ${tab === 'projects' ? 'active' : ''}`} onClick={() => setTab('projects')}>
              Projects ({projects.length})
            </button>
            {isOwn && (
              <button className={`tab-btn ${tab === 'saved' ? 'active' : ''}`} onClick={() => setTab('saved')}>
                Saved ({savedProjects.length})
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="page-content">
          {tab === 'projects' ? (
            projects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', border: '1px solid #e8e8e8', background: 'white' }}>
                <p style={{ color: '#9b9b9b', fontSize: '0.875rem' }}>
                  {isOwn ? "You haven't published any projects yet." : `${profile.full_name || profile.username} hasn't shared any projects yet.`}
                </p>
                {isOwn && (
                  <Link href="/projects/new" style={{ display: 'inline-block', marginTop: '1rem', padding: '0.5rem 1.25rem', background: '#0a0a0a', color: 'white', fontSize: '0.8rem', fontWeight: 700 }}>
                    Create First Project
                  </Link>
                )}
              </div>
            ) : (
              <div className="projects-masonry">
                {projects.map(project => (
                  <ProjectCard key={project.id} project={project} currentUserId={currentUser?.id} />
                ))}
              </div>
            )
          ) : (
            savedProjects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', border: '1px solid #e8e8e8', background: 'white' }}>
                <p style={{ color: '#9b9b9b', fontSize: '0.875rem' }}>No saved projects yet.</p>
              </div>
            ) : (
              <div className="projects-masonry">
                {savedProjects.map(project => (
                  <ProjectCard key={project.id} project={project} currentUserId={currentUser?.id} />
                ))}
              </div>
            )
          )}
        </div>
      </>
  );
}
