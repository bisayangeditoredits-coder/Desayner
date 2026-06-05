import React from 'react';
import { Zap, Shield, Layout, Box, Folder, Library } from 'lucide-react';
import styles from './Landing.module.css';

const features = [
  { icon: <Box size={28} />, title: "High-Res Portfolios", desc: "Upload 4K images with auto-compression. We instantly convert your assets to WebP to save bandwidth." },
  { icon: <Folder size={28} />, title: "Curated Collections", desc: "Organize your favorite projects into custom folders. Keep your inspiration organized and accessible." },
  { icon: <Shield size={28} />, title: "Safe Resources", desc: "Share external links safely. Our strict liability checks protect creators and the platform from copyright issues." },
  { icon: <Layout size={28} />, title: "Minimal UI", desc: "A distraction-free, sharp, monochromatic interface that puts your colorful work front and center." },
  { icon: <Library size={28} />, title: "Community Driven", desc: "Get real-time feedback, share templates, and engage with top-tier designers globally." },
  { icon: <Zap size={28} />, title: "Lightning Fast", desc: "Built on Edge infrastructure. Navigate through thousands of assets without skipping a frame." }
];

export default function FeaturesGrid() {
  return (
    <section id="features" className={styles.featuresSection}>
      <div className={styles.featuresHeader}>
        <span className={styles.featuresBadge}>Platform Capabilities</span>
        <h2 className={styles.featuresTitle}>Everything you need to scale.</h2>
        <p className={styles.featuresDesc}>
          Desayner provides secure infrastructure to manage, organize, and share your creative workflow with the world.
        </p>
      </div>

      <div className={styles.featuresGrid}>
        {features.map((f, i) => (
          <div key={i} className={styles.featureCard}>
            <div className={styles.featureIcon}>
              {f.icon}
            </div>
            <h3 className={styles.featureCardTitle}>{f.title}</h3>
            <p className={styles.featureCardDesc}>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
