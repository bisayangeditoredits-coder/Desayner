'use client';
import { useState, useEffect, useMemo} from 'react';
import { createClient } from '@/lib/supabase/client';
import PostComposer from '@/components/PostComposer';
import ReactionBar from '@/components/ReactionBar';
import CommentThread from '@/components/CommentThread';
import UserAvatar from '@/components/UserAvatar';
import Link from 'next/link';
import { MessageCircle, Bookmark, ChevronDown, ChevronUp } from 'lucide-react';
import '../../App.css';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const POST_TYPE_STYLES = {
  share:    { label: 'Share',    bg: '#f0f0f0', color: '#231f20' },
  help:     { label: 'Help',     bg: '#fff0f0', color: '#ff3b3b' },
  feedback: { label: 'Feedback', bg: '#f0f8ff', color: '#0ea5e9' },
};

const FILTERS = ['All', 'Share', 'Help', 'Feedback'];

function PostCard({ post, currentUser, currentProfile }) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments]         = useState([]);
  const [loaded, setLoaded]             = useState(false);
  const [saved, setSaved]               = useState(false);
  const supabase = useMemo(() => createClient(), []);

  async function toggleComments() {
    if (!loaded) {
      const { data } = await supabase
        .from('post_comments')
        .select('*, profiles(username, full_name, avatar_url)')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });
      setComments(data || []);
      setLoaded(true);
    }
    setShowComments(p => !p);
  }

  async function toggleSave() {
    if (!currentUser) return;
    const prev = saved;
    setSaved(!prev);
    if (prev) await supabase.from('post_saves').delete().eq('user_id', currentUser.id).eq('post_id', post.id);
    else       await supabase.from('post_saves').insert({ user_id: currentUser.id, post_id: post.id });
  }

  const typeStyle = POST_TYPE_STYLES[post.post_type] || POST_TYPE_STYLES.share;

  return (
    <div className="post-card">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <Link href={post.profiles?.username ? `/profile/${post.profiles.username}` : '#'} style={{ flexShrink: 0 }}>
          <UserAvatar src={post.profiles?.avatar_url} name={post.profiles?.full_name || post.profiles?.username || 'Unknown'} size={38} />
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.45rem' }}>
            <Link href={post.profiles?.username ? `/profile/${post.profiles.username}` : '#'} style={{ fontWeight: 700, fontSize: '0.875rem', color: '#231f20' }}>
              {post.profiles?.full_name || post.profiles?.username || 'User'}
            </Link>
            <span style={{ fontSize: '0.72rem', color: '#9b9b9b' }}>{timeAgo(post.created_at)}</span>
            {post.post_type && post.post_type !== 'share' && (
              <span style={{ padding: '0.15rem 0.5rem', background: typeStyle.bg, color: typeStyle.color, fontSize: '0.68rem', fontWeight: 700 }}>
                {typeStyle.label}
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.65, color: '#231f20', whiteSpace: 'pre-wrap' }}>{post.body}</p>
          {post.image_url && (
            <img src={post.image_url} alt="" style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', border: '1px solid #e8e8e8', marginTop: '0.75rem' }} />
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', paddingLeft: '3.25rem' }}>
        <ReactionBar postId={post.id} currentUserId={currentUser?.id} reactionsCount={post.reactions_count} />
        <button onClick={toggleComments} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.7rem', border: '1px solid #e8e8e8', background: showComments ? '#f5f5f5' : 'white', fontSize: '0.78rem', fontWeight: 600, color: '#6b6b6b', cursor: 'pointer', fontFamily: 'inherit' }}>
          <MessageCircle size={13} />
          {post.comments_count > 0 ? post.comments_count : ''} Reply
          {showComments ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
        <button onClick={toggleSave} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'none', border: 'none', cursor: 'pointer', color: saved ? '#231f20' : '#c0c0c0', fontSize: '0.78rem', fontFamily: 'inherit', padding: '0.3rem' }}>
          <Bookmark size={14} fill={saved ? '#231f20' : 'none'} />
        </button>
      </div>

      {showComments && (
        <div style={{ marginTop: '1rem', paddingLeft: '3.25rem', paddingTop: '1rem', borderTop: '1px solid #f0f0f0' }}>
          <CommentThread targetId={post.id} targetType="community" comments={comments} currentUser={currentProfile} />
        </div>
      )}
    </div>
  );
}

