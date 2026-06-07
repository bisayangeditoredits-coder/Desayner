import React from 'react';

export default function TermsPage() {
  return (
    <>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'var(--text-main)' }}>
            Terms and Conditions
          </h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Last updated: {new Date().toLocaleDateString()}</p>
          
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-main)' }}>1. Introduction</h2>
            <p style={{ color: 'var(--text-dim)', lineHeight: '1.6' }}>
              Welcome to Creldesk Studio (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). By accessing or using our platform, you agree to be bound by these Terms and Conditions. Please read them carefully before using our services.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-main)' }}>2. User Accounts</h2>
            <p style={{ color: 'var(--text-dim)', lineHeight: '1.6' }}>
              When you create an account with us, you must provide accurate, complete, and up-to-date information. You are solely responsible for safeguarding the password that you use to access the service and for any activities or actions under your password.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-main)' }}>3. Intellectual Property Rights</h2>
            <p style={{ color: 'var(--text-dim)', lineHeight: '1.6' }}>
              The content you upload remains yours. However, by posting content on Creldesk Studio, you grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content in connection with the service. Our original platform design, logo, and codebase remain our exclusive property.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-main)' }}>4. Prohibited Conduct</h2>
            <ul style={{ color: 'var(--text-dim)', lineHeight: '1.6', listStyleType: 'disc', paddingLeft: '1.5rem' }}>
              <li style={{ marginBottom: '0.5rem' }}>Uploading offensive, illegal, or unauthorized copyrighted materials.</li>
              <li style={{ marginBottom: '0.5rem' }}>Attempting to disrupt or compromise the integrity or security of our platform.</li>
              <li style={{ marginBottom: '0.5rem' }}>Using the service to distribute spam or malicious software.</li>
              <li style={{ marginBottom: '0.5rem' }}>Harassing, abusing, or harming other users.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-main)' }}>5. Termination</h2>
            <p style={{ color: 'var(--text-dim)', lineHeight: '1.6' }}>
              We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the service will immediately cease.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-main)' }}>6. Limitation of Liability</h2>
            <p style={{ color: 'var(--text-dim)', lineHeight: '1.6' }}>
              In no event shall Creldesk Studio, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the service.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-main)' }}>7. Changes to Terms</h2>
            <p style={{ color: 'var(--text-dim)', lineHeight: '1.6' }}>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of any significant changes. By continuing to access or use our service after those revisions become effective, you agree to be bound by the revised terms.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-main)' }}>8. Contact Us</h2>
            <p style={{ color: 'var(--text-dim)', lineHeight: '1.6' }}>
              If you have any questions about these Terms, please contact us at support@creldesk.com.
            </p>
          </section>

        </div>
      </>
  );
}
