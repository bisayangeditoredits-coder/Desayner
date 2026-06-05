'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { PenTool, Video, Share2, Target } from 'lucide-react';

const services = [
  {
    icon: <PenTool size={32} />,
    title: "Branding",
    description: "Building unique visual identities that capture the essence of your creative vision."
  },
  {
    icon: <Target size={32} />,
    title: "Content Strategy",
    description: "Developing data-driven plans to ensure your content reaches and engages the right audience."
  },
  {
    icon: <Share2 size={32} />,
    title: "Social Media Management",
    description: "Full-service management to grow your community and maintain a consistent presence."
  },
  {
    icon: <Video size={32} />,
    title: "Video Production",
    description: "High-end cinematic video creation tailored for modern digital platforms."
  }
];

const Services = () => {
  return (
    <section id="services" className="services section-padding">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Our Services</h2>
          <div className="section-underline"></div>
        </div>
        
        <div className="services-grid">
          {services.map((service, index) => (
            <motion.div 
              key={index}
              className="glass-card service-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="service-icon">{service.icon}</div>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
