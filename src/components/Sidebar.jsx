'use client';
import React, { useState, useEffect, useLayoutEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  Home, FolderOpen, Users, Users2, Bookmark, Plus, Settings,
  LogOut, ChevronDown, ChevronUp, Library, MessageSquare, Briefcase, ShoppingBag, Box, PlaySquare, Compass, MessageSquareCode, Image as ImageIcon,
  Palette, Type
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
  { href: '/designers',    icon: Users2,        label: 'Designers',   public: true },
  { href: '/community',    icon: Users,         label: 'Community',   public: true },
  { href: '/resources',    icon: Library,       label: 'Resources',   public: true },
];

const DESIGN_HUB_ITEMS = [
  // { href: '/asset-store',  icon: ShoppingBag,   label: 'ASSET STORE', public: true },
  { href: '/colors',       icon: Palette,       label: 'COLORS',       public: true },
  { href: '/stock-photos', icon: ImageIcon,     label: 'STOCK PHOTOS', public: true },
  { href: '/fonts',        icon: Type,          label: 'FONTS',        public: true },
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
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;
      if (user) {
        setUser(user);
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (mounted && data) setProfile(data);
      } else {
        setUser(null);
      }
    }
    load();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  function isActive(href) {
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
        <Link href="/">
          <img src="/desayner-logo.png" alt="Desayner" style={{ width: '150px', height: 'auto', display: 'block' }} />
        </Link>
      </div>

      {/* Create button */}
      <div style={{ padding: '0.75rem 1rem' }}>
        <Link
          href="/projects/new"
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem', padding: '0.6rem', textDecoration: 'none' }}
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
          href="/feedback" 
          className={`nav-item ${isActive('/feedback') ? 'active' : ''}`}
        >
          <MessageSquareCode size={16} strokeWidth={isActive('/feedback') ? 2.5 : 1.75} />
          Feedback
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
        <div className="sidebar-section-title font-grotesk">DESIGN HUB</div>
        {DESIGN_HUB_ITEMS.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} className={`nav-item ${isActive(href) ? 'active' : ''}`}>
            <Icon size={16} strokeWidth={isActive(href) ? 2.5 : 1.75} />
            {label}
          </Link>
        ))}
      </nav>

      {/* --- PROMO WIDGET --- */}
      <div style={{ padding: '0 1rem', marginTop: '1.5rem', marginBottom: '1rem' }}>
        <div style={{ background: 'linear-gradient(135deg, #5865F2 0%, #4752C4 100%)', borderRadius: '12px', padding: '1rem', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 15px rgba(88, 101, 242, 0.2)' }}>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <svg width="15" height="15" viewBox="0 0 127.14 96.36" fill="currentColor">
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a67.73,67.73,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14c0,0,.04-.06.05-.09A71.09,71.09,0,0,0,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.3,46,96.19,53,91.08,65.69,84.69,65.69Z"/>
              </svg> Join Discord
            </h4>
            <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.7rem', opacity: 0.9, lineHeight: 1.4 }}>
              Connect with designers, share work, and find jobs.
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
