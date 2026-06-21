'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * FaviconLoader — swaps the favicon with an animated spinner canvas
 * while navigating between pages, then restores it when done.
 * Works on both desktop and mobile browsers.
 */
export default function FaviconLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const animFrameRef = useRef(null);
  const angleRef = useRef(0);
  const isRunningRef = useRef(false);
  const stopTimerRef = useRef(null);

  function getAllFaviconLinks() {
    // Target ALL favicon-related link tags to ensure cross-browser compatibility
    return Array.from(
      document.querySelectorAll("link[rel*='icon']")
    );
  }

  function setFavicon(href) {
    const links = getAllFaviconLinks();
    if (links.length === 0) {
      // Create one if none exists
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = href;
      document.head.appendChild(link);
    } else {
      links.forEach((link) => { link.href = href; });
    }
  }

  function drawSpinner(angle) {
    const size = 64; // higher res for retina screens
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 5;
    const lw = 6;

    // Track ring
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(45, 67, 232, 0.18)';
    ctx.lineWidth = lw;
    ctx.stroke();

    // Spinning arc
    ctx.beginPath();
    ctx.arc(cx, cy, r, angle, angle + 1.5);
    ctx.strokeStyle = '#2d43e8';
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.stroke();

    return canvas.toDataURL('image/png');
  }

  function stopSpinner() {
    isRunningRef.current = false;
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setFavicon('/desayner-favicon.png');
  }

  function startSpinner() {
    // Always cancel any existing animation first
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }

    isRunningRef.current = true;
    angleRef.current = 0;

    function animate() {
      if (!isRunningRef.current) return;
      angleRef.current = (angleRef.current + 0.15) % (2 * Math.PI);
      setFavicon(drawSpinner(angleRef.current));
      animFrameRef.current = requestAnimationFrame(animate);
    }

    animFrameRef.current = requestAnimationFrame(animate);

    // Auto-stop after a max of 2s (longer timeout for slow connections)
    stopTimerRef.current = setTimeout(() => {
      stopSpinner();
    }, 2000);
  }

  // Trigger on every route change
  useEffect(() => {
    startSpinner();

    return () => {
      // Cleanup when effect re-runs (new navigation started)
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    };
  }, []);

  return null;
}
