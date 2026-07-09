/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Skip static generation for all pages - use on-demand ISR
  output: 'standalone',
  async redirects() {
    return [
      { source: '/admin/community', destination: '/admin/communities', permanent: true },
      { source: '/admin/community/:path*', destination: '/admin/communities', permanent: true },
      { source: '/admin/communities/community', destination: '/admin/communities', permanent: true },
      { source: '/admin/communities/community/:path*', destination: '/admin/communities', permanent: true },
      { source: '/dashboard/community', destination: '/dashboard/communities', permanent: false },
      { source: '/dashboard/community/create', destination: '/communities', permanent: false },
      { source: '/dashboard/community/:groupId', destination: '/dashboard/communities', permanent: false },
    ]
  },
};

module.exports = nextConfig;
