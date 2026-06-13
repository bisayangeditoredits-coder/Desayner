import React from 'react';
import { Mail, MapPin, Building } from 'lucide-react';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'About Us | CreldeskStudio',
  description: 'Learn more about CreldeskStudio and our mission to elevate modern creators.',
};

export default function AboutPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', width: '100%' }}>
      <div style={{ padding: 'clamp(2rem, 5vw, 4rem)', width: '100%', maxWidth: '800px', margin: '0 auto', boxSizing: 'border-box', flex: 1 }}>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, color: '#0f172a', marginBottom: '1rem', letterSpacing: '-0.03em' }}>
          About Us
        </h1>
        <p style={{ color: '#475569', fontSize: '1.2rem', lineHeight: 1.6, marginBottom: '4rem' }}>
          We are building the premium platform for modern creators. CreldeskStudio connects top-tier designers, developers, and creatives with global opportunities, providing the tools needed to build stunning portfolios and land remote jobs.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f0fdfa', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <Building size={24} color="#0d9488" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>Our Mission</h3>
            <p style={{ color: '#64748b', lineHeight: 1.6 }}>To empower creators globally by providing a seamless, secure, and beautiful platform to showcase work and find opportunities.</p>
          </div>
          
          <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <Mail size={24} color="#4f46e5" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>Contact Us</h3>
            <p style={{ color: '#64748b', lineHeight: 1.6, marginBottom: '1rem' }}>We'd love to hear from you. For support, partnerships, or feedback.</p>
            <a href="mailto:support@desayner.com" style={{ fontWeight: 700, color: '#2d43e8', textDecoration: 'none' }}>support@desayner.com</a>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
