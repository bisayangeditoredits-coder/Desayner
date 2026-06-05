import React from 'react';
import styles from './Landing.module.css';

export default function SocialProof() {
  return (
    <section className={styles.socialSection}>
      <p className={styles.socialTitle}>Join thousands of creators from</p>
      <div className={styles.socialLogos}>
        <span className={styles.socialLogo}>Google</span>
        <span className={styles.socialLogo}>Spotify</span>
        <span className={styles.socialLogo}>Figma</span>
        <span className={styles.socialLogo}>Stripe</span>
        <span className={styles.socialLogo}>Vercel</span>
      </div>
    </section>
  );
}