export default function CommunityPage() {
  const [posts, setPosts]               = useState([]);
  const [filter, setFilter]             = useState('All');
  const [currentUser, setCurrentUser]   = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [loading, setLoading]           = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (profile) setCurrentProfile(profile);
      }
    }
    loadUser();
  }, []);

  useEffect(() => {
    async function loadPosts() {
      setLoading(true);
      try {
        const res = await fetch(`/api/community?filter=${encodeURIComponent(filter)}&limit=50`);
        if (!res.ok) throw new Error('Failed to fetch community posts');
        const { posts } = await res.json();
        setPosts(posts || []);
      } catch (err) {
        console.error('Error fetching community posts:', err);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    }
    loadPosts();
  }, [filter]);

  function onPosted(newPost) {
    setPosts(prev => [{ ...newPost, profiles: currentProfile }, ...prev]);
  }

  return (
    <>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', width: '100%' }}>

          {/* Feed */}
          <div style={{ borderRight: '1px solid #e8e8e8', minHeight: '100vh' }}>
            {/* Toolbar */}
            <div style={{ padding: '1rem 2rem', borderBottom: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h1 style={{ fontSize: '0.95rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Community</h1>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                {FILTERS.map(f => (
                  <button key={f} onClick={() => setFilter(f)} style={{ padding: '0.3rem 0.65rem', border: '1px solid', borderColor: filter === f ? '#231f20' : '#e8e8e8', background: filter === f ? '#231f20' : 'white', color: filter === f ? 'white' : '#6b6b6b', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Composer */}
            {currentProfile && (
              <div style={{ borderBottom: '1px solid #e8e8e8' }}>
                <PostComposer currentUser={currentProfile} onPosted={onPosted} />
              </div>
            )}

            {/* Posts */}
            {loading ? (
              [...Array(4)].map((_, i) => <div key={i} style={{ height: '130px', background: '#fafafa', borderBottom: '1px solid #e8e8e8' }} />)
            ) : posts.length === 0 ? (
              <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                <p style={{ color: '#9b9b9b', fontSize: '0.875rem' }}>No posts yet — be the first!</p>
              </div>
            ) : (
              posts.map(post => (
                <PostCard key={post.id} post={post} currentUser={currentUser} currentProfile={currentProfile} />
              ))
            )}
          </div>

          {/* Right panel */}
          <div style={{ padding: '1.5rem' }}>
            <div style={{ padding: '1rem', background: '#f9f9f9', border: '1px solid #e8e8e8' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b6b6b', marginBottom: '0.75rem' }}>Post Types</p>
              {Object.entries(POST_TYPE_STYLES).map(([key, val]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0', borderBottom: '1px solid #f0f0f0' }}>
                  <span style={{ padding: '0.15rem 0.45rem', background: val.bg, color: val.color, fontSize: '0.68rem', fontWeight: 700, flexShrink: 0 }}>{val.label}</span>
                  <span style={{ fontSize: '0.75rem', color: '#9b9b9b' }}>
                    {key === 'share' ? 'Share your work' : key === 'help' ? 'Ask for assistance' : 'Get peer feedback'}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid #e8e8e8', background: 'white' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b6b6b', marginBottom: '0.75rem' }}>Community Guidelines</p>
              {['Be respectful and constructive', 'Give credit where it\'s due', 'No spam or self-promotion only', 'Help others when you can'].map((rule, i) => (
                <p key={i} style={{ fontSize: '0.78rem', color: '#6b6b6b', lineHeight: 1.5, marginBottom: '0.4rem' }}>· {rule}</p>
              ))}
            </div>
          </div>
        </div>
      </>
  );
}
