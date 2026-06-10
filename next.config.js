/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: true,
  skipStaticOptimization: true,
  experimental: {
    isrMemoryCacheSize: 0,
  },
};

module.exports = nextConfig;
