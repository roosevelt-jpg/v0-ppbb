'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Engine = {
  title?: string;
  blurb?: string;
  safety?: { note?: string };
  deploy?: Record<string, unknown>;
  africanEngine?: { lexiconEntries?: number; lexiconPairs?: string[] };
};

type EvalReport = {
  ownWinRate?: number;
  baselineWinRate?: number;
  total?: number;
  honesty?: { note?: string };
};

type Unlocks = {
  productionUnlocks?: Array<{
    sector: string;
    productionReady: boolean;
    missing: string[];
  }>;
  honesty?: { note?: string };
};

export function ModelRuntimeClient() {
  const [engine, setEngine] = useState<Engine | null>(null);
  const [evalReport, setEvalReport] = useState<EvalReport | null>(null);
  const [unlocks, setUnlocks] = useState<Unlocks | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([
      apiFetch<Engine>('/v1/model-runtime/engine'),
      apiFetch<EvalReport>('/v1/model-runtime/eval'),
      apiFetch<Unlocks>('/v1/model-runtime/unlocks'),
    ])
      .then(([e, ev, u]) => {
        setEngine(e);
        setEvalReport(ev);
        setUnlocks(u);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <AppShell>
      <main style={{ padding: '1.5rem', maxWidth: 920 }}>
        <p style={{ color: 'var(--muted)' }}>
          <Link href="/translate-fm">Translate FM</Link>
          {' · '}
          <Link href="/model-keys">Model keys</Link>
          {' · '}
          <Link href="/credentials-readiness">Credentials</Link>
        </p>
        <h1 style={{ fontSize: '1.75rem', margin: '0.5rem 0' }}>Model Runtime</h1>
        <p>{engine?.blurb ?? 'VerbaLab Own AI local runtime.'}</p>
        {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
        {engine?.safety?.note ? (
          <p style={{ color: 'var(--muted)' }}>{engine.safety.note}</p>
        ) : null}

        <h2 style={{ marginTop: '1.75rem', fontSize: '1.15rem' }}>What&apos;s honest to say out loud</h2>
        <ul style={{ lineHeight: 1.6, paddingLeft: '1.2rem' }}>
          <li>
            Local Own AI runtime is in-process (
            {engine?.africanEngine?.lexiconEntries ?? '…'} African lexicon entries across{' '}
            {(engine?.africanEngine?.lexiconPairs ?? []).join(', ') || '…'}).
          </li>
          <li>
            African quality eval: Own AI{' '}
            {evalReport?.ownWinRate != null
              ? `${(evalReport.ownWinRate * 100).toFixed(1)}%`
              : '…'}{' '}
            exact-match vs vendor baseline stub{' '}
            {evalReport?.baselineWinRate != null
              ? `${(evalReport.baselineWinRate * 100).toFixed(1)}%`
              : '…'}{' '}
            on {evalReport?.total ?? '…'} cases.
          </li>
          <li>
            Gov / bank / hospital production unlocks are checklist-gated
            {unlocks?.productionUnlocks
              ? ` — ${unlocks.productionUnlocks.filter((u) => u.productionReady).length}/${unlocks.productionUnlocks.length} unlocked`
              : ''}
            .
          </li>
          <li>Neural weight binaries deploy via VERBALAB_WEIGHTS_URL — not claimed as git-shipped SOTA.</li>
        </ul>

        <h2 style={{ marginTop: '1.75rem', fontSize: '1.15rem' }}>Enterprise unlocks</h2>
        <div style={{ display: 'grid', gap: 8 }}>
          {(unlocks?.productionUnlocks ?? []).map((u) => (
            <div key={u.sector} style={{ borderTop: '1px solid var(--border, #e4e4e7)', paddingTop: 8 }}>
              <strong style={{ textTransform: 'capitalize' }}>{u.sector}</strong>
              {' — '}
              {u.productionReady ? 'production ready' : `locked (${u.missing.join(', ') || 'checklist'})`}
            </div>
          ))}
        </div>

        <h2 style={{ marginTop: '1.75rem', fontSize: '1.15rem' }}>Deploy shape</h2>
        <pre style={{ background: 'var(--surface, #f4f4f5)', padding: 12, overflow: 'auto' }}>
          {JSON.stringify(engine?.deploy ?? {}, null, 2)}
        </pre>
      </main>
    </AppShell>
  );
}
