'use client';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Search, Bell, Plus, X, Heart, Bookmark, MessageCircle, UserPlus, 
  MessageSquare, Filter, Layers, UserSquare, CalendarCheck, PenTool, Calendar, Inbox, ChevronDown, Menu,
  Image as ImageIcon
} from 'lucide-react';
import { useMobileNav } from '@/components/MobileNavProvider';
import { createClient } from '@/lib/supabase/client';
import { saveProjectModalReturn } from '@/lib/projectModalNav';
import UserAvatar from './UserAvatar';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getIcon(type) {
  if (type === 'like') return <Heart size={14} fill="#2d43e8" color="#2d43e8" />;
  if (type === 'save') return <Bookmark size={14} fill="#231f20" color="#231f20" />;
  if (type === 'comment') return <MessageCircle size={14} fill="#2d43e8" color="#2d43e8" />;
  if (type === 'follow') return <UserPlus size={14} color="#1a8a3b" />;
  return <Bell size={14} />;
}

function getMessage(n) {
  const actorName = n.actor?.full_name || n.actor?.username || 'Someone';
  if (n.type === 'like') {
    return <span><strong>{actorName}</strong> liked your project</span>;
  }
  if (n.type === 'save') return <span><strong>{actorName}</strong> saved your project</span>;
  if (n.type === 'comment') return <span><strong>{actorName}</strong> commented on your project</span>;
  if (n.type === 'follow') return <span><strong>{actorName}</strong> started following you</span>;
  return <span><strong>{actorName}</strong> interacted with you</span>;
}

function getLink(n) {
  if (n.type === 'follow') return `/profile/${n.actor?.username}`;
  if (n.project_id) return `/projects/${n.project_id}`;
  return '#';
}

