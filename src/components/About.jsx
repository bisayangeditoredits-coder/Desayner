'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Users, Award, TrendingUp } from 'lucide-react';

const About = () => {
  return (
    <section id="about" className="about-section section-padding">
      <div className="container">
        <div className="about-grid">
          <motion.div 
            className="about-image"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="image-stack">
              <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80" alt="Creldesk Team" className="main-img" />
              <div className="image-overlay-card glass-card">
                <Users size={24} className="accent-icon" />
                <span>Expert Creative Team</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="about-content"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <span className="hero-tagline">Who We Are</span>
            <h2 className="section-title">Driven by Creativity, <br />Focused on Results</h2>
            <p className="about-text">
              Creldesk Studio was founded with a single mission: to empower creators and brands with world-class visual storytelling. Our team of designers, strategists, and producers work at the intersection of culture and technology to build brands that don't just exist—they lead.
            </p>
            
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-icon"><Award size={28} /></div>
                <div className="stat-info">
                  <h3>50+</h3>
                  <span>Brands Transformed</span>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon"><TrendingUp size={28} /></div>
                <div className="stat-info">
                  <h3>100M+</h3>
                  <span>Views Generated</span>
                </div>
              </div>
            </div>

            <p className="about-subtext">
              Whether you're an individual creator looking to define your voice or a global brand seeking to connect with the digital generation, we provide the tools and talent to make it happen.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default About;
