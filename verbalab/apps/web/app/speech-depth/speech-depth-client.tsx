'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { resolveApiToken } from '@/lib/dev-auth';
import { AppShell } from '@/components/app-shell';

export function SpeechDepthClient() {
  const { getToken } = useAuth();
  const [engine, setEngine] = useState<Record<string, unknown> | null>(null);
  const [stream, setStream] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void apiFetch<Record<string, unknown>>('/v1/speech-depth/engine').then(setEngine);
  }, []);

  async function start() {
    try {
      const token = await resolveApiToken(getToken);
      if (!token) throw new Error('Not signed in');
      const res = await apiFetch<Record<string, unknown>>('/v1/speech-depth/streams', {
        token,
        method: 'POST',
        body: JSON.stringify({ language: 'sw', dialect: 'sw-KE' }),
      });
      setStream(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    }
  }

  return (
    <AppShell>
      <main style={{ padding: '1.5rem', maxWidth: 880 }}>
        <p style={{ color: 'var(--muted)' }}>
          <Link href="/speech">Speech</Link> · <Link href="/echo">Echo</Link>
        </p>
        <h1>Speech Depth</h1>
        <p>Streaming transcription + African dialect hints on VerbaLab Echo (own STT).</p>
        <button type="button" onClick={() => void start()}>
          Start stream session
        </button>
        {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
        <pre style={{ background: 'var(--surface, #f4f4f5)', padding: 12, marginTop: 16 }}>
          {JSON.stringify({ engine, stream }, null, 2)}
        </pre>
      </main>
    </AppShell>
  );
}
