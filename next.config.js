/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Skip static generation for all pages - use on-demand ISR
  output: 'standalone',
  async redirects() {
    return [
      {
        source: '/contact',
        destination: '/partners',
        permanent: true,
      },
    ]
  },
};

module.exports = nextConfig;
