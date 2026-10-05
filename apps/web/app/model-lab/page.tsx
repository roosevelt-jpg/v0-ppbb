import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { ModelLabClient } from './model-lab-client';

export default function ModelLabPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <ModelLabClient />;
}
