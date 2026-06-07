'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';

const CTA = () => {
  return (
    <section id="contact" className="cta-section section-padding">
      <div className="container">
        <motion.div 
          className="cta-card glass-card"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <div className="cta-content">
            <h2>Ready to transform your brand?</h2>
            <p>Let&apos;s collaborate and create something extraordinary together.</p>
            <form className="cta-form" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Your email address" required />
              <button type="submit" className="btn btn-primary">
                Get Started <Send size={18} style={{ marginLeft: '8px' }} />
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;
