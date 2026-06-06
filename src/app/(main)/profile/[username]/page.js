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
      className="profile-pill-btn profile-pill-btn-outline"
      style={{ cursor: loading ? 'wait' : 'pointer' }}
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
      <div className="profile-layout-container">
        
        {/* Top Split Header Section */}
        <div className="profile-top-grid">
          
          {/* Left Info Column */}
          <div className="profile-info-column">
            
            {/* Avatar Row */}
            <div className="profile-avatar-row">
              <UserAvatar src={profile.avatar_url} name={profile.full_name || profile.username} size={96} />
            </div>

            {/* Name & Custom Badge Tag */}
            <div className="profile-name-tag-row">
              <h1 className="profile-display-name">
                {profile.full_name || profile.username}
              </h1>
              <span className="profile-pro-badge">Creator Select</span>
            </div>
            
            <p className="profile-username-tag">@{profile.username}</p>

            {/* Headline Bio */}
            {profile.bio ? (
              <h2 className="profile-bio-headline">{profile.bio}</h2>
            ) : isOwn ? (
              <Link href="/settings" className="profile-bio-add-prompt">
                ✏️ Add a bio to tell the community about your work →
              </Link>
            ) : (
              <h2 className="profile-bio-headline profile-bio-placeholder">
                Digital creator at Desayner Studio.
              </h2>
            )}

            {/* Stats Row */}
            <div className="profile-stats-row">
              <span className="profile-stat-item">
                <strong>{followerCount.toLocaleString()}</strong> followers
              </span>
              <span className="profile-stat-divider">·</span>
              <span className="profile-stat-item">
                <strong>{(profile.following_count || 0).toLocaleString()}</strong> following
              </span>
              <span className="profile-stat-divider">·</span>
              <span className="profile-stat-item">
                <strong>{(profile.projects_count || projects.length).toLocaleString()}</strong> projects
              </span>
            </div>

            {/* Actions Row */}
            <div className="profile-actions-row">
              {isOwn ? (
                <Link href="/settings" className="profile-pill-btn profile-pill-btn-dark">
                  Edit Profile
                </Link>
              ) : (
                <>
                  <FollowButton targetUserId={profile.id} currentUserId={currentUser?.id} initialFollowing={isFollowing} compact={true} />
                  {currentUser && (
                    <MessageButton profileId={profile.id} />
                  )}
                </>
              )}
              {profile.website && (
                <a 
                  href={profile.website} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="profile-round-btn" 
                  title="Visit Website"
                >
                  <Globe size={15} />
                </a>
              )}
            </div>

          </div>

          {/* Right Showcase Card */}
          <div className="profile-cover-column">
            <div className="profile-cover-showcase">
              
              <div className="profile-showcase-badge">PRO</div>

              {profile.cover_url ? (
                <img 
                  src={profile.cover_url} 
                  alt="Profile Cover" 
                  className="profile-showcase-img"
                />
              ) : projects.length > 0 && projects[0].cover_url ? (
                <img 
                  src={projects[0].cover_url} 
                  alt="Featured Work" 
                  className="profile-showcase-img"
                />
              ) : (
                <div className="profile-showcase-gradient">
                  <div className="profile-showcase-gradient-logo">Desayner</div>
                  <div className="profile-showcase-gradient-text">Define. Design. Develop.</div>
                </div>
              )}

            </div>
          </div>

        </div>

        {/* Tab Navigation */}
        <div className="profile-tabs-wrapper">
          <div className="profile-tabs-inner">
            <div className="profile-tabs-list">
              <button 
                className={`profile-tab-btn ${tab === 'projects' ? 'active' : ''}`} 
                onClick={() => setTab('projects')}
              >
                Work ({projects.length})
              </button>
              {isOwn && (
                <button 
                  className={`profile-tab-btn ${tab === 'saved' ? 'active' : ''}`} 
                  onClick={() => setTab('saved')}
                >
                  Saved ({savedProjects.length})
                </button>
              )}
              <button 
                className={`profile-tab-btn ${tab === 'about' ? 'active' : ''}`} 
                onClick={() => setTab('about')}
              >
                About
              </button>
            </div>

            {tab === 'projects' && projects.length > 0 && (
              <div className="profile-sort-dropdown-container">
                <span className="profile-sort-label">Sort:</span>
                <span className="profile-sort-active">Recent Shots</span>
              </div>
            )}
          </div>
        </div>

        {/* Tab Contents */}
        <div className="profile-tab-content-container">
          {tab === 'projects' && (
            projects.length === 0 ? (
              <div className="profile-empty-state">
                <p>
                  {isOwn ? "You haven't published any projects yet." : `${profile.full_name || profile.username} hasn't shared any projects yet.`}
                </p>
                {isOwn && (
                  <Link href="/projects/new" className="btn btn-dark" style={{ borderRadius: '20px', fontSize: '0.8rem', marginTop: '1rem' }}>
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
          )}

          {tab === 'saved' && (
            savedProjects.length === 0 ? (
              <div className="profile-empty-state">
                <p>No saved projects yet.</p>
              </div>
            ) : (
              <div className="projects-masonry">
                {savedProjects.map(project => (
                  <ProjectCard key={project.id} project={project} currentUserId={currentUser?.id} />
                ))}
              </div>
            )
          )}

          {tab === 'about' && (
            <div className="profile-about-grid">
              
              <div className="profile-about-info">
                <h3 className="profile-about-section-title">Biography</h3>
                <p className="profile-about-bio-text">
                  {profile.bio || "No biography provided yet."}
                </p>

                {profile.tools && profile.tools.length > 0 && (
                  <div style={{ marginTop: '2rem' }}>
                    <h3 className="profile-about-section-title">Creative Tools</h3>
                    <div className="profile-about-tools-list">
                      {profile.tools.map(toolId => {
                        const t = CREATIVE_TOOLS.find(c => c.id === toolId);
                        if (!t) return null;
                        return (
                          <div key={toolId} className="profile-about-tool-pill" title={t.name}>
                            <img src={t.iconPath} alt={t.name} className="profile-about-tool-icon" />
                            <span>{t.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="profile-about-meta-card">
                <h3 className="profile-about-section-title">Details</h3>
                
                <div className="profile-meta-item">
                  <Globe size={16} className="profile-meta-icon" />
                  <div>
                    <div className="profile-meta-label">Website</div>
                    {profile.website ? (
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" className="profile-meta-value profile-meta-link">
                        {profile.website.replace(/^https?:\/\//, '')}
                      </a>
                    ) : (
                      <span className="profile-meta-value text-muted">None listed</span>
                    )}
                  </div>
                </div>

                <div className="profile-meta-item">
                  <MapPin size={16} className="profile-meta-icon" />
                  <div>
                    <div className="profile-meta-label">Location</div>
                    <span className="profile-meta-value">
                      {profile.location || "Earth"}
                    </span>
                  </div>
                </div>

                <div className="profile-meta-item">
                  <Calendar size={16} className="profile-meta-icon" />
                  <div>
                    <div className="profile-meta-label">Member Since</div>
                    <span className="profile-meta-value">
                      {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </div>

              </div>

            </div>
          )}
        </div>
      </div>
    </>
  );
}
