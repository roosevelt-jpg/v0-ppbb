import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { WorldLanguageRegistryClient } from './world-language-registry-client';

export default function WorldLanguageRegistryPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <WorldLanguageRegistryClient />;
}
