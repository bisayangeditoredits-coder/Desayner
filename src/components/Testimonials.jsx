'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

const testimonials = [
  {
    name: "Alex Rivera",
    role: "Content Creator",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    content: "Creldesk Studio completely transformed my brand's visual identity. Their content strategy helped me grow my audience by 40% in just three months."
  },
  {
    name: "Sarah Chen",
    role: "Marketing Director",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    content: "The level of professionalism and creativity they bring to video production is unmatched. Every project they've delivered has exceeded our expectations."
  },
  {
    name: "Jordan Smith",
    role: "Founder of Vibe Social",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    content: "From branding to social media management, the team at Creldesk is simply the best. They truly understand modern creator culture and how to stand out."
  }
];

const Testimonials = () => {
  return (
    <section id="testimonials" className="testimonials section-padding">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">What Our Clients Say</h2>
          <div className="section-underline"></div>
        </div>

        <div className="testimonials-grid">
          {testimonials.map((t, index) => (
            <motion.div 
              key={index}
              className="glass-card testimonial-card"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="testimonial-icon">
                <Quote size={24} />
              </div>
              <p className="testimonial-content">"{t.content}"</p>
              <div className="testimonial-author">
                <img src={t.image} alt={t.name} className="author-img" />
                <div className="author-info">
                  <h4>{t.name}</h4>
                  <span>{t.role}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
