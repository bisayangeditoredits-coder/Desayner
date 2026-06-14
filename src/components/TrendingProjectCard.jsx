'use client';

import { useState, useMemo} from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bookmark, Eye, Heart, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import UserAvatar from './UserAvatar';
import { saveProjectModalReturn } from '@/lib/projectModalNav';
import { stripCloudinaryProxy } from '@/lib/utils';

const SaveToCollectionModal = dynamic(() => import('./SaveToCollectionModal'), { ssr: false });

function compactNumber(value) {
  const number = Number(value) || 0;

  if (number >= 1000000) return `${(number / 1000000).toFixed(number >= 10000000 ? 0 : 1)}m`;
  if (number >= 1000) return `${(number / 1000).toFixed(number >= 10000 ? 0 : 1)}k`;

  return number.toString();
}

export default function TrendingProjectCard({ project, currentUserId, rank }) {
  const [liked, setLiked] = useState(project.user_liked || false);
  const [saved] = useState(project.user_saved || false);
  const [likeCount, setLikeCount] = useState(project.likes_count || 0);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [imageStatus, setImageStatus] = useState('loading');
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const author = project.profiles;
  const authorName = author?.full_name || author?.username || 'Unknown';

  async function handleLike(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!currentUserId) {
      router.push('/login?redirectTo=' + encodeURIComponent(window.location.pathname + window.location.search));
      return;
    }

    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((count) => Math.max(0, wasLiked ? count - 1 : count + 1));

    if (wasLiked) {
      await supabase.from('project_likes').delete().eq('user_id', currentUserId).eq('project_id', project.id);
    } else {
      await supabase.from('project_likes').insert({ user_id: currentUserId, project_id: project.id });
    }
  }

  function handleSave(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!currentUserId) {
      router.push('/login?redirectTo=' + encodeURIComponent(window.location.pathname + window.location.search));
      return;
    }

    setShowCollectionModal(true);
  }

  return (
    <article className="trending-project-card">
      <Link
        href={`/projects/${project.id}`}
        className="trending-project-card__media"
        prefetch={false}
        onClick={saveProjectModalReturn}
        aria-label={`Open ${project.title || 'project'}`}
      >
        <div className={`trending-project-card__image-shell trending-project-card__image-shell--${imageStatus}`}>
          {(project.thumbnail_url || project.cover_url) && imageStatus !== 'error' ? (
            (() => {
              const imgSrc = stripCloudinaryProxy(project.thumbnail_url || project.cover_url);
              const isProxy = imgSrc?.startsWith('/api/') || imgSrc?.startsWith('https://wsrv.nl');
              return (
                <Image
                  src={imgSrc}
                  alt={project.title || 'Project cover'}
                  className="trending-project-card__image"
                  width={520}
                  height={390}
                  sizes="(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 18vw"
                  unoptimized={isProxy}
                  loading="lazy"
                  onLoad={() => setImageStatus('loaded')}
                  onError={() => setImageStatus('error')}
                />
              );
            })()
          ) : (
            <div className="trending-project-card__empty">
              <Sparkles size={18} />
              <span>No cover</span>
            </div>
          )}

          <div className="trending-project-card__topline">
            <span className="trending-project-card__rank">#{rank}</span>
            {project.category && <span className="trending-project-card__category">{project.category}</span>}
          </div>
        </div>
      </Link>

      <div className="trending-project-card__body">
        <Link
          href={`/projects/${project.id}`}
          className="trending-project-card__title"
          prefetch={false}
          onClick={saveProjectModalReturn}
        >
          {project.title || 'Untitled project'}
        </Link>

        <div className="trending-project-card__meta">
          <Link
            href={author?.username ? `/profile/${author.username}` : '#'}
            className="trending-project-card__author"
          >
            <UserAvatar src={author?.avatar_url} name={authorName} size={22} />
            <span>{authorName}</span>
          </Link>

          <div className="trending-project-card__stats" aria-label="Project stats">
            <span className="trending-project-card__stat" title="Views">
              <Eye size={13} />
              <span className="font-mono">{compactNumber(project.views_count)}</span>
            </span>
            <button
              type="button"
              className={`trending-project-card__stat trending-project-card__stat-button ${liked ? 'is-active' : ''}`}
              onClick={handleLike}
              title={liked ? 'Unlike' : 'Like'}
            >
              <Heart size={13} fill={liked ? 'currentColor' : 'none'} />
              <span className="font-mono">{compactNumber(likeCount)}</span>
            </button>
            <button
              type="button"
              className={`trending-project-card__stat trending-project-card__stat-button ${saved ? 'is-saved' : ''}`}
              onClick={handleSave}
              title={saved ? 'Saved' : 'Save'}
            >
              <Bookmark size={13} fill={saved ? 'currentColor' : 'none'} />
              <span className="font-mono">{compactNumber(project.saves_count)}</span>
            </button>
          </div>
        </div>
      </div>

      {showCollectionModal && (
        <SaveToCollectionModal
          itemType="project"
          itemId={project.id}
          onClose={() => setShowCollectionModal(false)}
        />
      )}
    </article>
  );
}
