'use client';
import React, { memo } from 'react';

/**
 * OnlineDot — shows last seen status.
 * Green if active within 2 minutes, else "Active Xm ago".
 */
const OnlineDot = memo(function OnlineDot({ lastSeenAt, size = 10 }) {
  if (!lastSeenAt) return null;

  const diffMs  = Date.now() - new Date(lastSeenAt).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const isOnline = diffMin < 2;

  return (
    <span
      className={`online-dot ${isOnline ? 'online-dot--active' : ''}`}
      title={isOnline ? 'Active now' : `Active ${diffMin}m ago`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
});

export default OnlineDot;
