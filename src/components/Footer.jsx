import React from 'react';
import { Camera, Send, Briefcase, Video } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <img src="/Main_logo.png" alt="Creldesk Studio" className="footer-logo" />
            <p>Premium content creation and branding for the modern digital era.</p>
          </div>
          
          <div className="footer-links">
            <div className="footer-group">
              <h4>Agency</h4>
              <a href="#home">Home</a>
              <a href="#about">About</a>
              <a href="#services">Services</a>
              <a href="#portfolio">Work</a>
            </div>
            <div className="footer-group">
              <h4>Connect</h4>
              <div className="social-links">
                <a href="#"><Camera size={20} /></a>
                <a href="#"><Send size={20} /></a>
                <a href="#"><Briefcase size={20} /></a>
                <a href="#"><Video size={20} /></a>
              </div>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Creldesk Studio. All rights reserved.</p>
          <div className="footer-legal">
            <a href="#">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
