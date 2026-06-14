'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Palette, Box, LayoutTemplate, Image as ImageIcon, Type } from 'lucide-react';

const TABS = [
  { href: '/design-hub/stock-photos', label: 'Stock Photos', icon: ImageIcon },
  { href: '/design-hub/stock-assets', label: 'Stock Assets', icon: Box },
  { href: '/design-hub/colors',       label: 'Colors',       icon: Palette },
  { href: '/design-hub/fonts',        label: 'Fonts',        icon: Type },
  { href: '/design-hub/mockups',      label: 'Free Mockups', icon: LayoutTemplate },
];

export default function DesignHubLayout({ children }) {
  const pathname = usePathname();

  return (
    <div className="design-hub-layout" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '100vh', background: '#f8f9fa' }}>
      
      {/* Header and Tabs */}
      <div style={{ background: '#fff', borderBottom: '1px solid #eaeaea', padding: '1.5rem 2rem 0', position: 'sticky', top: 0, zIndex: 10 }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 1rem', color: '#111' }}>Design Hub</h1>
        
        <div style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', paddingBottom: '2px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
          {TABS.map((tab) => {
            const isActive = pathname === tab.href;
            const Icon = tab.icon;
            
            return (
              <Link 
                key={tab.href}
                href={tab.href}
                style={{
                  position: 'relative',
                  padding: '0.75rem 0',
                  fontSize: '0.95rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#000' : '#666',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  whiteSpace: 'nowrap',
                  transition: 'color 0.2s',
                }}
              >
                <Icon size={16} />
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="designHubTabIndicator"
                    style={{
                      position: 'absolute',
                      bottom: -1,
                      left: 0,
                      right: 0,
                      height: 3,
                      background: '#000',
                      borderRadius: '3px 3px 0 0',
                    }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1 }}>
        {children}
      </div>
    </div>
  );
}
