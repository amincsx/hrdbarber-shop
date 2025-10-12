const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  sw: 'sw.js',
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  disable: process.env.NODE_ENV === 'development', // Disable PWA in development
  runtimeCaching: [
    {
      // Cache API calls with NetworkFirst (always try network first)
      urlPattern: /^https?.*\/api\/.*$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-calls',
        networkTimeoutSeconds: 5,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60, // Only 1 minute cache for API calls
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      // Cache dashboard pages with NetworkFirst
      urlPattern: /^https?.*\/(barber-dashboard|dashboard).*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'dashboard-pages',
        networkTimeoutSeconds: 5,
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 60, // Only 1 minute cache for dashboard pages
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      // Cache static assets more aggressively
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-images',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days for images
        },
      },
    },
    {
      // Everything else with NetworkFirst (short cache)
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'general-cache',
        networkTimeoutSeconds: 5,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60, // 5 minutes for everything else
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    optimizeCss: false, // Disable optimizeCss to fix the critters error
  },
  images: {
    domains: [],
    formats: ['image/webp', 'image/avif'],
  },
  // Security headers and cache control
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      // Disable caching for API routes and pages to ensure fresh data
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
        ],
      },
      {
        source: '/barber-dashboard/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
        ],
      },
      {
        source: '/dashboard',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
        ],
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
