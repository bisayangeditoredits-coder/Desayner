'use client';
import React, { useState, useEffect, useLayoutEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  Home, FolderOpen, Users, Users2, Bookmark, Plus, Settings,
  LogOut, ChevronDown, ChevronUp, Library, MessageSquare, Briefcase, ShoppingBag, Box, PlaySquare, Compass, MessageSquareCode, Image as ImageIcon,
  Palette, Type, LayoutTemplate, ChevronLeft, ChevronRight
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import UserAvatar from '@/components/ui/UserAvatar';
import FollowButton from '@/components/ui/FollowButton';
import { useMobileNav } from '@/components/layout/MobileNavProvider';
import useLayoutStore from '@/store/useLayoutStore';

import { useRouter } from 'next/navigation';
import useFeedStore from '@/store/useFeedStore';
import useProfileStore from '@/store/useProfileStore';

const MAIN_NAV_ITEMS = [
  { href: '/', icon: Home, label: 'Inspiration', public: true },
  { href: '/designers', icon: Users2, label: 'Designers', public: true },
  { href: '/jobs', icon: Briefcase, label: 'Job Board', public: true },
  { href: '/saved', icon: Bookmark, label: 'Saved', reqAuth: true },
];

const DISCOVER_CATEGORIES = ['Design', 'Illustration', 'Photography', 'Branding', '3D', 'Motion', 'UI/UX'];

export default function Sidebar({ className = '' }) {
  const pathname = usePathname();
  const router = useRouter();
  const setFeedState = useFeedStore(state => state.setFeedState);
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useMobileNav();
  const [user, setUser] = useState(null);
  const profile = useProfileStore((s) => s.profile);
  const storeUser = useProfileStore((s) => s.user);
  const { isSidebarCollapsed, toggleSidebar } = useLayoutStore();
  const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

  useIsomorphicLayoutEffect(() => {
    if (typeof document !== 'undefined') {
      const hasAuth = /sb-[a-z0-9]+-auth-token/.test(document.cookie);
      if (hasAuth && !user) {
        setUser({ id: 'optimistic' });
      }
    }
  }, []);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const init = async () => {
      if (storeUser) setUser(storeUser);
      else if (!useProfileStore.getState().loading) setUser(null);
    };
    init();
  }, [storeUser]);

  useIsomorphicLayoutEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUsers = localStorage.getItem('desayner_sidebar_users');
      if (savedUsers) {
        try { setSuggestedUsers(JSON.parse(savedUsers)); } catch (e) { }
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    fetch('/api/designers/top')
      .then((res) => res.json())
      .then((data) => {
        if (mounted && data.designers) {
          const top3 = data.designers.slice(0, 3);
          setSuggestedUsers(top3);
          localStorage.setItem('desayner_sidebar_users', JSON.stringify(top3));
        }
      })
      .catch((err) => console.error('Failed to fetch sidebar designers', err));

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const refreshProfile = () => useProfileStore.getState().invalidate();
    window.addEventListener('profile_updated', refreshProfile);
    return () => window.removeEventListener('profile_updated', refreshProfile);
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    useProfileStore.getState().clear();
    window.location.href = '/login';
  }

  function isActive(href) {
    return pathname.startsWith(href) && (href !== '/' || pathname === '/');
  }

  const handleCategoryClick = (e, cat) => {
    e.preventDefault();
    setFeedState({ category: cat });
    if (pathname !== '/') {
      router.push('/');
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <>
      {isMobileMenuOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-label="Close Sidebar"
        />
      )}
      <aside className={`sidebar ${className} ${isMobileMenuOpen ? 'mobile-open' : ''}`} data-collapsed={isSidebarCollapsed}>
        <div style={{ padding: '1rem', borderBottom: '1px solid #e8e8e8', marginBottom: '0.25rem', display: 'flex', flexDirection: isSidebarCollapsed ? 'column' : 'row', justifyContent: 'space-between', alignItems: 'center', gap: isSidebarCollapsed ? '1rem' : '0' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isSidebarCollapsed ? (
              <img src="/desayner-favicon.png" alt="D" fetchPriority="high" style={{ width: '28px', height: '28px', display: 'block' }} />
            ) : (
              <img src="/desayner-logo.png" alt="Desayner" fetchPriority="high" style={{ width: 'auto', height: '28px', maxWidth: '100%', objectFit: 'contain', display: 'block' }} />
            )}
          </Link>
          <button 
            onClick={toggleSidebar}
            style={{ padding: '0.25rem', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#94a3b8', transition: 'color 0.2s', borderRadius: '4px' }}
            onMouseOver={e => { e.currentTarget.style.color = '#0f172a'; e.currentTarget.style.background = '#f1f5f9'; }}
            onMouseOut={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent'; }}
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Create button */}
        <div style={{ padding: '0.5rem 1rem' }}>
          <Link
            href="/projects/new"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem', padding: '0.6rem', textDecoration: 'none' }}
            title="New Project"
          >
            <Plus size={15} strokeWidth={2.5} /> <span className="sidebar-text">New Project</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {MAIN_NAV_ITEMS.map(({ href, icon: Icon, label, reqAuth }) => {
            if (reqAuth && !user) return null;
            return (
              <Link key={href} href={href} className={`nav-item ${isActive(href) ? 'active' : ''}`} title={label}>
                <Icon size={16} strokeWidth={isActive(href) ? 2.5 : 1.75} style={{ flexShrink: 0 }} />
                <span className="sidebar-text">{label}</span>
              </Link>
            );
          })}

          {/* Discover Categories to fill the empty space */}
          <div style={{ padding: '0.5rem 1rem', marginTop: '0.5rem' }} className="sidebar-section-discover">
            <div style={{ marginBottom: '0.5rem', paddingBottom: '0.5rem' }}>
              <span className="nav-section-label-inner" style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9b9b9b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Compass size={12} style={{ flexShrink: 0 }} /> <span className="sidebar-text">Discover</span>
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }} className="sidebar-text">
              {DISCOVER_CATEGORIES.map(cat => (
                <Link
                  key={cat}
                  href="/"
                  onClick={(e) => handleCategoryClick(e, cat)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.85rem',
                    color: '#64748b',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    display: 'block',
                    transition: 'background 0.2s, color 0.2s'
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; }}
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* Top Designers Sidebar Widget */}
        {suggestedUsers.length > 0 && (
          <div style={{ padding: '0.5rem 1rem', marginTop: '0.25rem' }} className="sidebar-text">
            <div style={{ marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid #e8e8e8' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9b9b9b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Users size={12} /> Who to follow
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {suggestedUsers.map(u => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.15rem 0' }}>
                  <Link href={`/profile/${u.username}`}>
                    <UserAvatar src={u.avatar_url} name={u.full_name || u.username} size={32} />
                  </Link>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <Link href={`/profile/${u.username}`} style={{ display: 'block', fontWeight: 700, fontSize: '0.75rem', color: '#231f20', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: 'none' }}>
                      {u.full_name || u.username}
                    </Link>
                    <span style={{ fontSize: '0.65rem', color: '#9b9b9b', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.projects_count || 0} projects</span>
                  </div>
                  <FollowButton targetUserId={u.id} currentUserId={user?.id} compact />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- PROMO WIDGET --- */}
        <div style={{ padding: '0 1rem', marginTop: '0.75rem', marginBottom: '0.5rem' }} className="sidebar-text">
          <div style={{ background: 'linear-gradient(135deg, #5865F2 0%, #4752C4 100%)', borderRadius: '20px', padding: '0.75rem', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 15px rgba(88, 101, 242, 0.2)' }}>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <svg width="15" height="15" viewBox="0 0 127.14 96.36" fill="currentColor">
                  <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a67.73,67.73,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14c0,0,.04-.06.05-.09A71.09,71.09,0,0,0,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.3,46,96.19,53,91.08,65.69,84.69,65.69Z" />
                </svg> Join Discord
              </h4>
              <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.7rem', opacity: 0.9, lineHeight: 1.4 }}>
                Connect with designers, share work, and collaborate.
              </p>
              <a href="https://discord.gg/3DmJrVcDG8" target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center', background: 'white', color: '#5865F2', border: 'none', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', width: '100%', transition: 'opacity 0.2s', textDecoration: 'none' }} onMouseOver={e => e.currentTarget.style.opacity = 0.9} onMouseOut={e => e.currentTarget.style.opacity = 1}>
                Join Server
              </a>
            </div>
            {/* Decorative shapes */}
            <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '70px', height: '70px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', zIndex: 1 }} />
            <div style={{ position: 'absolute', right: '20px', bottom: '-20px', width: '40px', height: '40px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', zIndex: 1 }} />
          </div>
        </div>

        {/* Bottom user section */}
        {user ? (
          <div style={{ borderTop: '1px solid #e8e8e8', padding: '0.5rem 1rem', marginTop: 'auto', position: 'relative' }}>
            <Link href="/settings" className="nav-item" style={{ marginBottom: '0.25rem' }} title="Settings">
              <Settings size={16} strokeWidth={1.75} style={{ flexShrink: 0 }} /> <span className="sidebar-text">Settings</span>
            </Link>

            {profile ? (
              <div>
                <button
                  onClick={() => setUserMenuOpen(p => !p)}
                  className="nav-item"
                  style={{ padding: '0.6rem 0.5rem', borderRadius: 0 }}
                  title="Profile Menu"
                >
                  <div style={{ flexShrink: 0 }}><UserAvatar src={profile.avatar_url} name={profile.full_name || profile.username} size={28} /></div>
                  <span className="sidebar-text" style={{ flex: 1, textAlign: 'left', fontWeight: 600, fontSize: '0.8rem', color: '#231f20', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {profile.full_name || profile.username}
                  </span>
                  <ChevronDown size={14} className="sidebar-text" color="#9b9b9b" style={{ transform: userMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                </button>

                {userMenuOpen && (
                  <div className="sidebar-text" style={{
                    position: 'absolute', bottom: '100%', left: '1rem', right: '1rem',
                    background: 'white', border: '1px solid #e8e8e8',
                    zIndex: 200, padding: '0.25rem 0',
                    borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                  }}>
                    <Link
                      href={`/profile/${profile.username}`}
                      className="nav-item"
                      onClick={() => setUserMenuOpen(false)}
                      style={{ padding: '0.6rem 1rem', fontSize: '0.8rem' }}
                    >
                      View Profile
                    </Link>
                    <button
                      onClick={signOut}
                      className="nav-item"
                      style={{ padding: '0.6rem 1rem', fontSize: '0.8rem', color: '#ef4444', width: '100%' }}
                    >
                      <LogOut size={15} style={{ flexShrink: 0 }} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '0.6rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#e2e8f0' }} className="shimmer-box" />
                <div className="sidebar-text" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <div style={{ width: '80%', height: '10px', background: '#e2e8f0', borderRadius: '4px' }} className="shimmer-box" />
                  <div style={{ width: '50%', height: '8px', background: '#e2e8f0', borderRadius: '4px' }} className="shimmer-box" />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: '0.5rem 1rem', marginTop: 'auto', borderTop: '1px solid #e8e8e8' }}>
            <Link href="/login" className="btn btn-dark" style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem' }} title="Log In">
              <LogOut size={14} style={{ flexShrink: 0 }} /> <span className="sidebar-text">Log In</span>
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
