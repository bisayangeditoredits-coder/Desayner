import { BriefcaseBusiness, MapPin, Layers, Star } from 'lucide-react';
import JobList from '@/components/JobList';
import Footer from '@/components/Footer';
import '../../App.css';

export const metadata = {
  title: 'Remote Jobs | Creldesk Studio',
  description: 'Browse curated remote creative, freelance, product, marketing, and software jobs from multiple sources.',
};

export default function JobBoardPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', width: '100%' }}>
      <div style={{ padding: 'clamp(1rem, 5vw, 2rem)', width: '100%', boxSizing: 'border-box', flex: 1 }}>
        <div style={{
          position: 'relative',
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          borderRadius: '0',
          marginBottom: '3rem',
          border: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.02)',
          overflow: 'hidden',
          minHeight: '420px'
        }}>
          {/* Left Content */}
          <div style={{ flex: 1, padding: 'clamp(2.5rem, 5vw, 4.5rem)', position: 'relative', zIndex: 1, width: '60%', maxWidth: '60%' }}>
            <div style={{ 
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem', 
              color: '#ffffff', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em',
              marginBottom: '1.5rem', background: '#09090b', padding: '6px 14px', borderRadius: '4px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <BriefcaseBusiness size={12} color="#ffffff" />
              Remote Job Board
            </div>
            
            <h1 style={{ 
              color: '#09090b', 
              fontFamily: 'var(--font-jakarta)', 
              fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', 
              lineHeight: 0.95, 
              fontWeight: 900, 
              margin: 0, 
              letterSpacing: '-0.04em', 
              marginBottom: '1.5rem',
            }}>
              Find work that <br/><span style={{ color: '#0009fa', letterSpacing: '-0.05em' }}>matters.</span>
            </h1>
            
            <p style={{ 
              color: '#52525b', 
              fontSize: 'clamp(1rem, 1.8vw, 1.15rem)', 
              lineHeight: 1.5, 
              margin: '0 0 2.5rem',
              fontWeight: 500,
              letterSpacing: '-0.01em',
              maxWidth: '480px'
            }}>
              Discover hand-picked remote opportunities for designers, developers, and creative professionals.
            </p>

            <div style={{ 
              display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap',
              borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '1.5rem',
            }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Updated Daily
              </span>

              {/* Trust Indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginLeft: '0.5rem' }}>
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4" alt="User" style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid white', marginLeft: '-0.5rem', objectFit: 'cover' }} />
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=ffdfbf" alt="User" style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid white', marginLeft: '-0.5rem', objectFit: 'cover' }} />
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=John&backgroundColor=c0aede" alt="User" style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid white', marginLeft: '-0.5rem', objectFit: 'cover' }} />
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah&backgroundColor=d1d4f9" alt="User" style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid white', marginLeft: '-0.5rem', objectFit: 'cover' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} size={12} fill="#f59e0b" color="#f59e0b" style={{ marginRight: '1px' }} />
                    ))}
                  </div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#71717a' }}>
                    Join <span style={{ color: '#09090b', fontWeight: 800 }}>10,000+</span> designers
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Image on Right */}
          <div style={{
            position: 'absolute',
            right: 0, top: 0, bottom: 0, width: '45%',
            backgroundImage: 'linear-gradient(to right, #ffffff 0%, rgba(255,255,255,0) 40%), url("/group-graphic-designers-discussing-laptop-their-desk.jpeg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: 0
          }} />
        </div>

        <JobList />
      </div>
      <Footer />
    </div>
  );
}
