import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { OwnModelsHubClient } from './own-models-hub-client';

export default function OwnModelsPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <OwnModelsHubClient />;
}
