'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import ProjectCard from '@/components/ProjectCard';
import FollowButton from '@/components/FollowButton';
import UserAvatar from '@/components/UserAvatar';
import Link from 'next/link';
import { Globe, MapPin, Calendar, MessageSquare, ExternalLink, Folder, ArrowLeft } from 'lucide-react';
import { CREATIVE_TOOLS } from '@/lib/constants';
import '../../../App.css';

/** Small button that starts a conversation with a user */
function MessageButton({ profileId }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  async function startChat() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/conversations/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: profileId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not start conversation');
        return;
      }
      if (data.conversationId) {
        window.location.href = `/messages?open=${data.conversationId}`;
      }
    } catch {
      setError('Could not start conversation');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
      <button
        onClick={startChat}
        disabled={loading}
        className="profile-pill-btn profile-pill-btn-outline"
        style={{ cursor: loading ? 'wait' : 'pointer' }}
      >
        <MessageSquare size={13} />
        {loading ? 'Opening…' : 'Message'}
      </button>
      {error && <span style={{ fontSize: '0.7rem', color: '#ef4444' }}>{error}</span>}
    </div>
  );
}

export default function ProfilePage() {
  const { username } = useParams();
  const [profile, setProfile]           = useState(null);
  const [projects, setProjects]         = useState([]);
  const [savedProjects, setSavedProjects] = useState([]);
  const [collections, setCollections]   = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [tab, setTab]                   = useState('projects');
  const [currentUser, setCurrentUser]   = useState(null);
  const [isFollowing, setIsFollowing]   = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading]           = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/profile/${encodeURIComponent(username)}`);
        if (!res.ok) {
          if (res.status === 404) { setProfile(null); return; }
          throw new Error(`Failed to fetch profile: ${res.status}`);
        }
        const data = await res.json();
        if (data.profile) {
          setProfile(data.profile);
          setFollowerCount(data.profile.followers_count || 0);
        }
        setProjects(data.projects || []);
        setSavedProjects(data.savedProjects || []);
        setCollections(data.collections || []);
        setIsFollowing(data.isFollowing || false);
        if (data.currentUser) setCurrentUser(data.currentUser);
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [username]);

  const isOwn = currentUser && profile && currentUser.id === profile.id;

  if (loading) return (
    <div className="profile-loading-state">
      <div className="profile-loading-cover" />
      <div className="profile-loading-body">
        <div className="profile-loading-avatar" />
        <div className="profile-loading-lines">
          <div className="profile-loading-line" style={{ width: '160px', height: '20px' }} />
          <div className="profile-loading-line" style={{ width: '100px', height: '14px' }} />
        </div>
      </div>
    </div>
  );

  if (!profile) return (
    <div style={{ padding: '6rem 2rem', textAlign: 'center' }}>
      <p style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '1.1rem' }}>User not found</p>
      <p style={{ color: '#9b9b9b', fontSize: '0.875rem' }}>@{username} doesn&apos;t exist.</p>
    </div>
  );

  const coverSrc = profile.cover_url || (projects.length > 0 ? projects[0].cover_url : null);

  return (
    <div className="profile-v2">

      {/* ── Cover Banner ── */}
      <div className="profile-v2__cover">
        {coverSrc ? (
          <img src={coverSrc} alt="Cover" className="profile-v2__cover-img" />
        ) : (
          <div className="profile-v2__cover-placeholder" />
        )}
      </div>

      {/* ── Identity Bar ── */}
      <div className="profile-v2__identity">
        <div className="profile-v2__identity-inner">

          {/* Avatar — floated up over cover */}
          <div className="profile-v2__avatar-wrap">
            <UserAvatar
              src={profile.avatar_url}
              name={profile.full_name || profile.username}
              size={88}
            />
          </div>

          {/* Name / username / bio / stats — main column */}
          <div className="profile-v2__identity-text">
            <div className="profile-v2__name-row">
              <h1 className="profile-v2__name">{profile.full_name || profile.username}</h1>
              <span className="profile-v2__badge">Creator</span>
            </div>
            <p className="profile-v2__username">@{profile.username}</p>
            {profile.bio && (
              <p className="profile-v2__bio">{profile.bio}</p>
            )}

            {/* Stats and Actions in one row/area */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '2rem', marginTop: '1rem' }}>
              <div className="profile-v2__stats" style={{ marginTop: 0, borderTop: 'none', paddingTop: 0 }}>
                <div className="profile-v2__stat">
                  <span className="profile-v2__stat-num">{followerCount.toLocaleString()}</span>
                  <span className="profile-v2__stat-label">Followers</span>
                </div>
                <div className="profile-v2__stat-divider" />
                <div className="profile-v2__stat">
                  <span className="profile-v2__stat-num">{(profile.following_count || 0).toLocaleString()}</span>
                  <span className="profile-v2__stat-label">Following</span>
                </div>
                <div className="profile-v2__stat-divider" />
                <div className="profile-v2__stat">
                  <span className="profile-v2__stat-num">{(profile.projects_count || projects.length).toLocaleString()}</span>
                  <span className="profile-v2__stat-label">Projects</span>
                </div>
              </div>

              {/* Actions moved closer */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {isOwn ? (
                  <Link href="/settings" className="profile-pill-btn profile-pill-btn-dark">
                    Edit Profile
                  </Link>
                ) : (
                  <>
                    <FollowButton
                      targetUserId={profile.id}
                      currentUserId={currentUser?.id}
                      initialFollowing={isFollowing}
                      compact={true}
                    />
                    {currentUser && <MessageButton profileId={profile.id} />}
                  </>
                )}
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="profile-v2__website-btn"
                    title="Website"
                    style={{ margin: 0 }}
                  >
                    <Globe size={14} />
                    <span>{profile.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
                    <ExternalLink size={11} style={{ opacity: 0.5 }} />
                  </a>
                )}
              </div>
            </div>
          </div>


        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="profile-v2__tabs-bar">
        <div className="profile-v2__tabs-inner">
          <div className="profile-v2__tabs-list">
            <button
              className={`profile-v2__tab-btn${tab === 'projects' ? ' active' : ''}`}
              onClick={() => { setTab('projects'); setSelectedCollection(null); }}
            >
              Work
              <span className="profile-v2__tab-count">{projects.length}</span>
            </button>
            {isOwn && (
              <button
                className={`profile-v2__tab-btn${tab === 'saved' ? ' active' : ''}`}
                onClick={() => { setTab('saved'); setSelectedCollection(null); }}
              >
                Saved
                <span className="profile-v2__tab-count">{savedProjects.length}</span>
              </button>
            )}
            <button
              className={`profile-v2__tab-btn${tab === 'about' ? ' active' : ''}`}
              onClick={() => { setTab('about'); setSelectedCollection(null); }}
            >
              About
            </button>
          </div>
        </div>
      </div>

      {/* ── Tab Contents ── */}
      <div className="profile-v2__content">

        {/* Work tab */}
        {tab === 'projects' && (
          projects.length === 0 ? (
            <div className="profile-v2__empty">
              <p style={{ fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.95rem' }}>
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

        {/* Saved tab */}
        {tab === 'saved' && (
          selectedCollection ? (
            <div>
              <button 
                onClick={() => setSelectedCollection(null)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.9rem', marginBottom: '1.5rem', color: '#0a0a0a' }}
              >
                <ArrowLeft size={16} /> Back to Collections
              </button>
              <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 700 }}>
                {selectedCollection === 'ALL' ? 'All Saved Items' : selectedCollection.name}
              </h2>
              
              {(() => {
                const items = selectedCollection === 'ALL' ? savedProjects : selectedCollection.items;
                if (items.length === 0) {
                  return (
                    <div className="profile-v2__empty">
                      <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>No projects in this collection.</p>
                    </div>
                  );
                }
                return (
                  <div className="projects-masonry">
                    {items.map(project => (
                      <ProjectCard key={project.id} project={project} currentUserId={currentUser?.id} />
                    ))}
                  </div>
                );
              })()}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
              <div 
                onClick={() => setSelectedCollection('ALL')}
                style={{ padding: '1.5rem', background: '#fafafa', border: '1px solid #e8e8e8', borderRadius: '12px', cursor: 'pointer', transition: 'border-color 0.2s', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = '#d1d1d1'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = '#e8e8e8'}
              >
                <Folder size={24} color="#0a0a0a" />
                <div>
                  <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.2rem' }}>All Saved Items</h3>
                  <p style={{ color: '#9b9b9b', fontSize: '0.85rem' }}>{savedProjects.length} items</p>
                </div>
              </div>
              
              {collections.map(col => (
                <div 
                  key={col.id} 
                  onClick={() => setSelectedCollection(col)}
                  style={{ padding: '1.5rem', background: '#fafafa', border: '1px solid #e8e8e8', borderRadius: '12px', cursor: 'pointer', transition: 'border-color 0.2s', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = '#d1d1d1'}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = '#e8e8e8'}
                >
                  <Folder size={24} color="#0a0a0a" />
                  <div>
                    <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.2rem' }}>{col.name}</h3>
                    <p style={{ color: '#9b9b9b', fontSize: '0.85rem' }}>{col.items.length} items</p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* About tab */}
        {tab === 'about' && (
          <div className="profile-v2__about">

            <div className="profile-v2__about-main">
              {/* Biography */}
              <section className="profile-v2__about-section">
                <h3 className="profile-v2__about-label">Biography</h3>
                <p className="profile-v2__about-bio">
                  {profile.bio || <span style={{ color: '#9b9b9b', fontStyle: 'italic' }}>No biography provided.</span>}
                </p>
              </section>

              {/* Tools */}
              {profile.tools && profile.tools.length > 0 && (
                <section className="profile-v2__about-section">
                  <h3 className="profile-v2__about-label">Creative Tools</h3>
                  <div className="profile-v2__tools-list">
                    {profile.tools.map(toolId => {
                      const t = CREATIVE_TOOLS.find(c => c.id === toolId);
                      if (!t) return null;
                      return (
                        <div key={toolId} className="profile-v2__tool-pill" title={t.name}>
                          <img src={t.iconPath} alt={t.name} className="profile-v2__tool-icon" />
                          <span>{t.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>

            {/* Details sidebar */}
            <div className="profile-v2__about-sidebar">
              <h3 className="profile-v2__about-label">Details</h3>
              <div className="profile-v2__details-list">
                {profile.website && (
                  <div className="profile-v2__detail-item">
                    <Globe size={15} className="profile-v2__detail-icon" />
                    <div>
                      <div className="profile-v2__detail-key">Website</div>
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" className="profile-v2__detail-link">
                        {profile.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  </div>
                )}
                {profile.location && (
                  <div className="profile-v2__detail-item">
                    <MapPin size={15} className="profile-v2__detail-icon" />
                    <div>
                      <div className="profile-v2__detail-key">Location</div>
                      <span className="profile-v2__detail-val">{profile.location}</span>
                    </div>
                  </div>
                )}
                <div className="profile-v2__detail-item">
                  <Calendar size={15} className="profile-v2__detail-icon" />
                  <div>
                    <div className="profile-v2__detail-key">Member Since</div>
                    <span className="profile-v2__detail-val">
                      {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
