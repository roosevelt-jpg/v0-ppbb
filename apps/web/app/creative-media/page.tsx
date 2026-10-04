import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { CreativeMediaClient } from './creative-media-client';

export default function CreativeMediaPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <CreativeMediaClient />;
}
