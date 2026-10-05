import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { ModelReleaseClient } from './model-release-client';

export default function ModelReleasePage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <ModelReleaseClient />;
}
