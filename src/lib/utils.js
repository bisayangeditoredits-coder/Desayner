/**
 * Strips legacy Cloudinary fetch-proxy URLs so we hit the origin directly.
 * base44.app images are routed through our streaming proxy because base44.app
 * blocks direct fetches from Vercel edge servers (requires browser headers).
 */
export function stripCloudinaryProxy(url) {
  if (!url) return url;
  if (typeof url === 'string') {
    if (url.includes('base44.app')) {
      return `/api/proxy-image?url=${encodeURIComponent(url)}`;
    }
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
