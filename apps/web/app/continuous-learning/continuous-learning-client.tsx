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
  feedback?: CatalogRow[];
  candidates?: CatalogRow[];
};

export function ContinuousLearningClient() {
  const [data, setData] = useState<Engine | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void apiFetch<Engine>('/v1/continuous-learning/engine')
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <AppShell>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.85rem', fontWeight: 720, letterSpacing: '-0.03em', margin: '0 0 0.35rem' }}>
        Continuous Learning
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}>
        VerbaLab Continuous Learning console in the MLOps & LLMOps Cloud.
      </p>
      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}
      {!data && !error ? <p style={{ color: 'var(--muted)' }}>Loading…</p> : null}
      {data ? (
        <CatalogConsole
          note={data.note}
          safetyNote={data.safety?.note ? String(data.safety.note) : undefined}
          honesty={data.honesty}
          statusChips={[{ label: 'autoPromote', value: 'false' }]}
          sections={[
            { title: 'Capabilities', rows: data.capabilities ?? [] },
            {
              title: 'Feedback',
              rows: (data.feedback ?? []).map((f) => ({
                ...f,
                name: String(f.source ?? f.name ?? f.id),
                status: f.vetted === false ? 'unvetted' : 'vetted',
              })),
            },
            {
              title: 'Promote candidates',
              rows: (data.candidates ?? []).map((c) => ({
                ...c,
                name: String(c.name ?? c.id),
                status: String(c.status ?? 'gated'),
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
