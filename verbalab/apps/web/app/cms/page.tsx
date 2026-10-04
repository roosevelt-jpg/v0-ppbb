import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { CmsAdminClient } from './cms-admin-client';

export default function CmsPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <CmsAdminClient />;
}
