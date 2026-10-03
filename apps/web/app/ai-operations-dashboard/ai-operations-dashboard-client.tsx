'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import { CatalogConsole, type CatalogRow } from '@/components/catalog-console';

type Snapshot = {
  products?: { shipped?: number; total?: number };
  datasets?: { runs?: number };
  training?: { jobs?: number; running?: number };
  prompts?: { registry?: number };
  knowledge?: { ragPipelines?: number };
  drift?: { driftClear?: boolean; signalCount?: number };
  safety?: {
    continuousEvalPass?: boolean;
    policyViolations?: unknown[];
    blockedActions?: unknown[];
  };
  continuousLearning?: { candidates?: number; autoPromote?: boolean };
};

type Engine = {
  product: string;
  note: string;
  honesty: Record<string, unknown>;
  safety?: { note?: string } & Record<string, unknown>;
  snapshot?: Snapshot;
  products?: CatalogRow[];
};

export function AiOperationsDashboardClient() {
  const [data, setData] = useState<Engine | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([
      apiFetch<Engine>('/v1/ai-operations-dashboard/engine'),
      apiFetch<{ products?: CatalogRow[] }>('/v1/mlops-llmops-cloud/products'),
    ])
      .then(([engine, mlops]) => setData({ ...engine, products: mlops.products ?? [] }))
      .catch((err: Error) => setError(err.message));
  }, []);

  const snap = data?.snapshot;
  const chips = snap
    ? [
        {
          label: 'products',
          value: `${snap.products?.shipped ?? 0}/${snap.products?.total ?? 0} shipped`,
        },
        { label: 'datasetRuns', value: String(snap.datasets?.runs ?? 0) },
        { label: 'trainingJobs', value: String(snap.training?.jobs ?? 0) },
        { label: 'promptRegistry', value: String(snap.prompts?.registry ?? 0) },
        { label: 'ragPipelines', value: String(snap.knowledge?.ragPipelines ?? 0) },
        { label: 'driftClear', value: snap.drift?.driftClear ? 'true' : 'false' },
        {
          label: 'continuousEvalPass',
          value: snap.safety?.continuousEvalPass ? 'true' : 'false',
        },
        {
          label: 'policyViolations',
          value: String(snap.safety?.policyViolations?.length ?? 0),
        },
        {
          label: 'learningCandidates',
          value: String(snap.continuousLearning?.candidates ?? 0),
        },
      ]
    : [];

  return (
    <AppShell>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.85rem', fontWeight: 720, letterSpacing: '-0.03em', margin: '0 0 0.35rem' }}>
        AI Operations Dashboard
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}>
        VerbaLab AI Operations Dashboard console in the MLOps & LLMOps Cloud.
      </p>
      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}
      {!data && !error ? <p style={{ color: 'var(--muted)' }}>Loading…</p> : null}
      {data ? (
        <CatalogConsole
          note={data.note}
          safetyNote={data.safety?.note ? String(data.safety.note) : undefined}
          honesty={data.honesty}
          statusChips={chips}
          sections={[{ title: 'Sibling hubs', rows: data.products ?? [] }]}
          backHref="/mlops-llmops-cloud"
          backLabel="MLOps & LLMOps Cloud"
        />
      ) : null}
    </AppShell>
  );
}
