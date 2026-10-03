'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Engine = {
  title?: string;
  blurb?: string;
  honesty?: Record<string, unknown>;
  safety?: { note?: string };
};

export function VectorFmClient() {
  const [engine, setEngine] = useState<Engine | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void apiFetch<Engine>('/v1/vector-fm/engine')
      .then(setEngine)
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <AppShell>
      <main style={{ padding: '1.5rem', maxWidth: 880 }}>
        <p style={{ color: 'var(--muted)' }}>
          <Link href="/foundation-model-cloud">Foundation Model Cloud</Link>
           · 
          <Link href="/atlas">Atlas</Link>
        </p>
        <h1 style={{ fontSize: '1.75rem', margin: '0.5rem 0' }}>Vector FM</h1>
        <p>{engine?.blurb ?? 'VerbaLab-owned model family.'}</p>
        {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
        {engine?.safety?.note ? (
          <p style={{ color: 'var(--muted)' }}>{engine.safety.note}</p>
        ) : null}
        <pre style={{ background: 'var(--surface, #f4f4f5)', padding: 12, overflow: 'auto' }}>
          {JSON.stringify(engine?.honesty ?? { ownedModels: true }, null, 2)}
        </pre>
      </main>
    </AppShell>
  );
}
