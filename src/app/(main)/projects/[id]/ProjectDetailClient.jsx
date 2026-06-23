'use client';
import { useState, useEffect, useCallback, useMemo} from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import CommentThread from '@/components/projects/CommentThread';
import FollowButton from '@/components/ui/FollowButton';
import UserAvatar from '@/components/ui/UserAvatar';
import SaveToCollectionModal from '@/components/projects/SaveToCollectionModal';
import ShareProjectModal from '@/components/projects/ShareProjectModal';
import ImageGallery from '@/components/projects/ImageGallery';
import ProjectSidebar from '@/components/projects/ProjectSidebar';
import Link from 'next/link';
import { Heart, Bookmark, ArrowLeft, Globe, Eye, MessageCircle, Calendar, Share, Edit, Check, Trash2, MessageSquare } from 'lucide-react';
import { CREATIVE_TOOLS } from '@/lib/constants';
import { stripCloudinaryProxy } from '@/lib/utils';
import useProfileStore from '@/store/useProfileStore';
import useToastStore from '@/store/useToastStore';
import '../../../App.css';

const PROJECT_DETAIL_SELECT = `
  id, title, cover_url, thumbnail_url, images, description, tools, tags,
  likes_count, saves_count, views_count, created_at, user_id, published,
  profiles!projects_user_id_fkey(
    id, username, full_name, avatar_url,
    bio, followers_count, projects_count, website
  )
`;

const COMMENT_SELECT = 'id, content, created_at, user_id, project_id, profiles(username, full_name, avatar_url)';
const COMMENTS_PAGE_SIZE = 20;

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

// ─── Main page ───────────────────────────────────────────────────────────────

