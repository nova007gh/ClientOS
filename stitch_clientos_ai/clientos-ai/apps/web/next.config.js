/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@clientos/ui', '@clientos/types', '@clientos/validation', '@clientos/database'],
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
    NEXT_PUBLIC_SCRAPER_URL: process.env.NEXT_PUBLIC_SCRAPER_URL || 'http://localhost:8000',
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    NEXT_PUBLIC_CESIUM_ION_TOKEN: process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN || '',
  },
  webpack: (config, { isServer }) => {
    // CesiumJS needs these aliases
    if (!isServer) {
      config.resolve.fallback = { ...config.resolve.fallback, fs: false };
    }
    return config;
  },
};

module.exports = nextConfig;
