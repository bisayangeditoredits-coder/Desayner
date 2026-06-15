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
      
      {/* Premium Glassmorphic Header */}
      <div 
        style={{ 
          background: 'rgba(255, 255, 255, 0.85)', 
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(0,0,0,0.06)', 
          padding: '1.5rem 2rem 1rem', 
          position: 'sticky', 
          top: 0, 
          zIndex: 10 
        }}
      >
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ 
            fontSize: '2.25rem', 
            fontWeight: 800, 
            margin: '0 0 0.5rem', 
            letterSpacing: '-0.03em',
            background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Design Hub
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '1rem', fontWeight: 400, maxWidth: '700px', lineHeight: 1.5 }}>
            Discover curated high-quality assets, vibrant colors, premium fonts, and beautiful mockups for your next creative project.
          </p>
        </div>
        
        <div style={{ 
          display: 'flex', 
          gap: '0.75rem', 
          overflowX: 'auto', 
          paddingBottom: '0.25rem', 
          scrollbarWidth: 'none', 
          WebkitOverflowScrolling: 'touch' 
        }}>
          {TABS.map((tab) => {
            const isActive = pathname === tab.href;
            const Icon = tab.icon;
            
            return (
              <Link 
                key={tab.href}
                href={tab.href}
                style={{
                  position: 'relative',
                  padding: '0.6rem 1.25rem',
                  fontSize: '0.95rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#ffffff' : '#475569',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  whiteSpace: 'nowrap',
                  transition: 'color 0.2s ease',
                  borderRadius: '999px',
                  WebkitTapHighlightColor: 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = '#0f172a';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = '#475569';
                }}
              >
                <span style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} style={{ opacity: isActive ? 1 : 0.7 }} />
                  {tab.label}
                </span>
                
                {/* Active Tab Sliding Pill Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="designHubTabIndicator"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(135deg, #2d43e8, #4f6bff)',
                      borderRadius: '999px',
                      boxShadow: '0 4px 14px rgba(45, 67, 232, 0.3)',
                      zIndex: 1,
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}

                {/* Subtle hover background for inactive tabs */}
                {!isActive && (
                  <div 
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: '#f1f5f9',
                      borderRadius: '999px',
                      zIndex: 0,
                      opacity: 0,
                      transition: 'opacity 0.2s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
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
