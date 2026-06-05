'use client';
import React, { memo } from 'react';

/**
 * TypingIndicator — three bouncing dots.
 * Pure CSS animation, zero JS after mount. No Framer Motion.
 */
const TypingIndicator = memo(function TypingIndicator({ name }) {
  return (
    <div className="typing-indicator" aria-live="polite" aria-label={`${name} is typing`}>
      <div className="typing-indicator__bubble">
        <span className="typing-dot" style={{ animationDelay: '0ms' }} />
        <span className="typing-dot" style={{ animationDelay: '150ms' }} />
        <span className="typing-dot" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
});

export default TypingIndicator;
