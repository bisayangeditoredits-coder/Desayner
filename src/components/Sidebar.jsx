'use client';
import React, { useState, useEffect, useLayoutEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  Home, FolderOpen, Users, Users2, Bookmark, Plus, Settings,
  LogOut, ChevronDown, ChevronUp, Library, MessageSquare, Briefcase, ShoppingBag, Box, PlaySquare, Compass, Sparkles
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import UserAvatar from './UserAvatar';
import { useMobileNav } from '@/components/MobileNavProvider';

const MAIN_NAV_ITEMS = [
  { href: '/',             icon: Home,          label: 'Home',        public: true },
  { href: '/projects',     icon: Compass,       label: 'Explore',     public: true },
];

const PROJECT_SUB_ITEMS = [
  { href: '/job-board',         label: 'JOB BOARD',         public: true },
  { href: '/challenges',        label: 'CHALLENGES',        public: true },
];

const COMMUNITY_ITEMS = [
  { href: '/creators',     icon: Users2,        label: 'Creators',    public: true },
  { href: '/community',    icon: Users,         label: 'Community',   public: true },
  { href: '/resources',    icon: Library,       label: 'Resources',   public: true },
];

const DESIGN_HUB_ITEMS = [
  { href: '/asset-store',  icon: ShoppingBag,   label: 'ASSET STORE', public: true },
  { href: '/mockups',      icon: Box,           label: 'MOCKUPS',     public: true },
  { href: '/tutorials',    icon: PlaySquare,    label: 'TUTORIALS',   public: true },
];

export default function Sidebar({ className = '' }) {
  const pathname = usePathname();
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useMobileNav();
  const [user, setUser] = useState(null);
  const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

  useIsomorphicLayoutEffect(() => {
    if (typeof document !== 'undefined') {
      const hasAuth = /sb-[a-z0-9]+-auth-token/.test(document.cookie);
      if (hasAuth && !user) {
        setUser({ id: 'optimistic' });
      }
    }
  }, []);
  const [profile, setProfile] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) setProfile(data);
      } else {
        setUser(null);
      }
    }
    load();

    return () => {
      mounted = false;
    }
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  function isActive(href) {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  }

  return (
    <>
      {isMobileMenuOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setIsMobileMenuOpen(false)}
          aria-label="Close Sidebar"
        />
      )}
      <aside className={`sidebar ${className} ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
      <div style={{ padding: '1.25rem 1.25rem 0', borderBottom: '1px solid #e8e8e8', paddingBottom: '1.25rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
        <img src="/Main_logo.png?v=4" alt="Desayner" style={{ width: '220px', height: 'auto', display: 'block' }} />
      </div>

      {/* Create button */}
      <div style={{ padding: '0.75rem 1rem' }}>
        <Link
          href="/projects/new"
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem', padding: '0.6rem' }}
        >
          <Plus size={15} strokeWidth={2.5} /> New Project
        </Link>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {MAIN_NAV_ITEMS.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} className={`nav-item ${isActive(href) ? 'active' : ''}`}>
            <Icon size={16} strokeWidth={isActive(href) ? 2.5 : 1.75} />
            {label}
          </Link>
        ))}

        <Link 
          href="/inspirations" 
          className={`nav-item ${isActive('/inspirations') ? 'active' : ''}`}
        >
          <Sparkles size={16} strokeWidth={isActive('/inspirations') ? 2.5 : 1.75} />
          Inspirations
        </Link>

        <Link 
          href="/collections" 
          className={`nav-item ${isActive('/collections') ? 'active' : ''}`}
        >
          <Bookmark size={16} strokeWidth={isActive('/collections') ? 2.5 : 1.75} />
          Collections
        </Link>

        {/* Collapsible Projects */}
        <div className={`nav-item ${pathname.startsWith('/projects') ? 'active' : ''}`} style={{ paddingRight: '0' }}>
          <Link href="/projects" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'inherit' }}>
            <FolderOpen size={16} strokeWidth={pathname.startsWith('/projects') ? 2.5 : 1.75} />
            <span style={{ flex: 1, textAlign: 'left' }}>Projects</span>
          </Link>
          <button onClick={() => setProjectsExpanded(!projectsExpanded)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '0 1rem', height: '100%', display: 'flex', alignItems: 'center' }}>
            {projectsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {projectsExpanded && (
          <div className="sidebar-sub-menu">
            {PROJECT_SUB_ITEMS.map(({ href, label }) => (
              <Link key={href} href={href} className={`nav-sub-item ${isActive(href) ? 'active' : ''}`}>
                {label}
              </Link>
            ))}
          </div>
        )}

        {/* Community Items */}
        {COMMUNITY_ITEMS.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} className={`nav-item ${isActive(href) ? 'active' : ''}`}>
            <Icon size={16} strokeWidth={isActive(href) ? 2.5 : 1.75} />
            {label}
          </Link>
        ))}

        {/* Design Hub Section */}
        <div className="sidebar-section-title">DESIGN HUB</div>
        {DESIGN_HUB_ITEMS.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} className={`nav-item ${isActive(href) ? 'active' : ''}`}>
            <Icon size={16} strokeWidth={isActive(href) ? 2.5 : 1.75} />
            {label}
          </Link>
        ))}
      </nav>

      {/* Bottom user section */}
      {user && (
        <div style={{ borderTop: '1px solid #e8e8e8', padding: '0.75rem 1rem', marginTop: 'auto', position: 'relative' }}>
          <Link href="/settings" className="nav-item" style={{ marginBottom: '0.25rem' }}>
            <Settings size={16} strokeWidth={1.75} /> Settings
          </Link>

          {profile && (
          <div>
            <button
              onClick={() => setUserMenuOpen(p => !p)}
              className="nav-item"
              style={{ padding: '0.6rem 0.5rem', borderRadius: 0 }}
            >
              <UserAvatar src={profile.avatar_url} name={profile.full_name || profile.username} size={28} />
              <div style={{ flex: 1, textAlign: 'left', overflow: 'hidden' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0a0a0a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {profile.full_name || profile.username}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#9b9b9b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  @{profile.username}
                </div>
              </div>
              {/* Green dot for online status mimicking the reference */}
              <div style={{ width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%', flexShrink: 0, marginRight: '0.5rem' }}></div>
              <ChevronDown size={14} color="#9b9b9b" style={{ transform: userMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
            </button>

            {userMenuOpen && (
              <div style={{
                position: 'absolute', bottom: '100%', left: '1rem', right: '1rem',
                background: 'white', border: '1px solid #e8e8e8',
                zIndex: 200, padding: '0.25rem 0',
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
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            )}
          </div>
          )}
        </div>
      )}
    </aside>
    </>
  );
}
