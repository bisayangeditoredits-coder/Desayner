'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import ProjectCard from '@/components/projects/ProjectCard';
import MasonryGrid from '@/components/layout/MasonryGrid';
import FollowButton from '@/components/ui/FollowButton';
import UserAvatar from '@/components/ui/UserAvatar';
import Link from 'next/link';
import { Globe, MapPin, Calendar, MessageSquare, ExternalLink, Folder, ArrowLeft, RefreshCw, ShoppingBag, ArrowUpRight, Share2, Eye, Heart } from 'lucide-react';
import { CREATIVE_TOOLS } from '@/lib/constants';
import { stripCloudinaryProxy, optimizeImage } from '@/lib/utils';
import ProfileCompletenessCard from '@/components/profile/ProfileCompletenessCard';
import EmptyState from '@/components/ui/EmptyState';
import FirstProjectCelebration from '@/components/onboarding/FirstProjectCelebration';
import dynamic from 'next/dynamic';
const HireMeModal = dynamic(() => import('@/components/profile/HireMeModal'), { ssr: false });
import { Suspense } from 'react';
import ShareProjectModal from '@/components/projects/ShareProjectModal';
import useToastStore from '@/store/useToastStore';
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

export default function ProfilePage({ initialProfile = null }) {
  const { username } = useParams();
  const [profile, setProfile]           = useState(initialProfile);
  const [projects, setProjects]         = useState([]);
  const [tab, setTab]                   = useState('projects');
  const [currentUser, setCurrentUser]   = useState(null);
  const [isFollowing, setIsFollowing]   = useState(false);
  const [followerCount, setFollowerCount] = useState(initialProfile?.followers_count || 0);
  const [loading, setLoading]           = useState(!initialProfile);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [loadingMoreProjects, setLoadingMoreProjects] = useState(false);
  const [hasMoreProjects, setHasMoreProjects] = useState(false);
  const [failedCoverSrc, setFailedCoverSrc] = useState(null);
  const [isHireModalOpen, setIsHireModalOpen] = useState(false);
  const [isCoverExpanded, setIsCoverExpanded] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const addToast = useToastStore((s) => s.addToast);

  useEffect(() => {
    async function load() {
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
        setProjectsLoading(false);
      }
    }
    load();
  }, [username, initialProfile, supabase]);

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
  const coverSrc = rawCoverSrc ? optimizeImage(rawCoverSrc, 1920) : null;

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

      <style>{`
        /* Asymmetric Split Profile Layout */
        .profile-split {
          max-width: 1500px;
          margin: 0 auto;
          padding: 1rem 2rem;
          display: grid;
          grid-template-columns: 1fr 1.35fr;
          gap: 6rem;
          align-items: center;
        }
        .profile-split__left {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        .profile-split__avatar {
          width: 90px;
          height: 90px;
          border-radius: 50%;
          margin-bottom: 1.5rem;
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
        }
        .profile-split__name {
          font-size: 2.2rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 0.5rem 0;
          line-height: 1.1;
          letter-spacing: -0.03em;
          font-family: inherit;
        }
        .profile-split__tab-count {
          background: #f1f5f9;
          color: #64748b;
          font-size: 0.75rem;
          padding: 2px 8px;
          border-radius: 999px;
          font-weight: 700;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .custom-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e0e7ff;
          border-top-color: #2d43e8;
          border-radius: 50%;
          animation: spin 0.8s ease-in-out infinite;
        }
        .profile-split__handle {
          font-size: 1rem;
          color: #64748b;
          font-weight: 500;
          margin: 0 0 2rem 0;
          font-family: inherit;
        }
        .profile-split__bio {
          font-size: 1.7rem;
          font-weight: 400;
          color: #0f172a;
          line-height: 1.3;
          margin: 0 0 2rem 0;
          letter-spacing: -0.01em;
          font-family: inherit;
        }
        .profile-split__bio-placeholder {
          font-size: 1.7rem;
          font-weight: 400;
          color: #0f172a;
          line-height: 1.3;
          margin: 0 0 2rem 0;
          letter-spacing: -0.01em;
          font-family: inherit;
        }
        .profile-split__stats {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 2rem;
          font-size: 0.95rem;
          color: #64748b;
        }
        .profile-split__stats span {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .profile-split__stats strong {
          color: #0f172a;
          font-weight: 800;
          font-size: 1.15rem;
        }
        .profile-split__actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .split-btn {
          padding: 0.7rem 1.5rem;
          border-radius: 999px;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s;
          text-decoration: none;
          border: none;
          font-family: inherit;
        }
        .split-btn--dark {
          background: #0f172a;
          color: white;
        }
        .split-btn--dark:hover {
          background: #1e293b;
        }
        .split-btn--outline {
          background: white;
          color: #0f172a;
          border: 1px solid #cbd5e1;
        }
        .split-btn--outline:hover {
          background: #f8fafc;
          border-color: #94a3b8;
        }
        .split-btn--icon {
          padding: 0.7rem;
          border-radius: 50%;
          border: 1px solid #cbd5e1;
          background: white;
          color: #0f172a;
        }
        .split-btn--icon:hover {
          background: #f8fafc;
          border-color: #94a3b8;
        }
        .profile-split__right {
          width: 100%;
        }
        .profile-split__showcase {
          width: 100%;
          aspect-ratio: 16/9;
          border-radius: 24px;
          background: linear-gradient(135deg, #e0e7ff, #f8fafc);
          overflow: hidden;
          box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .profile-split__showcase-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .profile-split__badge-float {
          position: absolute;
          bottom: 2rem;
          left: 2rem;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(8px);
          padding: 0.5rem 1rem;
          border-radius: 12px;
          font-weight: 800;
          font-size: 0.8rem;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 8px 16px rgba(0,0,0,0.1);
          font-family: inherit;
        }
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.15);
          animation: pulse-dot 2s infinite;
        }
        @media (max-width: 900px) {
          .profile-split {
            grid-template-columns: 1fr;
            padding: 2rem 1rem;
            gap: 2rem;
          }
          .profile-split__bio {
            font-size: 1.5rem;
          }
          .profile-split__showcase {
            aspect-ratio: 16/9;
          }
        }
      `}</style>
      <div className="profile-split">
        {/* Left Column: Identity & Typography */}
        <div className="profile-split__left">
          <div className="profile-split__avatar">
            <UserAvatar
              src={profile.avatar_url}
              name={profile.full_name || profile.username}
              size={90}
            />
          </div>

          <h1 className="profile-split__name">{profile.full_name || profile.username}</h1>
          <p className="profile-split__handle">@{profile.username}</p>

          {profile.bio ? (
            <p className="profile-split__bio">{profile.bio}</p>
          ) : (
            <p className="profile-split__bio-placeholder">Welcome to my creative space!</p>
          )}

          <div className="profile-split__stats">
            <span><strong>{followerCount.toLocaleString()}</strong> Followers</span>
            <span><strong>{(profile.following_count || 0).toLocaleString()}</strong> Following</span>
            <span><strong>{(profile.projects_count || projects.length).toLocaleString()}</strong> Projects</span>
            <span title="Total Project Views" style={{ marginLeft: '0.5rem', color: '#94a3b8' }}>
              <Eye size={16} /> <strong>{(profile.total_project_views || 0).toLocaleString()}</strong>
            </span>
            <span title="Total Project Likes" style={{ color: '#94a3b8' }}>
              <Heart size={16} /> <strong>{(profile.total_project_likes || 0).toLocaleString()}</strong>
            </span>
          </div>

          <div className="profile-split__actions">
            {isOwn ? (
              <Link href="/settings" className="split-btn split-btn--outline">
                Edit Profile
              </Link>
            ) : (
              <FollowButton
                targetUserId={profile.id}
                currentUserId={currentUser?.id}
                initialFollowing={isFollowing}
                compact={false}
              />
            )}
            
            {profile.calendly_link && (
              <a href={profile.calendly_link} target="_blank" rel="noopener noreferrer" className="split-btn" style={{ background: '#006BFF', color: 'white', border: 'none', boxShadow: '0 4px 14px 0 rgba(0,107,255,0.39)', transition: 'transform 0.2s, box-shadow 0.2s' }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,107,255,0.45)'; }} onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(0,107,255,0.39)'; }}>
                <Calendar size={15} /> Book Me
              </a>
            )}
            
            {profile.available_for_work && (
              <button onClick={() => setIsHireModalOpen(true)} className="split-btn split-btn--dark">
                <span className="status-dot"></span> Hire Me
              </button>
            )}

            {profile.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="split-btn split-btn--icon" title="Website">
                <Globe size={18} />
              </a>
            )}
            
            <button 
              onClick={() => setShowShareModal(true)} 
              className="split-btn split-btn--icon" 
              title="Share Profile"
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>

        {/* Right Column: Visual Showcase */}
        <div className="profile-split__right">
          <div className="profile-split__showcase">
            {coverSrc && failedCoverSrc !== coverSrc ? (
              <img
                src={coverSrc}
                alt="Showcase Cover"
                className="profile-split__showcase-img"
                onError={() => setFailedCoverSrc(coverSrc)}
              />
            ) : (
              <div style={{ color: '#94a3b8', fontWeight: 800, fontSize: '2rem', opacity: 0.5 }}>
                {profile.full_name || profile.username}
              </div>
            )}
            
            {profile.available_for_work && (
              <div className="profile-split__badge-float">
                <span className="status-dot"></span> Available for new inquiries
              </div>
            )}
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
          projectsLoading ? (
            <MasonryGrid isLoading={true} skeletonCount={6} />
          ) : projects.length === 0 ? (
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
              <MasonryGrid 
                items={projects} 
                currentUserId={currentUser?.id}
                renderItem={(project, onImageLoad) => (
                  <div key={project.id} className="projects-masonry__item">
                    <ProjectCard 
                      project={{...project, profiles: profile}} 
                      currentUserId={currentUser?.id} 
                      onImageLoad={onImageLoad}
                    />
                  </div>
                )}
              />
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

      {showShareModal && (
        <ShareProjectModal
          projectUrl={typeof window !== 'undefined' ? window.location.href : `https://desayner.com/profile/${profile.username}`}
          projectTitle={`${profile.full_name || profile.username}'s Profile on Desayner`}
          projectImage={profile.avatar_url}
          type="Profile"
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
