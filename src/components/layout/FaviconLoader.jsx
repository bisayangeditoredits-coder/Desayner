'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * FaviconLoader — swaps the favicon with a natively animated SVG spinner
 * while navigating between pages, then restores it when done.
 * Modifies head links in-place to prevent breaking Next.js metadata reconciliation.
 */
export default function FaviconLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const stopTimerRef = useRef(null);
  const activeSpinnerRef = useRef(false);

  function setFavicon(href, type) {
    const links = document.querySelectorAll("link[rel*='icon']");
    // Append unique cache-busting timestamp to force browser tab bar updates instantly
    const cacheBusterUrl = `${href}?v=${Date.now()}`;

    if (links.length === 0) {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = cacheBusterUrl;
      if (type) {
        link.type = type;
      }
      if (type === 'image/svg+xml') {
        link.setAttribute('sizes', 'any');
      }
      document.head.appendChild(link);
    } else {
      links.forEach((link) => {
        link.href = cacheBusterUrl;
        if (type) {
          link.setAttribute('type', type);
        } else {
          link.removeAttribute('type');
        }
        if (type === 'image/svg+xml') {
          link.setAttribute('sizes', 'any');
        } else {
          link.removeAttribute('sizes');
        }
      });
    }
  }

  function stopSpinner() {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    if (activeSpinnerRef.current) {
      setFavicon('/desayner-favicon.png', 'image/png');
      activeSpinnerRef.current = false;
    }
  }

  function startSpinner() {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }

    setFavicon('/favicon-loading.svg', 'image/svg+xml');
    activeSpinnerRef.current = true;

    // Revert back to the standard favicon after 1.2s
    stopTimerRef.current = setTimeout(() => {
      // Only revert if we are not actively busy loading a route
      const isBusy = document.documentElement.classList.contains('nprogress-busy');
      if (!isBusy) {
        stopSpinner();
      }
    }, 1200);
  }

  // 1. Trigger spinner on every route change (fallback visual feedback)
  useEffect(() => {
    startSpinner();

    return () => {
      stopSpinner();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  // 2. Monitor nprogress-busy class on html to start/stop spinner dynamically
  useEffect(() => {
    const htmlEl = document.documentElement;

    function checkClass() {
      const isBusy = htmlEl.classList.contains('nprogress-busy');
      if (isBusy) {
        if (stopTimerRef.current) {
          clearTimeout(stopTimerRef.current);
          stopTimerRef.current = null;
        }
        setFavicon('/favicon-loading.svg', 'image/svg+xml');
        activeSpinnerRef.current = true;
      } else {
        stopSpinner();
      }
    }

    // Initial check
    checkClass();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          checkClass();
        }
      });
    });

    observer.observe(htmlEl, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      observer.disconnect();
      stopSpinner();
    };
  }, []);

  return null;
}
