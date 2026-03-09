// @ts-check
const { withSentryConfig } = require('@sentry/nextjs')

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Enable TypeScript error checking during build
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
  // Performance optimizations
  poweredByHeader: false, // Remove X-Powered-By header for security
  compress: true, // Enable gzip compression
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    // Image optimization settings
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  // Add empty turbopack config to acknowledge Turbopack in Next.js 16
  turbopack: {},
}

// Make Sentry config optional - app works without Sentry DSN
const hasSentryConfig = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

if (!hasSentryConfig) {
  console.log('ℹ️ Sentry not configured - running without error monitoring')
}

// Export with Sentry config wrapper
module.exports = withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "isaxcode",
  project: "zeptoai",

  // Auth token for source map uploads (set in env for CI/production)
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Only enable in production builds or when auth token is available
  disable: process.env.SENTRY_DISABLED === 'true' || !process.env.SENTRY_AUTH_TOKEN,

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers
  tunnelRoute: "/monitoring",

  // Source map configuration
  sourcemaps: {
    assets: './.next/**/*.map',
    ignore: ['./node_modules/**'],
  },

  // Release configuration
  release: {
    name: process.env.VERCEL_GIT_COMMIT_SHA || process.env.CF_PAGES_COMMIT_SHA || `zepto-${Date.now()}`,
    setCommits: {
      auto: true,
    },
  },

  // Tree-shaking options for reducing bundle size
  treeshakeClientSDK: true,
});
