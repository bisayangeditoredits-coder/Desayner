'use client';
import Link from 'next/link';
import NewsletterSubscribe from './NewsletterSubscribe';

export default function Footer() {
  return (
    <footer style={{
      width: '100%',
      padding: '4rem 2rem 2rem',
      background: '#fafafa', // Light background like Dribbble
      color: '#0f172a',
      marginTop: 'auto',
      borderTop: '1px solid #e2e8f0',
      fontFamily: '"Inter", "Segoe UI", sans-serif'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
          
          {/* Brand */}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '1rem', color: '#0f172a' }}>
              Desayner<span style={{ color: '#2d43e8' }}>.</span>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, maxWidth: '300px' }}>
              The premium platform for modern creators. Share your work, find inspiration, and get hired by top brands globally.
            </p>
          </div>

          {/* Platform */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>Platform</h4>
            <Link href="/" style={{ color: '#475569', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s', fontWeight: 500 }} onMouseOver={e => e.target.style.color='#0f172a'} onMouseOut={e => e.target.style.color='#475569'}>Explore Work</Link>
            <Link href="/designers" style={{ color: '#475569', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s', fontWeight: 500 }} onMouseOver={e => e.target.style.color='#0f172a'} onMouseOut={e => e.target.style.color='#475569'}>Find Creators</Link>
          </div>

          {/* Legal */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>Company</h4>
            <Link href="/privacy" style={{ color: '#475569', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s', fontWeight: 500 }} onMouseOver={e => e.target.style.color='#0f172a'} onMouseOut={e => e.target.style.color='#475569'}>Privacy Policy</Link>
            <Link href="/terms" style={{ color: '#475569', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s', fontWeight: 500 }} onMouseOver={e => e.target.style.color='#0f172a'} onMouseOut={e => e.target.style.color='#475569'}>Terms of Service</Link>
            <Link href="/about" style={{ color: '#475569', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s', fontWeight: 500 }} onMouseOver={e => e.target.style.color='#0f172a'} onMouseOut={e => e.target.style.color='#475569'}>About Us</Link>
          </div>

          {/* Newsletter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <NewsletterSubscribe />
          </div>
        </div>

        {/* Bottom */}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '2rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0, fontWeight: 500 }}>
            &copy; {new Date().getFullYear()} CreldeskStudio. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <a href="#" style={{ color: '#475569', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color='#0f172a'} onMouseOut={e => e.target.style.color='#475569'}>Twitter</a>
            <a href="#" style={{ color: '#475569', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color='#0f172a'} onMouseOut={e => e.target.style.color='#475569'}>LinkedIn</a>
            <a href="mailto:support@desayner.com" style={{ color: '#475569', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color='#0f172a'} onMouseOut={e => e.target.style.color='#475569'}>Contact Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
