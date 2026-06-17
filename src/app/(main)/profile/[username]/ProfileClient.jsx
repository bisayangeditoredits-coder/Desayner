'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import ProjectCard from '@/components/ProjectCard';
import FollowButton from '@/components/FollowButton';
import UserAvatar from '@/components/UserAvatar';
import Link from 'next/link';
import Image from 'next/image';
import { Globe, MapPin, Calendar, MessageSquare, ExternalLink, Folder, ArrowLeft, RefreshCw } from 'lucide-react';
import { CREATIVE_TOOLS } from '@/lib/constants';
import { stripCloudinaryProxy } from '@/lib/utils';
import ProfileCompletenessCard from '@/components/ProfileCompletenessCard';
import EmptyState from '@/components/EmptyState';
import FirstProjectCelebration from '@/components/FirstProjectCelebration';
import { Suspense } from 'react';
import { FolderOpen } from 'lucide-react';
import '../../../App.css';

const PROFILE_PAGE_SIZE = 50;

/** Prominent Contact button that links externally */
function HireMeButton({ profile }) {
  // If they have no website, we don't show the Hire Me button
  // In a real app, you might use a mailto: link if they had a public email
  if (!profile?.website) return null;

  return (
    <a
      href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
      target="_blank"
      rel="noopener noreferrer"
      className="profile-pill-btn"
      style={{ 
        cursor: 'pointer', 
        background: '#2d43e8', 
        color: 'white', 
        borderColor: '#2d43e8',
        boxShadow: '0 4px 14px rgba(45, 67, 232, 0.3)',
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem'
      }}
    >
      <MessageSquare size={13} />
      Hire Me
    </a>
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
  const [loadingMoreProjects, setLoadingMoreProjects] = useState(false);
  const [hasMoreProjects, setHasMoreProjects] = useState(false);
  const [failedCoverSrc, setFailedCoverSrc] = useState(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setHasMoreProjects(false);
      try {
        const res = await fetch(
          `/api/profile/${encodeURIComponent(username)}?limit=${PROFILE_PAGE_SIZE}&offset=0`
        );
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
        setHasMoreProjects(data.hasMore || false);
        if (data.currentUser) setCurrentUser(data.currentUser);
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [username]);

  async function loadMoreProjects() {
    if (loadingMoreProjects || !hasMoreProjects) return;
    setLoadingMoreProjects(true);
    try {
      const res = await fetch(
        `/api/profile/${encodeURIComponent(username)}?limit=${PROFILE_PAGE_SIZE}&offset=${projects.length}`
      );
      if (!res.ok) throw new Error(`Failed to load more projects: ${res.status}`);
      const data = await res.json();
      if (data.projects?.length) {
        setProjects((prev) => [...prev, ...data.projects]);
      }
      setHasMoreProjects(data.hasMore || false);
    } catch (err) {
      console.error('Error loading more projects:', err);
    } finally {
      setLoadingMoreProjects(false);
    }
  }

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

  const rawCoverSrc = profile.cover_url || (projects.length > 0 ? projects[0].cover_url : null);
  const coverSrc = rawCoverSrc ? stripCloudinaryProxy(rawCoverSrc) : null;

  return (
    <div className="profile-v2">
      <Suspense fallback={null}>
        <FirstProjectCelebration username={isOwn ? profile.username : null} />
      </Suspense>

      {isOwn && (
        <div className="profile-v2__content" style={{ paddingBottom: 0 }}>
          <ProfileCompletenessCard profile={profile} />
        </div>
      )}

      {/* ── Cover Banner ── */}
      <div className="profile-v2__cover">
        {coverSrc && failedCoverSrc !== coverSrc ? (
          <Image
            src={coverSrc}
            alt="Cover"
            className="profile-v2__cover-img"
            fill
            sizes="100vw"
            style={{ objectFit: 'cover' }}
            onError={() => setFailedCoverSrc(coverSrc)}
          />
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
              {profile.available_for_work && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(34, 197, 94, 0.1)',
                  color: '#16a34a',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  border: '1px solid rgba(34, 197, 94, 0.2)'
                }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#22c55e',
                    boxShadow: '0 0 8px #22c55e'
                  }} />
                  Available for Work
                </span>
              )}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', maxWidth: '100%' }}>
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
                    {currentUser && <HireMeButton profile={profile} />}
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
                    <Globe size={14} style={{ flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>{profile.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
                    <ExternalLink size={11} style={{ opacity: 0.5, flexShrink: 0 }} />
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
              <span className="profile-v2__tab-count">{profile.projects_count ?? projects.length}</span>
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
            <EmptyState
              icon={FolderOpen}
              title={isOwn ? "You haven't published any projects yet" : `${profile.full_name || profile.username} hasn't shared work yet`}
              description={
                isOwn
                  ? 'Upload your best work to get discovered by clients and fellow designers.'
                  : 'Check back later — they may publish something soon.'
              }
              actionLabel={isOwn ? 'Create first project' : undefined}
              actionHref={isOwn ? '/projects/new' : undefined}
              secondaryLabel={isOwn ? 'Complete your profile' : undefined}
              secondaryHref={isOwn ? '/settings' : undefined}
            />
          ) : (
            <>
              <div className="projects-masonry">
                {projects.map(project => (
                  <ProjectCard key={project.id} project={project} currentUserId={currentUser?.id} />
                ))}
              </div>
              {hasMoreProjects && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
                  <button
                    type="button"
                    onClick={loadMoreProjects}
                    disabled={loadingMoreProjects}
                    className="btn btn-dark"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      opacity: loadingMoreProjects ? 0.7 : 1,
                      cursor: loadingMoreProjects ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <RefreshCw
                      size={14}
                      style={loadingMoreProjects ? { animation: 'spin 0.8s linear infinite' } : undefined}
                    />
                    {loadingMoreProjects ? 'Loading…' : 'Load more projects'}
                  </button>
                </div>
              )}
            </>
          )
        )}

        {/* Saved tab */}
        {tab === 'saved' && (
          selectedCollection ? (
            <div>
              <button 
                onClick={() => setSelectedCollection(null)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.9rem', marginBottom: '1.5rem', color: '#231f20' }}
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
                <Folder size={24} color="#231f20" />
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
                  <Folder size={24} color="#231f20" />
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

              {/* Skills */}
              {profile.skills && profile.skills.length > 0 && (
                <section className="profile-v2__about-section">
                  <h3 className="profile-v2__about-label">Skills & Specialties</h3>
                  <div className="profile-v2__tools-list">
                    {profile.skills.map((skill) => (
                      <span key={skill} className="profile-v2__tool-pill">{skill}</span>
                    ))}
                  </div>
                </section>
              )}

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
