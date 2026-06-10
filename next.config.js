/** @type {import('next').NextConfig} */
const nextConfig = {
  bundler: 'webpack',
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
