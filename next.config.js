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

module.exports = nextConfig
