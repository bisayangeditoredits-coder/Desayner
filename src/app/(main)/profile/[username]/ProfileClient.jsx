'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import ProjectCard from '@/components/projects/ProjectCard';
import FollowButton from '@/components/ui/FollowButton';
import UserAvatar from '@/components/ui/UserAvatar';
import Link from 'next/link';
import { Globe, MapPin, Calendar, MessageSquare, ExternalLink, Folder, ArrowLeft, RefreshCw } from 'lucide-react';
import { CREATIVE_TOOLS } from '@/lib/constants';
import { stripCloudinaryProxy } from '@/lib/utils';
import ProfileCompletenessCard from '@/components/profile/ProfileCompletenessCard';
import EmptyState from '@/components/ui/EmptyState';
import FirstProjectCelebration from '@/components/onboarding/FirstProjectCelebration';
import HireMeModal from '@/components/profile/HireMeModal';
import { Suspense } from 'react';
import '../../../App.css';

const PROFILE_PAGE_SIZE = 50;

/** Prominent Contact button that triggers modal */
function HireMeButton({ profile, onClick }) {
  if (!profile?.available_for_work && !profile?.public_email && !profile?.website) return null;

  return (
    <button
      onClick={onClick}
      className="profile-pill-btn"
      style={{ 
        cursor: 'pointer', 
        background: '#2d43e8', 
        color: 'white', 
        borderColor: '#2d43e8',
        boxShadow: '0 4px 14px rgba(45, 67, 232, 0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        border: 'none',
        outline: 'none',
        fontFamily: 'inherit',
        fontWeight: 700,
        fontSize: '0.85rem'
      }}
    >
      <MessageSquare size={13} />
      Hire Me
    </button>
  );
}

export default function ProfilePage() {
  const { username } = useParams();
  const [profile, setProfile]           = useState(null);
  const [projects, setProjects]         = useState([]);
  const [tab, setTab]                   = useState('projects');
  const [currentUser, setCurrentUser]   = useState(null);
  const [isFollowing, setIsFollowing]   = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading]           = useState(true);
  const [loadingMoreProjects, setLoadingMoreProjects] = useState(false);
  const [hasMoreProjects, setHasMoreProjects] = useState(false);
  const [failedCoverSrc, setFailedCoverSrc] = useState(null);
  const [isHireModalOpen, setIsHireModalOpen] = useState(false);
  const [isCoverExpanded, setIsCoverExpanded] = useState(false);
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
      <div 
        className="profile-v2__cover"
        onClick={() => {
          if (coverSrc && failedCoverSrc !== coverSrc) {
            setIsCoverExpanded(true);
          }
        }}
        style={{ cursor: coverSrc && failedCoverSrc !== coverSrc ? 'zoom-in' : 'default' }}
      >
        {coverSrc && failedCoverSrc !== coverSrc ? (
          <img
            src={coverSrc}
            alt="Cover"
            className="profile-v2__cover-img"
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
                    <HireMeButton profile={profile} onClick={() => setIsHireModalOpen(true)} />
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
              onClick={() => { setTab('projects'); }}
            >
              Work
              <span className="profile-v2__tab-count">{profile.projects_count ?? projects.length}</span>
            </button>
            <button
              className={`profile-v2__tab-btn${tab === 'about' ? ' active' : ''}`}
              onClick={() => { setTab('about'); }}
            >
              About
            </button>
          </div>
        </div>
      </div>

      {/* ── Tab Contents ── */}
      <div className="profile-v2__content">

        {tab === 'projects' && (
          projects.length === 0 ? (
            <EmptyState
              icon={Folder}
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

      <HireMeModal 
        isOpen={isHireModalOpen}
        onClose={() => setIsHireModalOpen(false)}
        targetUserId={profile.id}
        targetUserName={profile.full_name || profile.username}
      />

      {isCoverExpanded && coverSrc && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            cursor: 'zoom-out',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)'
          }}
          onClick={() => setIsCoverExpanded(false)}
        >
          <button
            onClick={() => setIsCoverExpanded(false)}
            style={{
              position: 'absolute',
              top: '1.5rem',
              right: '1.5rem',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'white',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10000,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          <img 
            src={coverSrc} 
            alt="Cover Expanded" 
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              borderRadius: '8px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
              cursor: 'default'
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
