/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    dirs: ['app', 'components', 'hooks', 'utils', 'context'], // Run ESLint on relevant directories
    ignoreDuringBuilds: false, // Enable ESLint checks during build
  },
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
  webpack: (config, { isServer, dev }) => {
    // Only modify cache in development to reduce serialization warnings
    if (dev && !isServer) {
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
      };
    }
    return config;
  },
}

module.exports = nextConfig
