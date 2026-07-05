/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Skip static generation for all pages - use on-demand ISR
  output: 'standalone',
};

module.exports = nextConfig;
