/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@clientos/ui', '@clientos/types', '@clientos/validation', '@clientos/database'],
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
    NEXT_PUBLIC_SCRAPER_URL: process.env.NEXT_PUBLIC_SCRAPER_URL || 'http://localhost:8000',
  },
};

module.exports = nextConfig;
