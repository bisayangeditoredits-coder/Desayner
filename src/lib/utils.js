/**
 * Strips legacy Cloudinary fetch-proxy URLs so we hit the origin directly.
 * base44.app images are routed through our streaming proxy because base44.app
 * blocks direct fetches from Vercel edge servers (requires browser headers).
 */
export function stripCloudinaryProxy(url) {
  if (!url) return url;
  if (typeof url === 'string') {
    // Already a proxy or local/data URI
    if (url.startsWith('https://wsrv.nl') || url.startsWith('/') || url.startsWith('data:')) {
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
      'googleusercontent.com',
      'githubusercontent.com',
      'logo.clearbit.com',
      'api.dicebear.com',
      'cdn.pixabay.com',
      'pixabay.com',
      'unsplash.com'
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

    // Proxy all other external images (Supabase, base44.app, R2 etc) through wsrv.nl.
    // This solves Vercel Serverless timeout/OOM errors on large remote images 
    // (which trigger the "No cover" UI state) and provides free global CDN resizing 
    // for future scale, drastically reducing Next.js Image Optimization costs.
    return `https://wsrv.nl/?url=${encodeURIComponent(targetUrl)}&w=800&output=webp&default=https://desayner.com/banner-event-homepage.jpeg`;
  }
  return url;
}
