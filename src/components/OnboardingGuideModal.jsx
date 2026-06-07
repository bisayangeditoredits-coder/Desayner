'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import './OnboardingGuide.css';

const GUIDE_STEPS = [
  {
    id: 1,
    title: 'Welcome to Desayner',
    desc: 'Discover a powerful collection of features designed to enhance your creative workflow and portfolio.',
    // Placeholder video 1
    videoSrc: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 
  },
  {
    id: 2,
    title: 'Upload Your Projects',
    desc: 'Easily upload your latest work, organize it into collections, and share it with the world.',
    // Placeholder video 2
    videoSrc: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  },
  {
    id: 3,
    title: 'Get Inspired & Save',
    desc: 'Browse the feed to find inspiration. Like and save projects to your personal moodboards.',
    // Placeholder video 3
    videoSrc: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  }
];

export default function OnboardingGuideModal({ open, onOpenChange }) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < GUIDE_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Finish
      handleClose();
    }
  };

  const handleClose = () => {
    setCurrentStep(0); // Reset for next time
    onOpenChange(false);
  };

  const stepData = GUIDE_STEPS[currentStep];

  return (
    <AnimatePresence>
      {open && (
        <div className="guide-modal-overlay">
          <motion.div
            className="guide-modal-content"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.4, type: 'spring', bounce: 0.2 }}
          >
            {/* Top Video Area - Square */}
            <div className="guide-modal-hero">
              <AnimatePresence mode="wait">
                <motion.video
                  key={stepData.id}
                  src={stepData.videoSrc}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="guide-modal-hero-video"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </AnimatePresence>
            </div>

            {/* Bottom Content Area */}
            <div className="guide-modal-body">
              <AnimatePresence mode="wait">
                <motion.div
                  key={stepData.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <h2 className="guide-modal-title">{stepData.title}</h2>
                  <p className="guide-modal-desc">{stepData.desc}</p>
                </motion.div>
              </AnimatePresence>

              {/* Footer Controls */}
              <div className="guide-modal-footer">
                {/* Dots */}
                <div className="guide-modal-dots">
                  {GUIDE_STEPS.map((_, idx) => (
                    <div
                      key={idx}
                      className={`guide-modal-dot ${idx === currentStep ? 'active' : ''}`}
                    />
                  ))}
                </div>

                {/* Right Actions */}
                <div className="guide-modal-actions">
                  <button className="guide-modal-btn-skip" onClick={handleClose}>
                    Skip
                  </button>
                  <button className="guide-modal-btn-next" onClick={handleNext}>
                    {currentStep === GUIDE_STEPS.length - 1 ? 'Finish' : 'Next'}
                    {currentStep < GUIDE_STEPS.length - 1 && <ArrowRight size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
