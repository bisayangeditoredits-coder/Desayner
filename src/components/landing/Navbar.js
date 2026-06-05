import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import styles from './Landing.module.css';

export default function Navbar() {
  return (
    <nav className={styles.nav}>
      <Image 
        src="/Main_logo.png" 
        alt="Desayner" 
        width={154} 
        height={36} 
        className={styles.navLogo} 
        priority 
      />
      <div className={styles.navLinks}>
        <a href="#features" className={styles.navLink}>Platform</a>
        <a href="#community" className={styles.navLink}>Community</a>
        <Link href="/" className={styles.navButton}>
          Open Desayner <ArrowRight size={14} />
        </Link>
      </div>
    </nav>
  );
}
