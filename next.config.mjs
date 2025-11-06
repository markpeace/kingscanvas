import withPWA from "next-pwa"

// Basic runtime caching recipes
const runtimeCaching = [
  {
    urlPattern: ({ request }) => request.destination === "document" || request.destination === "script" || request.destination === "style",
    handler: "NetworkFirst",
    options: {
      cacheName: "html-assets",
      expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
      networkTimeoutSeconds: 3
    }
  },
  {
    urlPattern: ({ request }) => request.destination === "image",
    handler: "CacheFirst",
    options: {
      cacheName: "images",
      expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 }
    }
  },
  {
    urlPattern: ({ request }) => request.destination === "font",
    handler: "CacheFirst",
    options: {
      cacheName: "fonts",
      expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 }
    }
  },
  {
    // JSON, API responses, Next data
    urlPattern: ({ url }) => url.pathname.startsWith("/_next/data") || url.pathname.endsWith(".json"),
    handler: "StaleWhileRevalidate",
    options: {
      cacheName: "data",
      expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 }
    }
  }
]

const isProd = process.env.NODE_ENV === "production"

const withPWAWrapped = withPWA({
  dest: "public",
  disable: !isProd,           // Only enable SW in production builds (Vercel Preview/Prod)
  register: true,
  skipWaiting: true,
  runtimeCaching,
  additionalManifestEntries: [{ url: "/offline", revision: null }],
  fallbacks: {
    document: "/offline"     // Fallback page when offline
  },
  buildExcludes: [/middleware-manifest\.json$/]
})

const nextConfig = {
  reactStrictMode: true,
  experimental: {}
}

export default withPWAWrapped(nextConfig)
