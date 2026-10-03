'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

export function AiInternetAuditClient() {
  const [engine, setEngine] = useState<Record<string, unknown> | null>(null);
  useEffect(() => {
    void apiFetch<Record<string, unknown>>('/v1/ai-internet-audit/engine').then(setEngine);
  }, []);
  return (
    <AppShell>
      <main style={{ padding: '1.5rem', maxWidth: 920 }}>
        <h1>AI Internet Production Audit</h1>
        <pre style={{ background: 'var(--surface, #f4f4f5)', padding: 12 }}>
          {JSON.stringify(engine, null, 2)}
        </pre>
      </main>
    </AppShell>
  );
}
