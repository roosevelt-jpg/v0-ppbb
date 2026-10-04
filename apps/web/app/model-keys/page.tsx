import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { ModelKeysClient } from './model-keys-client';

export default function ModelKeysPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <ModelKeysClient />;
}
