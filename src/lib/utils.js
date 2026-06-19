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
      'githubusercontent.com',
      'logo.clearbit.com',
      'api.dicebear.com',
      'cdn.pixabay.com',
      'pixabay.com',
      'unsplash.com',
      'res.cloudinary.com'
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

/**
 * Returns an Unsplash image URL that loads DIRECTLY from Unsplash's Imgix CDN —
 * no server proxy needed. Unsplash URLs are already served by Imgix which supports
 * `w`, `q`, `auto=format` query params for on-the-fly resizing and WebP conversion.
 *
 * At 50k-100k users/day, routing every thumbnail through /api/unsplash/image was
 * causing millions of unnecessary Vercel function invocations. Direct CDN delivery
 * eliminates that entirely and removes the server round-trip from the critical path.
 *
 * CSP img-src already allows *.unsplash.com — no config changes needed.
 *
 * @param {string} url - Raw Unsplash URL (urls.small, urls.regular, etc.)
 * @param {number} [width=800] - Target display width in px (Imgix resizes on-the-fly)
 * @param {number} [quality=75] - JPEG/WebP quality (1-100)
 */
export function unsplashImageSrc(url, width = 800, quality = 75) {
  if (!url) return url;
  // Already a local/proxied path — return as-is
  if (url.startsWith('/')) return url;

  try {
    const u = new URL(url);
    // Only transform Unsplash/Imgix URLs
    if (!u.hostname.includes('unsplash.com') && !u.hostname.includes('images.unsplash.com')) {
      return url;
    }
    // Strip any existing resize params Unsplash may have set so we control them
    u.searchParams.delete('w');
    u.searchParams.delete('h');
    u.searchParams.delete('q');
    u.searchParams.delete('auto');
    u.searchParams.delete('fit');
    u.searchParams.delete('crop');
    // Apply our own params: auto=format lets Imgix serve WebP to supporting browsers
    u.searchParams.set('w', String(width));
    u.searchParams.set('q', String(quality));
    u.searchParams.set('auto', 'format');
    u.searchParams.set('fit', 'max');
    return u.toString();
  } catch {
    return url;
  }
}

/**
 * Proxies Pixabay thumbnails through /api/pixabay/image.
 * Pixabay CDN blocks third-party browser referrers, so a server-side proxy is still
 * required. The proxy now passes a `w` param for server-side response sizing.
 *
 * @param {string} url - Pixabay webformat URL
 * @param {string} [preview] - Smaller preview URL (preferred for thumbnails)
 */
export function pixabayImageSrc(url, preview) {
  const target = preview || url;
  if (!target) return target;
  if (target.startsWith('/api/')) return target;
  return `/api/pixabay/image?url=${encodeURIComponent(target)}`;
}

/** 
 * Automatically applies Cloudflare Image Resizing to optimize bandwidth and load times.
 * Must be enabled in Cloudflare Dashboard: Speed -> Image Resizing
 */
export function optimizeImage(url, width = 600, quality = 80) {
  if (!url) return url;
  
  let normalizedUrl = stripCloudinaryProxy(url);
  
  // Don't resize SVGs or Data URIs
  if (normalizedUrl.startsWith('data:') || normalizedUrl.endsWith('.svg')) {
    return normalizedUrl;
  }

  // If we are in local development, Cloudflare Image Resizing endpoint doesn't exist.
  // Return the raw URL so images load correctly on localhost.
  if (process.env.NODE_ENV === 'development' || (typeof window !== 'undefined' && window.location.hostname === 'localhost')) {
    return normalizedUrl;
  }

  // If it's our own proxy, extract the real target to let CF resize the direct image
  if (normalizedUrl.startsWith('/api/proxy-image')) {
    try {
      const params = new URLSearchParams(normalizedUrl.split('?')[1]);
      const target = params.get('url');
      if (target) normalizedUrl = target;
    } catch (e) {
      // fallback
    }
  }

  // HOTFIX: Disabled Cloudflare Image Resizing (/cdn-cgi/image/) for now
  // because it requires a paid tier/activation on Cloudflare and is breaking production.
  // We will just return the original/normalized URL to fix the live site.
  return normalizedUrl;
}
