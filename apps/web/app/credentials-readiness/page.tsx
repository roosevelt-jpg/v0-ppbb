import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { CredentialsReadinessClient } from './credentials-readiness-client';

export default function CredentialsReadinessPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <CredentialsReadinessClient />;
}
