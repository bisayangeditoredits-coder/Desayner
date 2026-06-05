import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import styles from './Landing.module.css';

export default function CtaSection() {
  return (
    <section className={styles.ctaSection}>
      <div className={styles.ctaBox}>
        <div className={styles.ctaBg1}></div>
        <div className={styles.ctaBg2}></div>
        
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Ready to organize your workflow?</h2>
          <p className={styles.ctaDesc}>
            Join the Desayner community today and get instant access to thousands of professional resources.
          </p>
          <Link href="/" className={styles.ctaBtn}>
            Open App <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
