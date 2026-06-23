import React from 'react';
import Link from 'next/link';
import { Heart, Bookmark, Share, MessageCircle, Calendar, Globe, MessageSquare } from 'lucide-react';
import UserAvatar from '@/components/ui/UserAvatar';
import FollowButton from '@/components/ui/FollowButton';
import { CREATIVE_TOOLS } from '@/lib/constants';
import { stripCloudinaryProxy } from '@/lib/utils';

export default function ProjectSidebar({
  project,
  author,
  currentUser,
  profileHref,
  goToAuthorProfile,
  isFollowing,
  liked,
  toggleLike,
  handleShare,
  setShowColModal,
  commentCount,
  moreByAuthor,
  navigateToProject,
  router
}) {
  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    });
  }

  const handleSaveClick = () => {
    if (!currentUser) {
      router.push('/login?redirectTo=' + encodeURIComponent(window.location.pathname));
    } else {
      setShowColModal(true);
    }
  };

  return (
    <aside className="project-detail__sidebar">
      {/* Primary Actions */}
      <div className="project-detail__actions">
        <button 
          onClick={toggleLike} 
          className={`project-detail__action-btn ${liked ? 'anim-heart-pop' : ''}`}
          style={{ flex: 1, justifyContent: 'center' }}
        >
          <Heart size={18} fill={liked ? '#ef4444' : 'none'} color={liked ? '#ef4444' : 'currentColor'} />
          <span>{liked ? 'Liked' : 'Like'}</span>
        </button>
        <button 
          onClick={handleSaveClick} 
          className="project-detail__action-btn project-detail__action-btn--icon-only"
        >
          <Bookmark size={18} />
        </button>
        <button 
          onClick={handleShare} 
          className="project-detail__action-btn project-detail__action-btn--icon-only"
        >
          <Share size={18} />
        </button>
      </div>

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
          <span>{commentCount} comments</span>
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

        {/* Contact Creator */}
        {currentUser && currentUser.id !== project.user_id && author?.website && (
          <a
            href={author.website.startsWith('http') ? author.website : `https://${author.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="project-detail__action-btn project-detail__action-btn--primary"
          >
            <MessageSquare size={16} />
            <span>Contact Creator</span>
          </a>
        )}
      </div>

      {/* Tools Used */}
      {project.tools && project.tools.length > 0 && (
        <div className="project-detail__tools" style={{ marginBottom: '1.5rem' }}>
          <h3 className="project-detail__sidebar-title">Tools Used</h3>
          <div className="project-detail__tools-list" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {project.tools.map(tool => {
              const def = CREATIVE_TOOLS.find(t => t.name.toLowerCase() === tool.toLowerCase());
              return (
                <div key={tool} className="project-detail__tool-tag" title={tool}>
                  {def?.iconPath && (
                    <img 
                      src={def.iconPath} 
                      alt={tool} 
                      className="project-detail__tool-icon" 
                      style={{ width: '16px', height: '16px', objectFit: 'contain' }}
                    />
                  )}
                  <span style={{ textTransform: 'capitalize' }}>{tool}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tags */}
      {project.tags && project.tags.length > 0 && (
        <div className="project-detail__tags">
          <h3 className="project-detail__sidebar-title">Tags</h3>
          <div className="project-detail__tags-list">
            {project.tags.map(t => (
              <Link href={`/search?q=${encodeURIComponent(t)}`} key={t} className="project-detail__tag">
                {t}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* More by this creator */}
      {moreByAuthor && moreByAuthor.length > 0 && (
        <div className="project-detail__more-by">
          <div className="project-detail__more-by-header">
            <h3 className="project-detail__sidebar-title">More by {author?.username}</h3>
            <a href={profileHref} onClick={goToAuthorProfile} className="project-detail__more-by-link">
              View all
            </a>
          </div>
          <div className="project-detail__more-by-grid">
            {moreByAuthor.slice(0, 2).map(p => {
              const thumb = p.thumbnail_url || p.cover_url;
              return (
                <div 
                  key={p.id} 
                  onClick={() => navigateToProject(p.id)}
                  className="more-project-card"
                >
                  <div className="more-project-card__inner">
                    {thumb ? (
                      <img 
                        src={stripCloudinaryProxy(thumb)} 
                        alt={p.title} 
                        className="more-project-img"
                      />
                    ) : (
                      <div className="more-project-card__placeholder">No Cover</div>
                    )}
                    <div className="more-project-overlay">
                      <span>{p.title}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