export default function Header() {
  const [profile, setProfile]           = useState(null);
  const [userId, setUserId]             = useState(null);
  const [authLoaded, setAuthLoaded]     = useState(false);
  const [searchQuery, setSearchQuery]   = useState('');
  const [results, setResults]           = useState([]);
  const [searching, setSearching]       = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount]   = useState(0);
  const [showNotifs, setShowNotifs]     = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifsLoading, setNotifsLoading] = useState(false);
  
  const searchRef   = useRef(null);
  const notifRef    = useRef(null);
  const debounceRef = useRef(null);
  // Stable client instance — not recreated on every render
  const supabase    = useMemo(() => createClient(), []);
  const router     = useRouter();
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useMobileNav();

  useEffect(() => {
    let mounted = true;
    let sub = null;
    let fallbackInterval = null;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (mounted) setAuthLoaded(true);
        return;
      }
      if (mounted) setUserId(user.id);

      async function fetchBadges() {
        // Parallel fetch — notifications
        const [notifRes] = await Promise.all([
          supabase
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('read', false),
        ]);
        if (mounted) {
          setUnreadCount(notifRes.count || 0);
        }
      }

      // Parallel fetch — profile + badges together
      const [profileRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('username, full_name, avatar_url')
          .eq('id', user.id)
          .single(),
        fetchBadges(),
      ]);

      if (mounted && profileRes.data) setProfile(profileRes.data);
      if (mounted) setAuthLoaded(true);

      // Realtime listeners — with error handling + fallback polling
      const uniqueChannelName = `header_badges_${user.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      sub = supabase.channel(uniqueChannelName)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, fetchBadges)
        .subscribe((status, err) => {
          if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
            console.warn('Header realtime lost, falling back to polling:', err?.message);
            if (!fallbackInterval) {
              fallbackInterval = setInterval(fetchBadges, 30_000);
            }
          } else if (status === 'SUBSCRIBED') {
            // Clear fallback polling if realtime reconnects
            if (fallbackInterval) {
              clearInterval(fallbackInterval);
              fallbackInterval = null;
            }
          }
        });
    }
    load();

    return () => {
      mounted = false;
      if (sub) supabase.removeChannel(sub);
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, [supabase]);

  // Listen to profile updates from Settings page
  useEffect(() => {
    async function refreshProfile() {
      if (!userId) return;
      const { data } = await supabase
        .from('profiles')
        .select('username, full_name, avatar_url')
        .eq('id', userId)
        .single();
      if (data) setProfile(data);
    }

    window.addEventListener('profile_updated', refreshProfile);
    return () => window.removeEventListener('profile_updated', refreshProfile);
  }, [userId, supabase]);

  // Debounced live search — routed through /api/search so it uses the FTS index + Redis cache
  const liveSearch = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); setDropdownOpen(false); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&page=1`);
      const data = await res.json();
      setResults((data.projects || []).slice(0, 6));
      setDropdownOpen(true);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  function handleChange(e) {
    const q = e.target.value;
    setSearchQuery(q);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => liveSearch(q), 280);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setDropdownOpen(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
    if (e.key === 'Escape') { setDropdownOpen(false); setSearchQuery(''); }
  }

  function clearSearch() {
    setSearchQuery('');
    setResults([]);
    setDropdownOpen(false);
  }

  // Close dropdown on outside click
  useEffect(() => {
    function onClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const pathname = usePathname();

  async function toggleNotifs() {
    if (!showNotifs) {
      setShowNotifs(true);
      setNotifsLoading(true);
      const { data } = await supabase
        .from('notifications')
        .select(`
          *,
          actor:profiles!notifications_actor_id_fkey(username, full_name, avatar_url),
          project:projects(title)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      setNotifications(data || []);
      setNotifsLoading(false);

      const unreadIds = (data || []).filter(n => !n.read).map(n => n.id);
      if (unreadIds.length > 0) {
        await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
        setUnreadCount(0);
      }
    } else {
      setShowNotifs(false);
    }
  }

  return (
    <header className="top-header">
      {/* Search and Left Icons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
        {/* Hamburger Menu for Mobile */}
        <button 
          className="mobile-menu-toggle" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle Navigation"
        >
          <Menu size={24} color="#231f20" />
        </button>

        {pathname !== '/' && (
          <div className="search-bar" ref={searchRef} style={{ maxWidth: '400px', flex: 1 }}>
            <Search className="search-icon" size={15} />
            <input
              id="global-search"
            type="text"
            value={searchQuery}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => searchQuery.trim() && setDropdownOpen(true)}
            placeholder="Search projects, designers, tutorials..."
            autoComplete="off"
            style={{ paddingRight: '2.5rem' }}
          />
          <Filter size={15} color="#9b9b9b" style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }} />
          {searchQuery && (
            <button
              onClick={clearSearch}
              style={{ position: 'absolute', right: '2.2rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9b9b9b', display: 'flex' }}
            >
              <X size={13} />
            </button>
          )}

          {/* Live results dropdown */}
          {dropdownOpen && (
            <div className="search-dropdown">
              {searching ? (
                <div className="search-dropdown__empty">Searching...</div>
              ) : results.length === 0 ? (
                <div className="search-dropdown__empty">No results for &quot;{searchQuery}&quot;</div>
              ) : (
                <>
                  {results.map(p => (
                    <Link
                      key={p.id}
                      href={`/projects/${p.id}`}
                      className="search-dropdown__item"
                      onClick={() => { saveProjectModalReturn(); setDropdownOpen(false); setSearchQuery(''); }}
                    >
                      <div className="search-dropdown__thumb">
                        {p.cover_url || p.thumbnail_url
                          ? <img src={stripCloudinaryProxy(p.thumbnail_url || p.cover_url)} alt="" loading="lazy" decoding="async" /> 
                          : <div className="header__search-placeholder"><ImageIcon size={14} /></div>}
                      </div>
                      <div className="search-dropdown__info">
                        <span className="search-dropdown__title">{p.title}</span>
                        <span className="search-dropdown__meta">
                          {p.profiles?.full_name || p.profiles?.username}
                          {p.category && ` · ${p.category}`}
                        </span>
                      </div>
                    </Link>
                  ))}
                  <Link
                    href={`/search?q=${encodeURIComponent(searchQuery)}`}
                    className="search-dropdown__view-all"
                    onClick={() => setDropdownOpen(false)}
                  >
                    See all results for &quot;{searchQuery}&quot; →
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
        )}

        {/* Center Icons */}

      </div>

      {/* Actions */}
      <div className="header-actions">
        {userId ? (
          <>
            <div className="header-create-wrapper" style={{ position: 'relative' }}>
              <button
                onClick={() => setCreateMenuOpen(!createMenuOpen)}
                className="header-create-btn"
              >
                <Plus size={16} strokeWidth={2.5} />
                <span className="header-create-btn-text">Create</span>
                <ChevronDown size={14} className="header-create-btn-arrow" />
              </button>
              
              {createMenuOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 0.5rem)', left: '50%', transform: 'translateX(-50%)',
                  background: 'white', border: '1px solid #e8e8e8', borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100, padding: '0.5rem 0', minWidth: '160px', width: 'max-content'
                }}>
                  <Link href="/projects/new" onClick={() => setCreateMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 1rem', color: '#231f20', fontSize: '0.875rem', textDecoration: 'none', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    <Plus size={16} color="#6b7280" /> New Project
                  </Link>
                </div>
              )}
            </div>



            <div style={{ position: 'relative' }} ref={notifRef}>
              <button onClick={toggleNotifs} className="icon-btn" id="notification-btn" title="Notifications" style={{ position: 'relative' }}>
                <Bell size={18} strokeWidth={1.5} />
                {unreadCount > 0 && (
                  <span className="notif-badge"></span>
                )}
              </button>
              
              {showNotifs && (
                <div className="notif-dropdown">
                  <div className="notif-dropdown__header">
                    Notifications
                    <Link href="/notifications" style={{ fontSize: '0.75rem', color: '#2d43e8', textDecoration: 'none', fontWeight: 600 }} onClick={() => setShowNotifs(false)}>
                      View All
                    </Link>
                  </div>
                  {notifsLoading ? (
                    <div className="notif-dropdown__empty">Loading...</div>
                  ) : notifications.length === 0 ? (
                    <div className="notif-dropdown__empty">No new notifications</div>
                  ) : (
                    notifications.map((n) => (
                      <Link
                        key={n.id}
                        href={getLink(n)}
                        className={`notif-dropdown__item ${!n.read ? 'unread' : ''}`}
                        onClick={() => setShowNotifs(false)}
                      >
                        <div style={{ position: 'relative' }}>
                          <UserAvatar src={n.actor?.avatar_url} name={n.actor?.full_name || n.actor?.username} size={36} />
                          <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '20px', height: '20px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                            {getIcon(n.type)}
                          </div>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '0.8rem', color: '#231f20', lineHeight: 1.4, margin: '0 0 0.2rem' }}>
                            {getMessage(n)}
                          </p>
                          <span style={{ fontSize: '0.7rem', color: '#9b9b9b' }}>{timeAgo(n.created_at)}</span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>

            {profile && (
              <Link href={`/profile/${profile.username}`} className="header-profile-link" style={{ marginLeft: '0.25rem' }}>
                <UserAvatar src={profile.avatar_url} name={profile.full_name || profile.username} size={32} />
              </Link>
            )}
          </>
        ) : authLoaded ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link href="/login" style={{ fontSize: '0.875rem', fontWeight: 700, color: '#231f20', textDecoration: 'none' }}>
              Log In
            </Link>
            <Link href="/signup" style={{ padding: '0.5rem 1rem', background: '#2d43e8', color: 'white', fontSize: '0.875rem', fontWeight: 700, textDecoration: 'none', borderRadius: '8px' }}>
              Sign Up
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}></div>
        )}
      </div>
    </header>
  );
}
