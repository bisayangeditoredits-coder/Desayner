/**
 * Strips legacy Cloudinary fetch-proxy URLs so we hit the origin directly.
 * base44.app is now allowlisted in next.config.mjs remotePatterns, so those
 * images go straight through Next.js Image Optimization (no server proxy needed).
 */
export function stripCloudinaryProxy(url) {
  if (!url) return url;
  if (typeof url === 'string') {
    if (url.includes('res.cloudinary.com') && url.includes('/fetch/')) {
      const match = url.match(/(https?%3A%2F%2F.*|https?:\/\/.*)$/i);
      if (match) {
        try {
          return decodeURIComponent(match[1]);
        } catch (e) {
          return url;
        }
      }
    }
  }
  return url;
}
