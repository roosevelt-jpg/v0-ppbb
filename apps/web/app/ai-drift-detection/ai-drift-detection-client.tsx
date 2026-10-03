'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import { CatalogConsole, type CatalogRow } from '@/components/catalog-console';

type Engine = {
  product: string;
  note: string;
  honesty: Record<string, unknown>;
  safety?: { note?: string } & Record<string, unknown>;
  capabilities?: CatalogRow[];
  signals?: CatalogRow[];
  driftClear?: boolean;
};

export function AiDriftDetectionClient() {
  const [data, setData] = useState<Engine | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void apiFetch<Engine>('/v1/ai-drift-detection/engine')
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <AppShell>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.85rem', fontWeight: 720, letterSpacing: '-0.03em', margin: '0 0 0.35rem' }}>
        AI Drift Detection
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}>
        VerbaLab AI Drift Detection console in the MLOps & LLMOps Cloud.
      </p>
      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}
      {!data && !error ? <p style={{ color: 'var(--muted)' }}>Loading…</p> : null}
      {data ? (
        <CatalogConsole
          note={data.note}
          safetyNote={data.safety?.note ? String(data.safety.note) : undefined}
          honesty={data.honesty}
          statusChips={[{ label: 'driftClear', value: data.driftClear ? 'true' : 'false' }]}
          sections={[
            { title: 'Capabilities', rows: data.capabilities ?? [] },
            {
              title: 'Signals',
              rows: (data.signals ?? []).map((s) => ({
                ...s,
                name: String(s.name ?? s.id),
                status: String(s.severity ?? s.status ?? ''),
              })),
            },
          ]}
          backHref="/mlops-llmops-cloud"
          backLabel="MLOps & LLMOps Cloud"
        />
      ) : null}
    </AppShell>
  );
}
