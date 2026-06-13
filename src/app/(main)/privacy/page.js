import React from 'react';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Privacy Policy | CreldeskStudio',
  description: 'Our commitment to protecting your privacy and personal data.',
};

export default function PrivacyPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', width: '100%' }}>
      <div style={{ padding: 'clamp(2rem, 5vw, 4rem)', width: '100%', maxWidth: '800px', margin: '0 auto', boxSizing: 'border-box', flex: 1 }}>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, color: '#0f172a', marginBottom: '1rem', letterSpacing: '-0.03em' }}>
          Privacy Policy
        </h1>
        <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: '3rem' }}>
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        <div style={{ color: '#334155', lineHeight: 1.8, fontSize: '1.05rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <section>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>1. Introduction</h2>
            <p>
              Welcome to CreldeskStudio. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>2. The Data We Collect</h2>
            <p>
              We may collect, use, store and transfer different kinds of personal data about you, including:
            </p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li><strong>Identity Data:</strong> includes first name, last name, username.</li>
              <li><strong>Contact Data:</strong> includes email address.</li>
              <li><strong>Profile Data:</strong> includes your portfolio, projects, feedback requests, and preferences.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>3. Data Security</h2>
            <p>
              We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way, altered, or disclosed. We use advanced database security (Row Level Security) to ensure your projects remain yours.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>4. Contact Us</h2>
            <p>
              If you have any questions about this privacy policy or our privacy practices, please contact us at <a href="mailto:support@desayner.com" style={{ color: '#2d43e8', fontWeight: 600 }}>support@desayner.com</a>.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
