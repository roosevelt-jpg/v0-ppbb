'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

export function VideoVoiceClient() {
  const [engine, setEngine] = useState<Record<string, unknown> | null>(null);
  useEffect(() => {
    void apiFetch<Record<string, unknown>>('/v1/video-voice/engine').then(setEngine);
  }, []);
  return (
    <AppShell>
      <main style={{ padding: '1.5rem', maxWidth: 880 }}>
        <h1>Video Voice</h1>
        <p style={{ color: 'var(--muted)' }}>
          <Link href="/voice-fm">Voice FM</Link> · <Link href="/translate-fm">Translate FM</Link> · 
          <Link href="/foundation-model-cloud">FM Cloud</Link>
        </p>
        <pre style={{ background: 'var(--surface, #f4f4f5)', padding: 12 }}>
          {JSON.stringify(engine, null, 2)}
        </pre>
      </main>
    </AppShell>
  );
}
