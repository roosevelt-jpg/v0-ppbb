import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';
import { UseCasePageClient } from './use-case-page-client';

const USE_CASE_SEO: Record<string, { title: string; description: string }> = {
  trade: {
    title: 'Trade & Negotiations Voice AI',
    description:
      'Speak and translate across African markets for deals and negotiations — tone, respect, and intent intact.',
  },
  education: {
    title: 'Education Language AI',
    description:
      'Lessons, tutoring, and assessments in the languages students live in across Africa.',
  },
  sales: {
    title: 'Sales & Marketing Voice Localization',
    description:
      'Campaigns that sound local — accents, idioms, and cultural cues for African markets.',
  },
  'public-speech': {
    title: 'Public Speech Localization',
    description:
      'Civic and leadership addresses that feel native — not imported — across African languages.',
  },
  'customer-experience': {
    title: 'Customer Experience for African Callers',
    description:
      'Support and agents that hear African callers the way Africans speak.',
  },
  creative: {
    title: 'Creative Voice for African Storytelling',
    description:
      'Own your voice for podcasts, film, ads, and storytelling across the continent.',
  },
};

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const seo = USE_CASE_SEO[slug] ?? {
    title: `Use case: ${slug}`,
    description: 'VerbaLab African voice and language use case.',
  };
  return buildPageMetadata({
    title: seo.title,
    description: seo.description,
    path: `/use-cases/${slug}`,
    ogTitle: `${seo.title} | VerbaLab`,
    ogImage: '/cms/og-default.svg',
    keywords: ['VerbaLab', 'African voice AI', slug.replace(/-/g, ' ')],
  });
}

export default async function UseCasePage({ params }: Props) {
  const { slug } = await params;
  return <UseCasePageClient slug={slug} />;
}
