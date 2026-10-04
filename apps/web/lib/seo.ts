import type { Metadata } from 'next';
import { getSiteUrl } from '@/lib/site';

export type SeoInput = {
  title: string;
  description: string;
  path: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  keywords?: string[];
  noIndex?: boolean;
};

export function buildPageMetadata(input: SeoInput): Metadata {
  const site = getSiteUrl();
  const url = `${site}${input.path.startsWith('/') ? input.path : `/${input.path}`}`;
  const ogTitle = input.ogTitle ?? input.title;
  const ogDescription = input.ogDescription ?? input.description;
  const ogImage = input.ogImage
    ? input.ogImage.startsWith('http')
      ? input.ogImage
      : `${site}${input.ogImage.startsWith('/') ? input.ogImage : `/${input.ogImage}`}`
    : undefined;

  return {
    title: input.title,
    description: input.description,
    keywords: input.keywords,
    alternates: { canonical: url },
    robots: input.noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url,
      siteName: 'VerbaLab',
      title: ogTitle,
      description: ogDescription,
      ...(ogImage
        ? {
            images: [
              {
                url: ogImage,
                width: 1200,
                height: 630,
                alt: ogTitle,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title: ogTitle,
      description: ogDescription,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}
