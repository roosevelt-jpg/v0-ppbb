import { UseCasePageClient } from './use-case-page-client';

export default async function UseCasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <UseCasePageClient slug={slug} />;
}
