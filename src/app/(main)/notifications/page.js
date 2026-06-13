'use client';
import { useState, useEffect, useMemo} from 'react';
import { createClient } from '@/lib/supabase/client';
import UserAvatar from '@/components/UserAvatar';
import Link from 'next/link';
import { saveProjectModalReturn } from '@/lib/projectModalNav';
import { Heart, Bookmark, MessageCircle, UserPlus, Check, Bell } from 'lucide-react';
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

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('notifications')
        .select(`
          *,
          actor:profiles!notifications_actor_id_fkey(username, full_name, avatar_url),
          project:projects(title),
          inspiration:inspirations(title)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
        
      setNotifications(data || []);
      setLoading(false);

      // Mark all as read after viewing
      const unreadIds = (data || []).filter(n => !n.read).map(n => n.id);
      if (unreadIds.length > 0) {
        await supabase
          .from('notifications')
          .update({ read: true })
          .in('id', unreadIds);
      }
    }
    load();
  }, []);

  function getIcon(type) {
    if (type === 'like') return <Heart size={16} fill="#2d43e8" color="#2d43e8" />;
    if (type === 'save') return <Bookmark size={16} fill="#231f20" color="#231f20" />;
    if (type === 'comment') return <MessageCircle size={16} fill="#2d43e8" color="#2d43e8" />;
    if (type === 'follow') return <UserPlus size={16} color="#1a8a3b" />;
    return <Bell size={16} />;
  }

  function getMessage(n) {
    const actorName = n.actor?.full_name || n.actor?.username || 'Someone';
    if (n.type === 'like') {
      if (n.inspiration_id) return <span><strong>{actorName}</strong> liked your inspiration</span>;
      return <span><strong>{actorName}</strong> liked your project <strong>{n.project?.title}</strong></span>;
    }
    if (n.type === 'save') return <span><strong>{actorName}</strong> saved your project <strong>{n.project?.title}</strong></span>;
    if (n.type === 'comment') return <span><strong>{actorName}</strong> commented on your project <strong>{n.project?.title}</strong></span>;
    if (n.type === 'follow') return <span><strong>{actorName}</strong> started following you</span>;
    return <span><strong>{actorName}</strong> interacted with you</span>;
  }

  function getLink(n) {
    if (n.type === 'follow') return `/profile/${n.actor?.username}`;
    if (n.project_id) return `/projects/${n.project_id}`;
    if (n.inspiration_id) return '/inspirations';
    return '#';
  }

  return (
    <>
        <div style={{ maxWidth: '640px', padding: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem', letterSpacing: '-0.03em' }}>Notifications</h1>
          
          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#9b9b9b' }}>Loading...</div>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', border: '1px solid #e8e8e8', background: 'white' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <Check size={24} color="#9b9b9b" />
              </div>
              <p style={{ fontWeight: 700, marginBottom: '0.5rem' }}>You&apos;re all caught up!</p>
              <p style={{ color: '#9b9b9b', fontSize: '0.85rem' }}>No new notifications.</p>
            </div>
          ) : (
            <div style={{ border: '1px solid #e8e8e8', background: 'white' }}>
              {notifications.map((n, i) => (
                <Link
                  key={n.id}
                  href={getLink(n)}
                  onClick={() => {
                    const link = getLink(n);
                    if (/^\/projects\/[^/]+$/.test(link)) saveProjectModalReturn();
                  }}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '1rem',
                    padding: '1.25rem 1.5rem', textDecoration: 'none', color: 'inherit',
                    borderBottom: i < notifications.length - 1 ? '1px solid #e8e8e8' : 'none',
                    background: n.read ? 'white' : '#f0f8ff',
                    transition: 'background 0.15s'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = '#fafafa'}
                  onMouseOut={e => e.currentTarget.style.background = n.read ? 'white' : '#f0f8ff'}
                >
                  <div style={{ position: 'relative' }}>
                    <UserAvatar src={n.actor?.avatar_url} name={n.actor?.full_name || n.actor?.username} size={40} />
                    <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '22px', height: '22px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                      {getIcon(n.type)}
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.9rem', color: '#231f20', lineHeight: 1.4, marginBottom: '0.3rem' }}>
                      {getMessage(n)}
                    </p>
                    <span style={{ fontSize: '0.75rem', color: '#9b9b9b' }}>{timeAgo(n.created_at)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </>
  );
}
