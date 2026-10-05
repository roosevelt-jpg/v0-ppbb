import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { ProductFamiliesClient } from './product-families-client';

export default function ProductFamiliesPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <ProductFamiliesClient />;
}
