'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Plus, Users, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import './MobileBottomNav.css';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [profile, setProfile] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    // Check sessionStorage first to avoid a DB fetch on every page navigation
    const cached = typeof window !== 'undefined' && sessionStorage.getItem('mnav_profile');
    if (cached) {
      try { setProfile(JSON.parse(cached)); return; } catch {}
    }
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('username').eq('id', user.id).single();
        if (data) {
          setProfile(data);
          sessionStorage.setItem('mnav_profile', JSON.stringify(data));
        }
      }
    }
    load();
  }, []);

  function isActive(href) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href) && !pathname.includes('new');
  }

  // Profile link fallback to /login if not logged in
  const profileLink = profile ? `/profile/${profile.username}` : '/login';

  return (
    <nav className="mobile-bottom-nav">
      <Link href="/" className={`mobile-nav-item ${isActive('/') ? 'active' : ''}`}>
        <Home size={20} strokeWidth={isActive('/') ? 2.5 : 1.75} />
        <span className="mobile-nav-label">Home</span>
      </Link>
      
      <Link href="/projects" className={`mobile-nav-item ${isActive('/projects') ? 'active' : ''}`}>
        <Compass size={20} strokeWidth={isActive('/projects') ? 2.5 : 1.75} />
        <span className="mobile-nav-label">Explore</span>
      </Link>
      
      <Link href="/projects/new" className="mobile-nav-item-create" aria-label="Create New Project">
        <div className="create-icon-wrapper">
          <Plus size={20} strokeWidth={3} />
        </div>
      </Link>
      
      <Link href="/community" className={`mobile-nav-item ${isActive('/community') ? 'active' : ''}`}>
        <Users size={20} strokeWidth={isActive('/community') ? 2.5 : 1.75} />
        <span className="mobile-nav-label">Community</span>
      </Link>
      
      <Link href={profileLink} className={`mobile-nav-item ${pathname.startsWith('/profile') || pathname.startsWith('/login') ? 'active' : ''}`}>
        <User size={20} strokeWidth={pathname.startsWith('/profile') || pathname.startsWith('/login') ? 2.5 : 1.75} />
        <span className="mobile-nav-label">Profile</span>
      </Link>
    </nav>
  );
}
