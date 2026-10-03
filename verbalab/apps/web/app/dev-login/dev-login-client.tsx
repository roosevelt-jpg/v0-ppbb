'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { setDevBearer } from '@/lib/dev-auth';

/**
 * Does not call Clerk useSignIn / hosted UI — those keep forcing email OTP on this instance.
 */
export function DevLoginClient() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function signInWithoutClerkUi() {
    setBusy(true);
    setError(null);
    setStatus('Creating local review session…');
    try {
      const res = await fetch('/api/dev-login', { method: 'POST' });
      const data = (await res.json()) as {
        ok?: boolean;
        bearer?: string;
        redirectTo?: string;
        email?: string;
        error?: string;
        message?: string;
      };
      if (!res.ok || !data.bearer) {
        throw new Error(data.message || data.error || `Dev login failed (${res.status})`);
      }
      setDevBearer(data.bearer);
      setStatus(`Signed in as ${data.email ?? 'reviewer'} — loading…`);
      router.replace(data.redirectTo || '/vaios');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
      setStatus(null);
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '2rem',
        background:
          'radial-gradient(1200px 600px at 10% -10%, rgba(15,118,110,0.18), transparent), #f7f4ef',
      }}
    >
      <div
        style={{
          width: 'min(28rem, 100%)',
          border: '1px solid #e5e0d6',
          borderRadius: '1rem',
          padding: '1.75rem',
          background: '#fffdf8',
          boxShadow: '0 18px 50px rgba(28, 25, 23, 0.08)',
        }}
      >
        <p style={{ margin: 0, color: '#0f766e', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.08em' }}>
          LOCAL DEV LOGIN
        </p>
        <h1 style={{ fontFamily: 'var(--font-display)', margin: '0.4rem 0 0.5rem', fontSize: '1.6rem' }}>
          Browse without Clerk OTP
        </h1>
        <p style={{ color: '#78716c', margin: '0 0 1.25rem', lineHeight: 1.5 }}>
          This skips Clerk&apos;s hosted sign-in entirely (test keys only). Sets a local session cookie so
          middleware and API accept you — no email code.
        </p>

        <button
          type="button"
          disabled={busy}
          onClick={() => void signInWithoutClerkUi()}
          style={{
            width: '100%',
            border: 0,
            borderRadius: '0.65rem',
            padding: '0.85rem 1rem',
            background: '#0f766e',
            color: 'white',
            fontWeight: 700,
            cursor: busy ? 'wait' : 'pointer',
          }}
        >
          {busy ? 'Working…' : 'Enter local review session'}
        </button>

        {status ? <p style={{ color: '#0f766e', margin: '1rem 0 0' }}>{status}</p> : null}
        {error ? (
          <p style={{ color: '#b42318', margin: '1rem 0 0', whiteSpace: 'pre-wrap' }}>{error}</p>
        ) : null}
      </div>
    </main>
  );
}
