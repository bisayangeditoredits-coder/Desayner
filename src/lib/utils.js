/**
 * Normalizes legacy image URLs and routes blocked origins through our proxy.
 * base44.app blocks direct browser hotlinks; wsrv.nl is blocked by many ad
 * blockers — so migrated users' avatars/covers go through /api/proxy-image.
 */
export function stripCloudinaryProxy(url) {
  if (!url) return url;
  if (typeof url === 'string') {
    // Already proxied or local
    if (
      url.startsWith('/api/') ||
      url.startsWith('https://wsrv.nl') ||
      url.startsWith('/') ||
      url.startsWith('data:')
    ) {
      return url;
    }

    let targetUrl = url;

    // Resolve legacy Cloudinary fetch proxy wrappers
    if (url.includes('res.cloudinary.com') && url.includes('/fetch/')) {
      const match = url.match(/(https?%3A%2F%2F.*|https?:\/\/.*)$/i);
      if (match) {
        try {
          targetUrl = decodeURIComponent(match[1]);
        } catch (e) {
          targetUrl = url;
        }
      }
    }

    // List of safe/small domains that don't need resizing/proxying
    // or domains that shouldn't be proxied
    const noProxyDomains = [
      // Our own CDNs — already serve resized WebP thumbnails; direct load is faster
      // and avoids routing every card image through a third-party proxy.
      'r2.dev',
      'supabase.co',
      'googleusercontent.com',
      'githubusercontent.com',
      'logo.clearbit.com',
      'api.dicebear.com',
      'cdn.pixabay.com',
      'pixabay.com',
      'unsplash.com',
    ];

    try {
      const parsed = new URL(targetUrl);
      if (noProxyDomains.some(domain => parsed.hostname.endsWith(domain))) {
        return targetUrl;
      }
    } catch (e) {
      // Invalid URL fallback
      return targetUrl;
    }

    // Same-origin proxy: reliable for base44.app and not blocked by ad blockers
    // (unlike wsrv.nl, which breaks avatars/covers for many users).
    return `/api/proxy-image?url=${encodeURIComponent(targetUrl)}`;
  }
  return url;
}

/** Same-origin proxy for Unsplash hotlinked thumbnails (avoids CSP / loader issues). */
export function unsplashImageSrc(url) {
  if (!url) return url;
  if (url.startsWith('/api/')) return url;
  return `/api/unsplash/image?url=${encodeURIComponent(url)}`;
}

/** Proxy Pixabay thumbnails through our API (CDN blocks third-party browser referrers). */
export function pixabayImageSrc(url, preview) {
  const target = preview || url;
  if (!target) return target;
  if (target.startsWith('/api/')) return target;
  return `/api/pixabay/image?url=${encodeURIComponent(target)}`;
}
