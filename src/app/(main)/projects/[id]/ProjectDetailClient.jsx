'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import CommentThread from '@/components/CommentThread';
import FollowButton from '@/components/FollowButton';
import UserAvatar from '@/components/UserAvatar';
import SaveToCollectionModal from '@/components/SaveToCollectionModal';
import Link from 'next/link';
import { Heart, Bookmark, ArrowLeft, Globe, Eye, MessageCircle, Calendar, Share, Edit, Check, Trash2, MessageSquare } from 'lucide-react';
import { CREATIVE_TOOLS } from '@/lib/constants';
import '../../../App.css';

// ─── Helpers ────────────────────────────────────────────────────────────────

function stripCloudinaryProxy(url) {
  if (!url) return url;
  if (typeof url === 'string' && url.includes('res.cloudinary.com') && url.includes('/fetch/')) {
    const match = url.match(/(https?%3A%2F%2F.*|https?:\/\/.*)$/i);
    if (match) {
      try {
        return decodeURIComponent(match[1]);
      } catch (e) {
        return url;
      }
    }
  }
  return url;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

/** Contact Creator button — starts a DM from the project page */
function ContactButton({ authorId, router }) {
  const [loading, setLoading] = useState(false);

  async function startChat() {
    if (!authorId) return;
    setLoading(true);
    try {
      const res = await fetch('/api/conversations/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: authorId }),
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
      className="project-detail__action-btn"
      style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
    >
      <MessageSquare size={16} />
      <span>{loading ? 'Opening…' : 'Contact Creator'}</span>
    </button>
  );
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
  const supabase = createClient();

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
    // 1. Fetch current user
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUser(user);
      const { data: profile } = await supabase
        .from('profiles').select('*').eq('id', user.id).single();
      if (profile) setCurrentProfile(profile);
    }

    // 2. Fetch project with author profile
    const { data: proj } = await supabase
      .from('projects')
      .select(`
        *,
        profiles!projects_user_id_fkey(
          id, username, full_name, avatar_url,
          bio, followers_count, projects_count, website
        )
      `)
      .eq('id', id)
      .single();

    if (!proj) { setLoading(false); return; }
    setProject(proj);
    setLikeCount(proj.likes_count || 0);

    // 3. Fetch comments
    const { data: comms } = await supabase
      .from('project_comments')
      .select('*, profiles(username, full_name, avatar_url)')
      .eq('project_id', id)
      .order('created_at', { ascending: true });
    setComments(comms || []);

    // 4. Fetch interaction state for logged-in user
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
    
    // 5. Track view
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

  async function toggleLike() {
    if (!currentUser) {
      router.push('/login?redirectTo=' + encodeURIComponent(window.location.pathname));
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
    setIsDeleting(true);
    const { error } = await supabase.from('projects').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) {
      alert('Failed to delete project: ' + error.message);
      setIsDeleting(false);
      setShowDeleteModal(false);
    } else {
      router.push('/projects');
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

  return (
    <>

        {/* Back bar */}
        <div className="project-detail__topbar" style={isModal ? { position: 'static', borderBottom: 'none' } : {}}>
          {!isModal ? (
            <button onClick={() => router.back()} className="project-detail__back" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
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
                <Link 
                  href={`/projects/${id}/edit`} 
                  className="btn btn-dark project-detail__topbar-btn"
                  title="Edit Project"
                >
                  <Edit size={14} /> 
                  <span className="btn-text-responsive">Edit Project</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Two-column layout */}
        <div className="project-detail__body" style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 1rem' }}>

          {/* ── LEFT: content ─────────────────────────── */}
          <article className="project-detail__main">
            {/* Title block */}
            <header className="project-detail__header">
              {project.category && (
                <span className="project-detail__category">{project.category}</span>
              )}
              <h1 className="project-detail__title">{project.title}</h1>
            </header>

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
                        <div key={toolId} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.75rem', background: '#f5f5f5', border: '1px solid #e8e8e8', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, color: '#0a0a0a' }} title={t.name}>
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
          <aside className="project-detail__sidebar" style={{ position: 'sticky', top: '100px' }}>

            {/* Action buttons */}
            <div className="project-detail__actions">
              <button
                onClick={toggleLike}
                className={`project-detail__action-btn ${liked ? 'project-detail__action-btn--active-red' : ''}`}
              >
                <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
                <span>{liked ? 'Liked' : 'Like'}</span>
                {likeCount > 0 && <span className="project-detail__action-count">{likeCount}</span>}
              </button>

              <button
                onClick={() => {
                  if (!currentUser) {
                    router.push('/login?redirectTo=' + encodeURIComponent(window.location.pathname));
                  } else {
                    setShowColModal(true);
                  }
                }}
                className="project-detail__action-btn"
              >
                <Bookmark size={16} />
                <span>Save</span>
              </button>

              <button
                onClick={handleShare}
                className="project-detail__action-btn"
              >
                {shareToast ? <Check size={16} color="#1a8a3b" /> : <Share size={16} />}
                <span style={shareToast ? { color: '#1a8a3b', fontWeight: 600 } : {}}>{shareToast ? 'Link Copied!' : 'Share'}</span>
              </button>

              {project.external_link && (
                <a
                  href={project.external_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="project-detail__action-btn"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <Globe size={16} />
                  <span>Visit Project</span>
                </a>
              )}
            </div>

            {/* Stats */}
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
                href={`/profile/${author?.username}`}
                className="project-detail__author-avatar-link"
                onClick={(e) => {
                  e.preventDefault();
                  if (isModal) {
                    router.back();
                    setTimeout(() => {
                      router.push(`/profile/${author?.username}`);
                    }, 50);
                  } else {
                    router.push(`/profile/${author?.username}`);
                  }
                }}
              >
                <UserAvatar
                  src={author?.avatar_url}
                  name={author?.full_name || author?.username}
                  size={56}
                />
              </Link>
              <Link
                href={`/profile/${author?.username}`}
                className="project-detail__author-name"
                onClick={(e) => {
                  e.preventDefault();
                  if (isModal) {
                    router.back();
                    setTimeout(() => {
                      router.push(`/profile/${author?.username}`);
                    }, 50);
                  } else {
                    router.push(`/profile/${author?.username}`);
                  }
                }}
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
              {currentUser && currentUser.id !== project.user_id && (
                <ContactButton authorId={author?.id} router={router} />
              )}
            </div>

          </aside>
        </div>
      {showDeleteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', maxWidth: '400px', width: '90%' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Delete Project?</h3>
            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Are you sure you want to delete this project? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowDeleteModal(false)} style={{ padding: '0.5rem 1rem', background: '#f5f5f5', color: '#0a0a0a', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
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
    </>
  );
}
