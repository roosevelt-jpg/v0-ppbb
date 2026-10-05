import { SignUp } from '@clerk/nextjs';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { verbalabClerkAppearance } from '@/lib/clerk-appearance';

export default function SignUpPage() {
  if (!isClerkConfigured()) redirect('/setup');

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '2rem 1rem',
        gap: '1.25rem',
      }}
    >
      <div style={{ maxWidth: '28rem', textAlign: 'center' }}>
        <p style={{ margin: 0, color: 'var(--brand)', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.08em' }}>
          START FREE
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            margin: '0.4rem 0 0.5rem',
            fontSize: '1.65rem',
            letterSpacing: '-0.03em',
          }}
        >
          Create your VerbaLab account
        </h1>
        <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.5, fontSize: '0.95rem' }}>
          Sign up as a user or organization. You land on Free with limited platform access — Translate, Voice
          generation, Speech, Playground, and API keys. Upgrade anytime for cloning and higher quotas.
        </p>
      </div>
      <div className="vl-clerk-auth">
        <SignUp
          appearance={verbalabClerkAppearance}
          fallbackRedirectUrl="/dashboard"
          forceRedirectUrl="/dashboard"
        />
      </div>
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: 0 }}>
        Already have an account?{' '}
        <Link href="/sign-in" style={{ color: 'var(--brand)', fontWeight: 650 }}>
          Log in
        </Link>
      </p>
    </main>
  );
}
