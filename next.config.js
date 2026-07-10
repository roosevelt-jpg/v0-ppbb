/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Skip static generation for all pages - use on-demand ISR
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: '/admin/community', destination: '/admin/communities', permanent: true },
      { source: '/admin/community/:path*', destination: '/admin/communities', permanent: true },
      { source: '/admin/communities/community', destination: '/admin/communities', permanent: true },
      { source: '/admin/communities/community/:path*', destination: '/admin/communities', permanent: true },
      { source: '/dashboard/community', destination: '/dashboard/communities', permanent: false },
      { source: '/dashboard/community/create', destination: '/communities', permanent: false },
      { source: '/dashboard/community/:groupId', destination: '/dashboard/communities', permanent: false },
      { source: '/jobs', destination: '/opportunities', permanent: false },
      { source: '/jobs/:id', destination: '/opportunities/:id', permanent: false },
      { source: '/business/dashboard/profile', destination: '/business/profile', permanent: false },
      { source: '/business/dashboard/jobs', destination: '/business/opportunities', permanent: false },
      { source: '/business/dashboard/jobs/create', destination: '/business/opportunities/new', permanent: false },
      { source: '/business/dashboard/jobs/:id/edit', destination: '/business/opportunities/:id/edit', permanent: false },
      { source: '/business/dashboard/offers', destination: '/business/offers', permanent: false },
      { source: '/business/dashboard/offers/create', destination: '/business/offers/new', permanent: false },
      { source: '/business/dashboard/offers/:id/edit', destination: '/business/offers/:id/edit', permanent: false },
      { source: '/business/dashboard/discounts', destination: '/business/discounts', permanent: false },
      { source: '/business/dashboard/discounts/create', destination: '/business/discounts/create', permanent: false },
      { source: '/business/dashboard/referrals', destination: '/business/referrals', permanent: false },
      { source: '/business/dashboard/leads', destination: '/business/leads', permanent: false },
      { source: '/business/dashboard/analytics', destination: '/business/analytics', permanent: false },
      { source: '/business/dashboard/events', destination: '/business/events', permanent: false },
      { source: '/business/dashboard/marketplace', destination: '/business/marketplace', permanent: false },
      { source: '/business/dashboard/partnerships', destination: '/business/partnerships', permanent: false },
      { source: '/business/dashboard/payments', destination: '/business/payments', permanent: false },
      { source: '/business/dashboard/network', destination: '/business/marketplace', permanent: false },
    ]
  },
};

module.exports = nextConfig;
