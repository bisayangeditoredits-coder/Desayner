import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    // Larger device sizes to serve sharp images on high-DPI screens
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Minimum TTL so CDN caches optimized images for 1 day
    minimumCacheTTL: 86400,
    // Next.js 16 requires localPatterns for local URLs with query strings
    localPatterns: [
      {
        pathname: '/api/proxy-image',
        search: '**',
      },
      // Explicitly allow all other local images (like /banner-event-homepage.jpeg)
      // because defining localPatterns overrides the default of allowing all local files.
      {
        pathname: '/**',
      },
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.r2.dev',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
      // base44.app — legacy uploads; allowlisted so Next.js optimizer
      // can fetch, resize, and serve WebP/AVIF directly without the proxy
      {
        protocol: 'https',
        hostname: 'base44.app',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      // Pixabay CDN — stock photos & vectors
      {
        protocol: 'https',
        hostname: 'cdn.pixabay.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pixabay.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(self)'
          },
          {
            // CSP: whitelists every external resource the app legitimately uses.
            // Keep 'unsafe-inline' for styles (Next.js inlines critical CSS).
            // 'unsafe-eval' is required by Sentry's source-map processing in dev.
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Scripts: self + Sentry CDN (error replay) + Stripe.js + Microsoft Clarity
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://cdn.jsdelivr.net https://www.clarity.ms",
              // Styles: self + Google Fonts + inline (Next.js)
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Fonts: self + Google Fonts
              "font-src 'self' https://fonts.gstatic.com",
              // Images: self + Cloudflare R2 + Unsplash + Google avatars + GitHub avatars + Supabase storage + Job Logos + Microsoft Clarity + wsrv.nl
              "img-src 'self' data: blob: https://*.r2.dev https://*.unsplash.com https://*.googleusercontent.com https://avatars.githubusercontent.com https://*.supabase.co https://res.cloudinary.com https://base44.app https://jobicy.com https://www.google.com https://logo.clearbit.com https://api.dicebear.com https://*.clarity.ms https://c.bing.com https://wsrv.nl",
              // Media: self + R2 CDN (project videos)
              "media-src 'self' blob: https://*.r2.dev",
              // API + WebSocket connections + Microsoft Clarity
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.upstash.io https://api.unsplash.com https://api.sentry.io https://js.stripe.com https://*.r2.dev https://*.clarity.ms",
              // Frames: Stripe embedded UIs only
              "frame-src https://js.stripe.com https://hooks.stripe.com",
              // Workers: Next.js service worker
              "worker-src 'self' blob:",
              // Form targets: self only
              "form-action 'self'",
              // Prevent all plugins (Flash, etc.)
              "object-src 'none'",
              // Base URI locked to self
              "base-uri 'self'",
            ].join('; ')
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options
  org: "creldesk",
  project: "creldesk-studio",
  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,
  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: true,
});
