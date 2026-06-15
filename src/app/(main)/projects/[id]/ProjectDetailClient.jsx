'use client';
import { useState, useEffect, useCallback, useMemo} from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import CommentThread from '@/components/CommentThread';
import FollowButton from '@/components/FollowButton';
import UserAvatar from '@/components/UserAvatar';
import SaveToCollectionModal from '@/components/SaveToCollectionModal';
import Link from 'next/link';
import { Heart, Bookmark, ArrowLeft, Globe, Eye, MessageCircle, Calendar, Share, Edit, Check, Trash2, MessageSquare } from 'lucide-react';
import { CREATIVE_TOOLS } from '@/lib/constants';
import { stripCloudinaryProxy } from '@/lib/utils';
import '../../../App.css';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}



// ─── Sub-components ──────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <>
        <div className="project-detail__loading">Loading project...</div>
    </>
  );
}

function NotFoundState() {
  return (
    <>
        <div className="project-detail__not-found">
          <p className="project-detail__not-found-title">Project not found</p>
          <Link href="/projects" className="project-detail__not-found-link">
            ← Back to Projects
          </Link>
        </div>
    </>
  );
}

function ImageGallery({ images, title }) {
  const [lightbox, setLightbox] = useState(null);

  if (!images.length) return null;

  return (
    <>
      <div className="project-detail__gallery">
        {images.map((img, i) => (
          <button
            key={i}
            className="project-detail__gallery-item"
            onClick={() => setLightbox(i)}
          >
            <img src={img} alt={`${title} — image ${i + 1}`} />
          </button>
        ))}
      </div>

      {lightbox !== null && (
        <div
          className="lightbox"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
        >
          <button className="lightbox__close" onClick={() => setLightbox(null)}>✕</button>
          <button
            className="lightbox__nav lightbox__nav--prev"
            onClick={e => { e.stopPropagation(); setLightbox(i => Math.max(0, i - 1)); }}
            disabled={lightbox === 0}
          >‹</button>
          <img
            src={images[lightbox]}
            alt={`${title} — image ${lightbox + 1}`}
            className="lightbox__img"
            onClick={e => e.stopPropagation()}
          />
          <button
            className="lightbox__nav lightbox__nav--next"
            onClick={e => { e.stopPropagation(); setLightbox(i => Math.min(images.length - 1, i + 1)); }}
            disabled={lightbox === images.length - 1}
          >›</button>
          <p className="lightbox__counter">{lightbox + 1} / {images.length}</p>
        </div>
      )}
    </>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function ProjectDetailClient({ isModal = false }) {
  const { id } = useParams();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [project,        setProject]        = useState(null);
  const [comments,       setComments]       = useState([]);
  const [currentUser,    setCurrentUser]    = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [liked,          setLiked]          = useState(false);
  const [showColModal,   setShowColModal]   = useState(false);
  const [likeCount,      setLikeCount]      = useState(0);
  const [isFollowing,    setIsFollowing]    = useState(false);
  const [loading,        setLoading]        = useState(true);
  const [shareToast,     setShareToast]     = useState(false);
  const [isDeleting,     setIsDeleting]     = useState(false);
  const [showDeleteModal,setShowDeleteModal] = useState(false);

  const load = useCallback(async () => {
    // Run user auth + project fetch + comments in parallel
    const [authResult, projResult, commsResult] = await Promise.all([
      supabase.auth.getUser(),
      supabase
        .from('projects')
        .select(`
          *,
          profiles!projects_user_id_fkey(
            id, username, full_name, avatar_url,
            bio, followers_count, projects_count, website
          )
        `)
        .eq('id', id)
        .single(),
      supabase
        .from('project_comments')
        .select('*, profiles(username, full_name, avatar_url)')
        .eq('project_id', id)
        .order('created_at', { ascending: true }),
    ]);

    const user = authResult.data?.user || null;

    // Set user + profile in parallel
    if (user) {
      setCurrentUser(user);
      // Fetch profile without blocking — fire and forget from UI perspective
      supabase
        .from('profiles').select('*').eq('id', user.id).single()
        .then(({ data: profile }) => { if (profile) setCurrentProfile(profile); });
    }

    const proj = projResult.data;
    if (!proj) { setLoading(false); return; }
    setProject(proj);
    setLikeCount(proj.likes_count || 0);

    setComments(commsResult.data || []);

    // Fetch interaction state only if user is logged in
    if (user) {
      const [likeRes, followRes] = await Promise.all([
        supabase.from('project_likes').select('user_id')
          .eq('user_id', user.id).eq('project_id', id).maybeSingle(),
        supabase.from('follows').select('follower_id')
          .eq('follower_id', user.id).eq('following_id', proj.profiles?.id).maybeSingle(),
      ]);
      if (likeRes.data) setLiked(true);
      setIsFollowing(!!followRes.data);
    }
    
    // Track view — fire and forget, don't block render
    fetch('/api/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: id })
    }).catch(err => console.error('View track failed', err));

    setLoading(false);
  }, [id]);

  useEffect(() => {
    async function init() { await load(); }
    init();
  }, [load]);

  function goBack() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/projects');
    }
  }

  async function toggleLike() {
    if (!currentUser) {
      router.push('/login?redirectTo=' + encodeURIComponent(window.location.pathname + window.location.search));
      return;
    }
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount(c => wasLiked ? c - 1 : c + 1);
    if (wasLiked) {
      await supabase.from('project_likes').delete()
        .eq('user_id', currentUser.id).eq('project_id', id);
    } else {
      await supabase.from('project_likes').insert({ user_id: currentUser.id, project_id: id });
    }
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href);
    setShareToast(true);
    setTimeout(() => setShareToast(false), 2000);
  }

  async function confirmDelete() {
    try {
      setIsDeleting(true);
      
      // Call the server API to delete the project AND clear the Redis profile cache
      const res = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
        
      if (!res.ok || data.error) {
        alert('Failed to delete project: ' + (data.error || 'Unknown error'));
        setIsDeleting(false);
        setShowDeleteModal(false);
        return;
      }
      
      // Go back to the owner's profile after deletion with hard navigation to clear state
      const username = currentProfile?.username;
      window.location.href = username ? `/profile/${username}` : '/projects';
    } catch (err) {
      console.error('Delete error:', err);
      alert('An unexpected error occurred: ' + err.message);
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  }

  if (loading) return <LoadingState />;
  if (!project) return <NotFoundState />;

  const author = project.profiles;
  const rawAllImages = [
    ...(project.cover_url ? [project.cover_url] : []),
    ...(project.images || []).filter(img => img !== project.cover_url),
  ];
  const allImages = rawAllImages.map(stripCloudinaryProxy);
  const profileHref = author?.username ? `/profile/${author.username}` : '#';

  function goToAuthorProfile(e) {
    if (!author?.username) {
      e.preventDefault();
      return;
    }
    // Next.js App Router has a bug where soft-navigating out of an intercepted modal
    // sometimes fails to unmount the modal. Hard navigation guarantees it works.
    e.preventDefault();
    window.location.href = profileHref;
  }

  return (
    <>

        {/* Back bar */}
        <div className="project-detail__topbar" style={isModal ? { position: 'static', borderBottom: 'none' } : {}}>
          {!isModal ? (
            <button onClick={goBack} className="project-detail__back" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
              <ArrowLeft size={14} /> Back to Projects
            </button>
          ) : <div />}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
            {currentUser?.id === project.user_id && (
              <>
                <button 
                  onClick={() => setShowDeleteModal(true)}
                  disabled={isDeleting}
                  className="btn btn-danger project-detail__topbar-btn"
                  style={{ background: '#fef2f2', color: '#ef4444', borderColor: '#fee2e2' }}
                  title="Delete"
                >
                  <Trash2 size={14} /> 
                  <span className="btn-text-responsive">{isDeleting ? 'Deleting...' : 'Delete'}</span>
                </button>
                <button
                  onClick={() => window.location.href = `/projects/${id}/edit`}
                  className="btn btn-dark project-detail__topbar-btn"
                  title="Edit Project"
                  style={{ background: '#231f20', color: 'white', border: '1px solid #231f20', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.85rem', padding: '0.5rem 1rem', fontFamily: 'inherit' }}
                >
                  <Edit size={14} /> 
                  <span className="btn-text-responsive">Edit Project</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Two-column layout */}
        <div className="project-detail__body" style={{ marginTop: '0' }}>

          {/* ── LEFT: content ─────────────────────────── */}
          <article className="project-detail__main" style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>

            {/* Minimal Header (Dribbble Style) perfectly aligned with image */}
            <div style={{ paddingBottom: '1.5rem' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '1.25rem', fontFamily: '"Inter", "Segoe UI", sans-serif' }}>
                {project.title}
              </h1>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                {/* Author Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <a href={profileHref} onClick={goToAuthorProfile} style={{ textDecoration: 'none' }}>
                    <UserAvatar src={author?.avatar_url} name={author?.full_name || author?.username} size={44} />
                  </a>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    <a href={profileHref} onClick={goToAuthorProfile} style={{ textDecoration: 'none', color: '#0f172a', fontWeight: 700, fontSize: '0.9rem', fontFamily: '"Inter", "Segoe UI", sans-serif' }}>
                      {author?.full_name || author?.username || 'Designer'}
                    </a>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontFamily: '"Inter", "Segoe UI", sans-serif' }}>
                      <span style={{ color: '#10b981', fontWeight: 600 }}>Available for work</span>
                      <span style={{ color: '#cbd5e1' }}>•</span>
                      <FollowButton targetUserId={author?.id} initialIsFollowing={isFollowing} variant="text" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Full-width image gallery */}
            <ImageGallery images={allImages} title={project.title} />

            {/* Description */}
            {project.description && (
              <section className="project-detail__description">
                <h2 className="project-detail__section-label">About this project</h2>
                <p className="project-detail__desc-text">{project.description}</p>
              </section>
            )}

            {/* Tags & Tools */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem', marginBottom: '2rem' }}>
              {project.tools?.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#6b6b6b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Tools Used</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {project.tools.map(toolId => {
                      const t = CREATIVE_TOOLS.find(c => c.id === toolId);
                      if (!t) return null;
                      return (
                        <div key={toolId} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.75rem', background: '#f5f5f5', border: '1px solid #e8e8e8', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, color: '#231f20' }} title={t.name}>
                          <img src={t.iconPath} alt={t.name} style={{ width: '14px', height: '14px', objectFit: 'contain' }} />
                          {t.name}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {project.tags?.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#6b6b6b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Tags</h3>
                  <div className="project-detail__tags" style={{ margin: 0 }}>
                    {project.tags.map(tag => (
                      <span key={tag} className="project-detail__tag">#{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Comments */}
            <section className="project-detail__comments">
              <h2 className="project-detail__section-label">
                Comments <span className="project-detail__section-count">({comments.length})</span>
              </h2>
              <CommentThread
                targetId={id}
                targetType="project"
                comments={comments}
                currentUser={currentProfile}
              />
            </section>
          </article>

          {/* ── RIGHT: sidebar ────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: '100px' }}>
            
            {/* Action Buttons Aligned with Sidebar */}
            <div className="desktop-actions" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <button onClick={toggleLike} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid #e2e8f0', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: liked ? '#ef4444' : '#64748b', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
              </button>
              <button onClick={() => { if (!currentUser) { router.push('/login?redirectTo=' + encodeURIComponent(window.location.pathname)); } else { setShowColModal(true); } }} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid #e2e8f0', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <Bookmark size={18} />
              </button>
              <button onClick={handleShare} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid #e2e8f0', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                {shareToast ? <Check size={18} color="#1a8a3b" /> : <Share size={18} />}
              </button>
              {author?.website && (
                <a href={author.website.startsWith('http') ? author.website : `https://${author.website}`} target="_blank" rel="noopener noreferrer" style={{ padding: '0 1.5rem', height: '40px', borderRadius: '20px', border: 'none', background: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', marginLeft: '0.25rem', fontFamily: '"Inter", "Segoe UI", sans-serif' }}>
                  Get in touch
                </a>
              )}
            </div>

            <aside className="project-detail__sidebar" style={{ position: 'static', marginTop: 0 }}>

            <div className="project-detail__stats">
              <div className="project-detail__stat">
                <Heart size={13} />
                <span>{project.likes_count || 0} appreciations</span>
              </div>
              <div className="project-detail__stat">
                <Bookmark size={13} />
                <span>{project.saves_count || 0} saves</span>
              </div>
              <div className="project-detail__stat">
                <MessageCircle size={13} />
                <span>{comments.length} comments</span>
              </div>
              <div className="project-detail__stat">
                <Calendar size={13} />
                <span>{formatDate(project.created_at)}</span>
              </div>
            </div>

            {/* Author card */}
            <div className="project-detail__author-card">
              <Link
                href={profileHref}
                className="project-detail__author-avatar-link"
                onClick={goToAuthorProfile}
              >
                <UserAvatar
                  src={author?.avatar_url}
                  name={author?.full_name || author?.username}
                  size={56}
                />
              </Link>
              <Link
                href={profileHref}
                className="project-detail__author-name"
                onClick={goToAuthorProfile}
              >
                {author?.full_name || author?.username}
              </Link>
              <span className="project-detail__author-handle">@{author?.username}</span>

              {author?.bio && (
                <p className="project-detail__author-bio">{author.bio}</p>
              )}

              <div className="project-detail__author-meta">
                <span><strong>{author?.projects_count || 0}</strong> projects</span>
                <span><strong>{author?.followers_count || 0}</strong> followers</span>
              </div>

              {author?.website && (
                <a
                  href={author.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="project-detail__author-website"
                >
                  <Globe size={13} /> {author.website.replace(/^https?:\/\//, '')}
                </a>
              )}

              <FollowButton
                targetUserId={author?.id}
                currentUserId={currentUser?.id}
                initialFollowing={isFollowing}
              />

              {/* Contact Creator — only shown if viewing someone else's project */}
              {currentUser && currentUser.id !== project.user_id && author?.website && (
                <a
                  href={author.website.startsWith('http') ? author.website : `https://${author.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="project-detail__action-btn"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    marginTop: '0.5rem',
                    background: '#2d43e8',
                    color: 'white',
                    borderColor: '#2d43e8',
                    textDecoration: 'none'
                  }}
                >
                  <MessageSquare size={16} />
                  <span>Contact Creator</span>
                </a>
              )}
            </div>

          </aside>
        </div>
      </div>
      {showDeleteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', maxWidth: '400px', width: '90%' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Delete Project?</h3>
            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Are you sure you want to delete this project? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowDeleteModal(false)} style={{ padding: '0.5rem 1rem', background: '#f5f5f5', color: '#231f20', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={confirmDelete} disabled={isDeleting} style={{ padding: '0.5rem 1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: isDeleting ? 'not-allowed' : 'pointer' }}>{isDeleting ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}

      {showColModal && (
        <SaveToCollectionModal
          itemType="project"
          itemId={id}
          onClose={() => setShowColModal(false)}
        />
      )}

      {/* Mobile Fixed Action Bar (CSS handles visibility) */}
      <style>{`
        .mobile-actions { display: none !important; }
        @media (max-width: 768px) {
          .mobile-actions { display: flex !important; }
          .desktop-actions-left { display: none !important; }
        }
      `}</style>
      <div className="mobile-actions">
        <button onClick={toggleLike} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', background: 'none', border: 'none', cursor: 'pointer', color: liked ? '#ef4444' : '#64748b', fontWeight: 600, fontSize: '0.7rem' }}>
          <Heart size={22} fill={liked ? 'currentColor' : 'none'} />
          <span>{project?.likes_count || 0}</span>
        </button>
        <button onClick={() => { if (!currentUser) { router.push('/login?redirectTo=' + encodeURIComponent(window.location.pathname)); } else { setShowColModal(true); } }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontWeight: 600, fontSize: '0.7rem' }}>
          <Bookmark size={22} />
          <span>Save</span>
        </button>
        <button onClick={handleShare} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontWeight: 600, fontSize: '0.7rem' }}>
          {shareToast ? <Check size={22} color="#1a8a3b" /> : <Share size={22} />}
          <span>Share</span>
        </button>
        {author?.website && (
          <a href={author.website.startsWith('http') ? author.website : `https://${author.website}`} target="_blank" rel="noopener noreferrer" style={{ padding: '0 1.2rem', height: '38px', borderRadius: '20px', border: 'none', background: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none', fontFamily: '"Inter", "Segoe UI", sans-serif' }}>
            Contact
          </a>
        )}
      </div>
    </>
  );
}
