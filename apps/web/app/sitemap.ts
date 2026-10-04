import type { MetadataRoute } from 'next';
import { listProductSlugs } from '@/lib/product-pages';
import { getSiteUrl } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const site = getSiteUrl();
  const now = new Date();

  const staticRoutes = ['', '/products', '/docs', '/docs/openapi', '/playground', '/coverage', '/sign-up'].map(
    (path) => ({
      url: `${site}${path || '/'}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: path === '' ? 1 : 0.7,
    }),
  );

  const productRoutes = listProductSlugs().map((slug) => ({
    url: `${site}/products/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const useCases = ['trade', 'education', 'sales', 'public-speech', 'customer-experience', 'creative'].map(
    (slug) => ({
      url: `${site}/use-cases/${slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }),
  );

  return [...staticRoutes, ...productRoutes, ...useCases];
}
