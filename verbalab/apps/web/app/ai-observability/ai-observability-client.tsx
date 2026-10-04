'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Surface = { id: string; api: string; console: string | null };

export function AiObservabilityClient() {
  const [engine, setEngine] = useState<{ blurb?: string; surfaces?: Surface[]; honesty?: unknown } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void apiFetch<{ blurb?: string; surfaces?: Surface[]; honesty?: unknown }>(
      '/v1/ai-observability/engine',
    )
      .then(setEngine)
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <AppShell>
      <main style={{ padding: '1.5rem', maxWidth: 900 }}>
        <p style={{ color: 'var(--muted)' }}>
          <Link href="/intelligence-cloud">Intelligence Cloud</Link>
          {' · '}
          <Link href="/intelligence-analytics">Intel Analytics</Link>
          {' · '}
          <Link href="/audit">Audit</Link>
        </p>
        <h1 style={{ fontSize: '1.75rem', margin: '0.5rem 0' }}>AI Observability</h1>
        <p>{engine?.blurb || 'Request IDs, audits, health, and product monitoring hubs.'}</p>
        {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
        <h2 style={{ fontSize: '1.1rem', marginTop: '1.25rem' }}>Surfaces</h2>
        <ul>
          {(engine?.surfaces ?? []).map((s) => (
            <li key={s.id}>
              <code>{s.api}</code>
              {s.console ? (
                <>
                  {' — '}
                  <Link href={s.console}>{s.console}</Link>
                </>
              ) : null}
            </li>
          ))}
        </ul>
        <pre style={{ background: 'var(--surface, #f4f4f5)', padding: 12, overflow: 'auto' }}>
          {JSON.stringify(engine?.honesty ?? {}, null, 2)}
        </pre>
      </main>
    </AppShell>
  );
}
