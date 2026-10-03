'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

export function AiFederationMeshClient() {
  const [engine, setEngine] = useState<Record<string, unknown> | null>(null);
  useEffect(() => {
    void apiFetch<Record<string, unknown>>('/v1/ai-federation-mesh/engine').then(setEngine);
  }, []);
  return (
    <AppShell>
      <main style={{ padding: '1.5rem', maxWidth: 920 }}>
        <p style={{ color: 'var(--muted)' }}>
          <Link href="/ai-internet">AI Internet</Link>
        </p>
        <h1>AI Federation Mesh</h1>
        <p>Model, runtime, memory, and knowledge federation between VerbaLab nodes.</p>
        <pre style={{ background: 'var(--surface, #f4f4f5)', padding: 12, overflow: 'auto' }}>
          {JSON.stringify(engine, null, 2)}
        </pre>
      </main>
    </AppShell>
  );
}
