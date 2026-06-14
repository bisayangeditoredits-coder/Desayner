'use client';
import { useState, useEffect, useMemo} from 'react';
import { createClient } from '@/lib/supabase/client';
import ProjectCard from '@/components/ProjectCard';
import UserAvatar from '@/components/UserAvatar';
import Link from 'next/link';
import { Bookmark, MessageCircle } from 'lucide-react';
import '../../App.css';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

export default function SavedPage() {
  const [tab, setTab]                   = useState('projects');
  const [savedProjects, setSavedProjects] = useState([]);
  const [savedPosts, setSavedPosts]     = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading]           = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setCurrentUserId(user.id);

      const [projRes, postRes] = await Promise.all([
        supabase
          .from('project_saves')
          .select('projects(*, profiles!projects_user_id_fkey(username, full_name, avatar_url))')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('post_saves')
          .select('community_posts(*, profiles!community_posts_user_id_fkey(username, full_name, avatar_url))')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

      setSavedProjects((projRes.data || []).map(r => r.projects).filter(Boolean));
      setSavedPosts((postRes.data || []).map(r => r.community_posts).filter(Boolean));
      setLoading(false);
    }
    load();
  }, []);

  const empty = (label, href, linkLabel) => (
    <div style={{ textAlign: 'center', padding: '4rem', border: '1px solid #e8e8e8', background: 'white' }}>
      <Bookmark size={28} style={{ color: '#e0e0e0', display: 'block', margin: '0 auto 1rem' }} />
      <p style={{ color: '#9b9b9b', fontSize: '0.875rem', marginBottom: '1rem' }}>{label}</p>
      <Link href={href} style={{ display: 'inline-block', padding: '0.5rem 1.25rem', border: '1px solid #e8e8e8', fontSize: '0.8rem', fontWeight: 700, color: '#231f20' }}>
        {linkLabel}
      </Link>
    </div>
  );

  return (
    <>
        <div className="page-content">
          <div className="page-header">
            <div>
              <h1 className="page-title">Saved</h1>
              <p style={{ fontSize: '0.85rem', color: '#9b9b9b', marginTop: '0.25rem' }}>Your bookmarked projects and posts</p>
            </div>
          </div>

          <div className="tabs" style={{ marginBottom: '1.5rem' }}>
            <button className={`tab-btn ${tab === 'projects' ? 'active' : ''}`} onClick={() => setTab('projects')}>
              Projects ({savedProjects.length})
            </button>
            <button className={`tab-btn ${tab === 'posts' ? 'active' : ''}`} onClick={() => setTab('posts')}>
              Posts ({savedPosts.length})
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1px', background: '#e8e8e8', border: '1px solid #e8e8e8' }}>
              {[...Array(6)].map((_, i) => <div key={i} style={{ background: '#f5f5f5', aspectRatio: '4/3' }} />)}
            </div>
          ) : tab === 'projects' ? (
            savedProjects.length === 0
              ? empty('No saved projects yet.', '/projects', 'Browse Projects')
              : (
                <div className="projects-masonry">
                  {savedProjects.map(project => (
                    <ProjectCard key={project.id} project={project} currentUserId={currentUserId} />
                  ))}
                </div>
              )
          ) : (
            savedPosts.length === 0
              ? empty('No saved posts yet.', '/community', 'Browse Community')
              : (
                <div style={{ border: '1px solid #e8e8e8' }}>
                  {savedPosts.map(post => (
                    <div key={post.id} className="post-card">
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <Link href={post.profiles?.username ? `/profile/${post.profiles.username}` : '#'}>
                          <UserAvatar src={post.profiles?.avatar_url} name={post.profiles?.full_name || post.profiles?.username} size={36} />
                        </Link>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                            <Link href={post.profiles?.username ? `/profile/${post.profiles.username}` : '#'} style={{ fontWeight: 700, fontSize: '0.875rem', color: '#231f20' }}>
                              {post.profiles?.full_name || post.profiles?.username}
                            </Link>
                            <span style={{ fontSize: '0.72rem', color: '#9b9b9b' }}>{timeAgo(post.created_at)}</span>
                          </div>
                          <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: '#231f20' }}>{post.body}</p>
                          {post.image_url && (
                            <img src={post.image_url} alt="" style={{ marginTop: '0.75rem', width: '100%', maxHeight: '240px', objectFit: 'cover', border: '1px solid #e8e8e8' }} />
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#9b9b9b' }}>
                              <MessageCircle size={12} /> {post.comments_count || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
          )}
        </div>
      </>
  );
}
