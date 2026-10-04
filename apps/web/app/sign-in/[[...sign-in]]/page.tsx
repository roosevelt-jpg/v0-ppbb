import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';

export default function SignInPage() {
  if (!isClerkConfigured()) redirect('/setup');

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '2rem 1rem',
        gap: '1rem',
      }}
    >
      <div style={{ maxWidth: '28rem', textAlign: 'center' }}>
        <p style={{ margin: 0, color: 'var(--brand)', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.08em' }}>
          WELCOME BACK
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            margin: '0.4rem 0 0.5rem',
            fontSize: '1.65rem',
            letterSpacing: '-0.03em',
          }}
        >
          Log in to your dashboard
        </h1>
        <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.5, fontSize: '0.95rem' }}>
          Access your org workspace, Free-plan usage, API keys, voice tools, and docs. Need help? Use the support
          chat after you sign in.
        </p>
      </div>
      <SignIn fallbackRedirectUrl="/dashboard" forceRedirectUrl="/dashboard" />
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: 0 }}>
        New here?{' '}
        <Link href="/sign-up" style={{ color: 'var(--brand)', fontWeight: 650 }}>
          Create a free account
        </Link>
      </p>
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: 0 }}>
        Stuck on email OTP?{' '}
        <Link href="/dev-login" style={{ color: '#0f766e', fontWeight: 650 }}>
          Enter local review session (no OTP)
        </Link>
      </p>
    </main>
  );
}
