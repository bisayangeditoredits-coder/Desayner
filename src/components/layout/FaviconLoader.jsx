'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
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
  const searchKey = useMemo(() => searchParams.toString(), [searchParams]);

  const setFavicon = useCallback((href, type) => {
    const links = document.querySelectorAll("link[rel*='icon']");
    const cacheBusterUrl = `${href}?v=${Date.now()}`;

    if (links.length === 0) {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = cacheBusterUrl;
      if (type) link.type = type;
      if (type === 'image/svg+xml') link.setAttribute('sizes', 'any');
      document.head.appendChild(link);
      return;
    }

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
  }, []);

  const stopSpinner = useCallback(() => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    if (activeSpinnerRef.current) {
      setFavicon('/desayner-favicon.png', 'image/png');
      activeSpinnerRef.current = false;
    }
  }, [setFavicon]);

  const startSpinner = useCallback(() => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }

    setFavicon('/favicon-loading.svg', 'image/svg+xml');
    activeSpinnerRef.current = true;

    stopTimerRef.current = setTimeout(() => {
      const isBusy = document.documentElement.classList.contains('nprogress-busy');
      if (!isBusy) {
        stopSpinner();
      }
    }, 1200);
  }, [setFavicon, stopSpinner]);

  useEffect(() => {
    startSpinner();
    return () => stopSpinner();
  }, [pathname, searchKey, startSpinner, stopSpinner]);

  useEffect(() => {
    const htmlEl = document.documentElement;

    const checkClass = () => {
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
    };

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
  }, [setFavicon, stopSpinner]);

  return null;
}