'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

const Hero = () => {
  return (
    <section id="home" className="hero section-padding">
      <div className="hero-background">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>
      
      <div className="container hero-content">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="hero-tagline">Premium Content Agency</span>
          <h1 className="hero-title">
            Elevating Brands Through <br />
            <span className="gradient-text">Masterful Storytelling</span>
          </h1>
          <p className="hero-description">
            We partner with modern creators and brands to craft compelling visual identities and high-impact content that resonates.
          </p>
          <div className="hero-btns">
            <a href="#contact" className="btn btn-primary">
              Let's Collaborate <ChevronRight size={20} />
            </a>
            <a href="#portfolio" className="btn btn-outline">
              View Our Work
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
