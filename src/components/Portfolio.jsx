'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const projects = [
  { id: 1, title: "Neon Pulse Branding", category: "Branding", description: "Bold neon-inspired visual identity for a tech-focused creator agency.", image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=800&q=80" },
  { id: 2, title: "Creator Growth Series", category: "Social Media", description: "Comprehensive social strategy and asset creation for a top-tier YouTube personality.", image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=800&q=80" },
  { id: 3, title: "Tech Vision Identity", category: "Branding", description: "Minimalist and modern corporate branding for a next-gen silicon valley startup.", image: "https://images.unsplash.com/photo-1634942537034-2531766767d1?auto=format&fit=crop&w=800&q=80" },
  { id: 4, title: "Lifestyle Campaign", category: "Social Media", description: "High-impact social media campaign focusing on modern lifestyle and aesthetics.", image: "https://images.unsplash.com/photo-1493612276216-ee3925520721?auto=format&fit=crop&w=800&q=80" },
  { id: 5, title: "Cinematic Reel 2024", category: "Video", description: "Showcasing high-end video production and cinematic storytelling capabilities.", image: "https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=800&q=80" },
  { id: 6, title: "Modern Vibe Social", category: "Social Media", description: "Dynamic social media assets and community management for fashion brands.", image: "https://images.unsplash.com/photo-1557838923-2985c318be48?auto=format&fit=crop&w=800&q=80" },
];

const Portfolio = () => {
  const [filter, setFilter] = useState('All');
  const categories = ['All', 'Branding', 'Social Media', 'Video'];

  const filteredProjects = filter === 'All' 
    ? projects 
    : projects.filter(p => p.category === filter);

  return (
    <section id="portfolio" className="portfolio section-padding">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Selected Work</h2>
          <div className="section-underline"></div>
        </div>

        <div className="portfolio-filters">
          {categories.map(cat => (
            <button 
              key={cat} 
              className={`filter-btn ${filter === cat ? 'active' : ''}`}
              onClick={() => setFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <motion.div layout className="portfolio-grid">
          <AnimatePresence mode='popLayout'>
            {filteredProjects.map((project) => (
              <motion.div 
                key={project.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="portfolio-item"
              >
                <div className="portfolio-img-wrapper">
                  <img src={project.image} alt={project.title} />
                  <div className="portfolio-overlay">
                    <span className="project-category">{project.category}</span>
                    <h3 className="project-title">{project.title}</h3>
                    <p className="project-desc">{project.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};

export default Portfolio;
