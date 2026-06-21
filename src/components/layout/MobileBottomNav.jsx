'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Plus, Bookmark, User } from 'lucide-react';
import useProfileStore from '@/store/useProfileStore';
import './MobileBottomNav.css';

function subscribeToMounted() {
  return () => {};
}

function getMountedSnapshot() {
  return true;
}

function getMountedServerSnapshot() {
  return false;
}

export default function MobileBottomNav() {
  const pathname = usePathname();
  const mounted = useSyncExternalStore(subscribeToMounted, getMountedSnapshot, getMountedServerSnapshot);
  const profile = useProfileStore((s) => s.profile);

  useEffect(() => {
    const refresh = () => useProfileStore.getState().invalidate();
    window.addEventListener('profile_updated', refresh);
    return () => window.removeEventListener('profile_updated', refresh);
  }, []);

  function isActive(href) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href) && !pathname.includes('new');
  }

  const profileLink = (mounted && profile?.username) ? `/profile/${profile.username}` : '/login';

  return (
    <nav className="mobile-bottom-nav">
      <Link href="/" className={`mobile-nav-item ${isActive('/') ? 'active' : ''}`}>
        <Home size={20} strokeWidth={isActive('/') ? 2.5 : 1.75} />
        <span className="mobile-nav-label">Inspiration</span>
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

      <Link href="/saved" className={`mobile-nav-item ${isActive('/saved') ? 'active' : ''}`}>
        <Bookmark size={20} strokeWidth={isActive('/saved') ? 2.5 : 1.75} />
        <span className="mobile-nav-label">Saved</span>
      </Link>

      <Link href={profileLink} className={`mobile-nav-item ${pathname.startsWith('/profile') ? 'active' : ''}`}>
        <User size={20} strokeWidth={pathname.startsWith('/profile') ? 2.5 : 1.75} />
        <span className="mobile-nav-label">Profile</span>
      </Link>
    </nav>
  );
}