export default function ProjectDetailClient({ initialProject = null, isModal = false, projectId = null }) {
  const params = useParams();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [currentId,      setCurrentId]      = useState(projectId || params?.id);
  const [project,        setProject]        = useState(initialProject);
  const [moreByAuthor,   setMoreByAuthor]   = useState([]);
  const [comments,       setComments]       = useState([]);
  const [commentCount,   setCommentCount]   = useState(0);
  const [commentsHasMore,setCommentsHasMore] = useState(false);
  const [loadingComments,setLoadingComments] = useState(false);
  const currentUser = useProfileStore((s) => s.user);
  const currentProfile = useProfileStore((s) => s.profile);
  const addToast = useToastStore((s) => s.addToast);
  const [liked,          setLiked]          = useState(false);
  const [showColModal,   setShowColModal]   = useState(false);
  const [likeCount,      setLikeCount]      = useState(initialProject?.likes_count || 0);
  const [isFollowing,    setIsFollowing]    = useState(false);
  const [loading,        setLoading]        = useState(!initialProject);
  const [shareToast,     setShareToast]     = useState(false);
  const [isDeleting,     setIsDeleting]     = useState(false);
  const [showDeleteModal,setShowDeleteModal] = useState(false);
  const [showShareModal, setShowShareModal]  = useState(false);

  const load = useCallback(async () => {
    if (!currentId) return;

    const tasks = [
      supabase.auth.getUser(),
      supabase
        .from('project_comments')
        .select(COMMENT_SELECT, { count: 'exact' })
        .eq('project_id', currentId)
        .order('created_at', { ascending: true })
        .range(0, COMMENTS_PAGE_SIZE - 1),
    ];
    
    if (!initialProject || project?.id !== currentId) {
      tasks.push(
        supabase
          .from('projects')
          .select(PROJECT_DETAIL_SELECT)
          .eq('id', currentId)
          .single()
      );
    }

    const results = await Promise.all(tasks);
    const authResult = results[0];
    const commsResult = results[1];
    const projResult = (initialProject && initialProject.id === currentId) ? { data: initialProject } : results[2];

    const user = authResult.data?.user || null;

    const proj = projResult.data;
    if (!proj) { setLoading(false); return; }
    if (!initialProject || project?.id !== currentId) {
      setProject(proj);
      setLikeCount(proj.likes_count || 0);
    }

    setComments(commsResult.data || []);
    setCommentCount(commsResult.count || commsResult.data?.length || 0);
    setCommentsHasMore((commsResult.count || 0) > COMMENTS_PAGE_SIZE);

    if (user) {
      const [likeRes, followRes] = await Promise.all([
        supabase.from('project_likes').select('user_id')
          .eq('user_id', user.id).eq('project_id', currentId).maybeSingle(),
        supabase.from('follows').select('follower_id')
          .eq('follower_id', user.id).eq('following_id', proj.profiles?.id).maybeSingle(),
      ]);
      if (likeRes.data) setLiked(true);
      setIsFollowing(!!followRes.data);
    }

    fetch('/api/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: currentId }),
    }).catch((err) => console.error('View track failed', err));

    if (proj?.user_id) {
      supabase
        .from('projects')
        .select('id, title, cover_url, thumbnail_url, likes_count, views_count')
        .eq('user_id', proj.user_id)
        .neq('id', currentId)
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(4)
        .then(({ data }) => setMoreByAuthor(data || []));
    }

    setLoading(false);
  }, [currentId, supabase, initialProject, project?.id]);

  const loadMoreComments = useCallback(async () => {
    if (loadingComments || !commentsHasMore) return;
    setLoadingComments(true);
    const offset = comments.length;
    const { data, error } = await supabase
      .from('project_comments')
      .select(COMMENT_SELECT)
      .eq('project_id', currentId)
      .order('created_at', { ascending: true })
      .range(offset, offset + COMMENTS_PAGE_SIZE - 1);

    if (!error && data?.length) {
      setComments((prev) => [...prev, ...data]);
      setCommentsHasMore(data.length === COMMENTS_PAGE_SIZE);
    } else {
      setCommentsHasMore(false);
    }
    setLoadingComments(false);
  }, [comments.length, commentsHasMore, currentId, loadingComments, supabase]);

  useEffect(() => {
    async function init() { await load(); }
    init();
  }, [load]);

  // Handle in-place navigation for modal
  function navigateToProject(newId) {
    if (newId === currentId) return;
    
    // Update Next.js router properly so it knows we changed URLs
    router.push(`/projects/${newId}`, { scroll: false });
    
    setProject(null);
    setComments([]);
    setCommentCount(0);
    setLoading(true);
    setLiked(false);
    setCurrentId(newId);
    
    // Scroll to top
    const modalContent = document.querySelector('.modal-content > div');
    if (modalContent) modalContent.scrollTo({ top: 0, behavior: 'smooth' });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  }

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
    setLikeCount((c) => (wasLiked ? c - 1 : c + 1));
    try {
      if (wasLiked) {
        const { error } = await supabase.from('project_likes').delete()
          .eq('user_id', currentUser.id).eq('project_id', currentId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('project_likes').insert({ user_id: currentUser.id, project_id: currentId });
        if (error) throw error;
      }
    } catch (err) {
      console.error('Like failed', err);
      setLiked(wasLiked);
      setLikeCount((c) => (wasLiked ? c + 1 : c - 1));
      addToast({ type: 'error', message: 'Could not update like. Please try again.' });
    }
  }

  function handleShare() {
    setShowShareModal(true);
  }

  async function confirmDelete() {
    try {
      setIsDeleting(true);
      
      // Call the server API to delete the project AND clear the Redis profile cache
      const res = await fetch(`/api/projects/${currentId}`, {
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
  const profileHref = author?.username ? `/profile/${author.username}?source=project` : '#';

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

        {/* Two-column layout */}
        <div className="project-detail__body" style={{ marginTop: '0', paddingTop: isModal ? '2rem' : '1rem' }}>

          {/* ── LEFT: content ─────────────────────────── */}
          <article className="project-detail__main" style={{ width: '100%', minWidth: 0 }}>

            {/* Minimal Header (Dribbble Style) perfectly aligned with image */}
            <div style={{ paddingBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '1.25rem', fontFamily: '"Inter", "Segoe UI", sans-serif' }}>
                  {project.title}
                </h1>
                
                {currentUser?.id === project.user_id && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => setShowDeleteModal(true)}
                      disabled={isDeleting}
                      className="btn btn-danger"
                      style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2', borderRadius: '8px', padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
                    >
                      <Trash2 size={14} /> 
                      <span className="btn-text-responsive">{isDeleting ? 'Deleting...' : 'Delete'}</span>
                    </button>
                    <button
                      onClick={() => window.location.href = `/projects/${currentId}/edit`}
                      className="btn btn-dark"
                      style={{ background: '#231f20', color: 'white', border: '1px solid #231f20', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.85rem', padding: '0.5rem 1rem', fontFamily: 'inherit' }}
                    >
                      <Edit size={14} /> 
                      <span className="btn-text-responsive">Edit</span>
                    </button>
                  </div>
                )}
              </div>
              
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
                <div className="project-detail__desc-text" dangerouslySetInnerHTML={{ __html: project.description }} />
              </section>
            )}

            {/* Comments */}
            <div className="project-detail__comments">
              <h3 className="project-detail__comments-title">
                Comments <span className="project-detail__comments-count">({commentCount})</span>
              </h3>
              <div className="project-detail__comments-list">
                {comments.map((comment) => (
                  <CommentThread
                    key={comment.id}
                    comment={comment}
                    currentUserId={currentUser?.id}
                    onDelete={(id) => {
                      setComments(prev => prev.filter(c => c.id !== id));
                      setCommentCount(c => c - 1);
                    }}
                  />
                ))}
              </div>
              {commentsHasMore && (
                <button
                  className="project-detail__load-comments"
                  onClick={loadMoreComments}
                  disabled={loadingComments}
                >
                  {loadingComments ? 'Loading...' : 'Load older comments'}
                </button>
              )}
            </div>
          </article>

          <ProjectSidebar 
            project={project}
            author={author}
            currentUser={currentUser}
            profileHref={profileHref}
            goToAuthorProfile={goToAuthorProfile}
            isFollowing={isFollowing}
            liked={liked}
            toggleLike={toggleLike}
            handleShare={handleShare}
            setShowColModal={setShowColModal}
            commentCount={commentCount}
            moreByAuthor={moreByAuthor}
            navigateToProject={navigateToProject}
            router={router}
          />
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
          itemId={currentId}
          onClose={() => setShowColModal(false)}
        />
      )}

      {showShareModal && (
        <ShareProjectModal
          projectUrl={typeof window !== 'undefined' ? window.location.href : `https://desayner.com/projects/${currentId}`}
          projectTitle={project?.title}
          projectImage={project?.cover_url}
          onClose={() => setShowShareModal(false)}
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
        <button onClick={toggleLike} className={liked ? 'anim-heart-pop' : ''} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', background: 'none', border: 'none', cursor: 'pointer', color: liked ? '#ef4444' : '#64748b', fontWeight: 600, fontSize: '0.7rem' }}>
          <Heart size={22} fill={liked ? 'currentColor' : 'none'} />
          <span>{project?.likes_count || 0}</span>
        </button>
        <button 
          onMouseDown={(e) => e.currentTarget.classList.add('anim-save-pop')}
          onAnimationEnd={(e) => e.currentTarget.classList.remove('anim-save-pop')}
          onClick={() => { if (!currentUser) { router.push('/login?redirectTo=' + encodeURIComponent(window.location.pathname)); } else { setShowColModal(true); } }} 
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontWeight: 600, fontSize: '0.7rem' }}
        >
          <Bookmark size={22} />
          <span>Save</span>
        </button>
        <button onClick={handleShare} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontWeight: 600, fontSize: '0.7rem' }}>
          <Share size={22} />
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
