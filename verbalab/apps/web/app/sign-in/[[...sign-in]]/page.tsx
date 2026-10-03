import { SignIn } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';

export default function SignInPage() {
  if (!isClerkConfigured()) redirect('/setup');

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <SignIn />
    </main>
  );
}
