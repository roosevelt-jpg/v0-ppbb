'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

export function AgentIntelligenceClient() {
  const [engine, setEngine] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void apiFetch<Record<string, unknown>>('/v1/agent-intelligence/engine')
      .then(setEngine)
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <AppShell>
      <main style={{ padding: '1.5rem', maxWidth: 900 }}>
        <p style={{ color: 'var(--muted)' }}>
          <Link href="/intelligence-cloud">Intelligence Cloud</Link>
          {' · '}
          <Link href="/agent-runtime">Agent Runtime</Link>
          {' · '}
          <Link href="/ai-orchestration">Orchestration</Link>
          {' · '}
          <Link href="/partner-connectors">Partner Connectors</Link>
        </p>
        <h1 style={{ fontSize: '1.75rem', margin: '0.5rem 0' }}>Agent Intelligence</h1>
        <p>
          {(engine?.blurb as string) ||
            'Hub over agent-runtime, voice FAQ, orchestration, and partner MCP tools.'}
        </p>
        {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
        <pre style={{ background: 'var(--surface, #f4f4f5)', padding: 12, overflow: 'auto' }}>
          {JSON.stringify(engine, null, 2)}
        </pre>
      </main>
    </AppShell>
  );
}
