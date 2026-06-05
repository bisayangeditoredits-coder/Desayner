import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles } from 'lucide-react';
import styles from './Landing.module.css';

export default function HeroSection() {
  return (
    <section className={styles.heroSection}>
      <div className={styles.heroBg}></div>
      
      <div className={styles.heroFadeIn}>
        <span className={styles.heroBadge}>
          <Sparkles size={14} /> Desayner 2.0 is Live
        </span>
        <h1 className={styles.heroTitle}>
          Your Complete Hub for <br/>
          <span className={styles.heroTitleHighlight}>Creative Assets.</span>
        </h1>
        <p className={styles.heroDesc}>
          Desayner is a secure, premium platform for managing portfolios, curating collections, and safely sharing resources with the community.
        </p>
        <div className={styles.heroActions}>
          <Link href="/" className={styles.heroBtnPrimary}>
            Start Exploring
          </Link>
          <Link href="/login" className={styles.heroBtnSecondary}>
            Sign In
          </Link>
        </div>
      </div>

      {/* Dashboard Preview UI */}
      <div className={`${styles.dashboardPreview} ${styles.heroSlideUp}`}>
        {/* Faux Window Header */}
        <div className={styles.windowHeader}>
          <div className={`${styles.windowDot} ${styles.dotRed}`} />
          <div className={`${styles.windowDot} ${styles.dotYellow}`} />
          <div className={`${styles.windowDot} ${styles.dotGreen}`} />
        </div>
        <Image 
          src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80" 
          alt="Desayner Platform Preview" 
          width={1200} 
          height={700} 
          className={styles.previewImage}
          loading="lazy"
        />
      </div>
    </section>
  );
}
