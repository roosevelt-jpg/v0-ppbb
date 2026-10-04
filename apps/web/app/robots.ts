import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  const site = getSiteUrl();
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/products', '/products/', '/docs', '/playground', '/coverage', '/use-cases'],
      disallow: ['/dashboard', '/admin', '/cms', '/keys', '/billing', '/audit', '/api/'],
    },
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
