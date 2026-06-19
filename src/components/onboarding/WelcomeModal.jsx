'use client';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Image from 'next/image';

export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has already seen the welcome modal
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      // Small delay so it pops up after initial render smoothly
      const timer = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const closeModal = () => {
    setIsOpen(false);
    localStorage.setItem('hasSeenWelcome', 'true');
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      // High opacity dark background for low-end devices, with subtle blur for high-end
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .welcome-modal-container {
          display: flex;
          background: white;
          border-radius: 16px;
          overflow: hidden;
          width: 100%;
          max-width: 900px;
          min-height: 500px;
          box-shadow: 0 24px 48px rgba(0,0,0,0.3);
          animation: slideUp 0.4s ease-out;
          position: relative;
        }
        .welcome-modal-left {
          flex: 1;
          background: #2d43e8;
          background-image: linear-gradient(135deg, #2d43e8 0%, #1a22ff 100%);
          padding: 3rem 2.5rem;
          color: white;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .welcome-modal-right {
          flex: 1;
          position: relative;
          background: #f0f0f0;
          display: none;
        }
        @media (min-width: 768px) {
          .welcome-modal-right {
            display: block;
          }
        }
        @media (max-width: 767px) {
          .welcome-modal-container {
            max-height: 90vh;
            overflow-y: auto;
            border-radius: 20px;
          }
          .welcome-modal-left {
            padding: 2.5rem 1.5rem;
          }
          .welcome-modal-left h2 {
            font-size: 2rem !important;
          }
          .welcome-modal-left p {
            font-size: 0.85rem !important;
            line-height: 1.5 !important;
            margin-bottom: 1.5rem !important;
          }
          .welcome-modal-left img {
            width: 140px !important;
          }
        }
        .welcome-modal-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s;
          z-index: 10;
        }
        .welcome-modal-close:hover {
          background: rgba(255,255,255,0.4);
        }
      `}</style>

      <div className="welcome-modal-container">
        
        {/* Left Side: Text Content */}
        <div className="welcome-modal-left">
          <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
            <img src="/desayner-logo-whiteversiom.png" alt="Desayner" style={{ width: '180px', height: 'auto' }} />
          </div>

          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, margin: '0 0 1rem 0', lineHeight: 1.1 }}>
            Welcome
          </h2>
          
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', lineHeight: 1.6, textAlign: 'justify', marginBottom: '1.5rem', whiteSpace: 'pre-line' }}>
            Welcome to Desayner, the ultimate creative sanctuary built exclusively for passionate designers, digital artists, and visionaries. Dive into our massive, high-quality library of free stock photos, instantly generate infinite aesthetic color palettes, and seamlessly organize your visual inspiration into personalized moodboards. Beyond just tools, Desayner is a thriving platform where you can build your professional portfolio and showcase your latest masterpieces to the world. Whether you are hunting for clients or simply looking for your next big spark of inspiration, you have finally found your home. Your design journey starts right here, right now.
          </p>

          <div>
            <button 
              onClick={closeModal}
              style={{
                background: '#e6e82d', // Yellow button like in the mockup
                color: '#231f20',
                border: 'none',
                padding: '0.85rem 2rem',
                borderRadius: 30,
                fontWeight: 800,
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                transition: 'transform 0.15s, box-shadow 0.15s'
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Get Started!
            </button>
          </div>
        </div>

        {/* Right Side: Image */}
        <div className="welcome-modal-right">
          <button className="welcome-modal-close" onClick={closeModal} aria-label="Close modal">
            <X size={18} color="#231f20" />
          </button>
          <Image 
            src="/welcome-image.jpeg" 
            alt="Designers collaborating" 
            fill
            priority
            sizes="(max-width: 768px) 0vw, 450px"
            style={{ 
              objectFit: 'cover',
              objectPosition: 'right center'
            }}
          />
        </div>

        {/* Mobile close button (only visible on small screens where right side is hidden) */}
        <button 
          className="welcome-modal-close" 
          onClick={closeModal} 
          style={{ right: '1rem', color: 'white', background: 'rgba(0,0,0,0.2)' }}
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

      </div>
    </div>
  );
}
