'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import { CatalogConsole, type CatalogRow } from '@/components/catalog-console';
import { hidePhaseIds } from '@/lib/ui-copy';

type Products = {
  product: string;
  note: string;
  honesty?: Record<string, unknown>;
  summary?: {
    volumeCount?: number;
    phaseCount?: number;
    executableThroughPhase?: number;
  };
  products?: CatalogRow[];
};

type Index = {
  note?: string;
  volumes: Array<{ volume: number; title: string; phases: Array<{ phase: number; name: string }> }>;
  summary: { volumeCount: number; phaseCount: number; executableThroughPhase: number };
};

type Risks = {
  areas: Array<{
    id: string;
    volume: number;
    phase: number;
    title: string;
    severity: string;
    summary: string;
    safeBuild: string;
  }>;
  pattern: string;
  note?: string;
};

type Vision = {
  label: string;
  features: string[];
  sixRepoRecommendation: string[];
  missionControl: string;
  note: string;
};

export function LibraryReferenceClient() {
  const [products, setProducts] = useState<Products | null>(null);
  const [index, setIndex] = useState<Index | null>(null);
  const [risks, setRisks] = useState<Risks | null>(null);
  const [vision, setVision] = useState<Vision | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [volumeFilter, setVolumeFilter] = useState('');

  useEffect(() => {
    void Promise.all([
      apiFetch<Products>('/v1/library-reference/products'),
      apiFetch<Index>('/v1/library-reference/index'),
      apiFetch<Risks>('/v1/library-reference/risks'),
      apiFetch<Vision>('/v1/library-reference/vision'),
    ])
      .then(([p, i, r, v]) => {
        setProducts(p);
        setIndex(i);
        setRisks(r);
        setVision(v);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  async function loadVolume() {
    const q = volumeFilter.trim() ? `?volume=${encodeURIComponent(volumeFilter.trim())}` : '';
    const i = await apiFetch<Index>(`/v1/library-reference/index${q}`);
    setIndex(i);
  }

  const riskRows: CatalogRow[] = (risks?.areas ?? []).map((a) => ({
    id: a.id,
    name: a.title,
    severity: a.severity,
    notes: hidePhaseIds(`${a.summary} Safe build: ${a.safeBuild}`),
    stage: `Vol ${a.volume}`,
  }));

  const volumeRows: CatalogRow[] = (index?.volumes ?? []).map((v) => ({
    id: `vol-${v.volume}`,
    name: `Volume ${v.volume} — ${v.title}`,
    notes: v.phases.map((p) => p.name).join(' · '),
    status: `${v.phases.length} phases`,
  }));

  return (
    <AppShell>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.85rem',
          fontWeight: 720,
          letterSpacing: '-0.03em',
          margin: '0 0 0.35rem',
        }}
      >
        Library Reference
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}>
        Master phase index, deeper risk notes, and forward-looking vision references for the VerbaLab roadmap.
      </p>
      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}
      {!products && !error ? <p style={{ color: 'var(--muted)' }}>Loading…</p> : null}

      {products ? (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          <CatalogConsole
            note={products.note}
            honesty={products.honesty}
            statusChips={[
              {
                label: 'Volumes',
                value: String(products.summary?.volumeCount ?? index?.summary.volumeCount ?? '—'),
              },
              {
                label: 'Phase rows',
                value: String(products.summary?.phaseCount ?? index?.summary.phaseCount ?? '—'),
              },
              {
                label: 'Executable through',
                value: String(
                  products.summary?.executableThroughPhase ??
                    index?.summary.executableThroughPhase ??
                    '—',
                ),
              },
            ]}
            sections={[
              { title: 'Reference surfaces', rows: products.products ?? [] },
              { title: 'Risk notes', rows: riskRows },
            ]}
          />

          {vision ? (
            <section className="vl-panel" style={{ padding: '1.2rem', display: 'grid', gap: '0.75rem' }}>
              <h2 style={{ margin: 0, fontSize: '1rem' }}>{vision.label}</h2>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>
                {hidePhaseIds(vision.note)}
              </p>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.88rem' }}>
                {hidePhaseIds(vision.missionControl)}
              </p>
              <p style={{ margin: 0, fontSize: '0.88rem' }}>
                Recommended repos: {vision.sixRepoRecommendation.join(', ')}
              </p>
              <details>
                <summary style={{ cursor: 'pointer' }}>{vision.features.length} vision feature names</summary>
                <ul
                  style={{
                    margin: '0.5rem 0 0',
                    paddingLeft: '1.2rem',
                    color: 'var(--muted)',
                    fontSize: '0.88rem',
                  }}
                >
                  {vision.features.map((f) => (
                    <li key={f}>{hidePhaseIds(f)}</li>
                  ))}
                </ul>
              </details>
            </section>
          ) : null}

          {index ? (
            <section className="vl-panel" style={{ padding: '1.2rem', display: 'grid', gap: '0.75rem' }}>
              <h2 style={{ margin: 0, fontSize: '1rem' }}>
                Master phase index ({index.summary.volumeCount} volumes / {index.summary.phaseCount}{' '}
                phase rows)
              </h2>
              <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap', alignItems: 'end' }}>
                <label className="vl-label" style={{ flex: '0 1 8rem' }}>
                  Volume
                  <input
                    className="vl-field"
                    value={volumeFilter}
                    onChange={(e) => setVolumeFilter(e.target.value)}
                    placeholder="e.g. 20"
                  />
                </label>
                <button type="button" className="vl-btn vl-btn-primary" onClick={() => void loadVolume()}>
                  Filter
                </button>
              </div>
              <CatalogConsole sections={[{ title: 'Volumes', rows: volumeRows }]} />
            </section>
          ) : null}
        </div>
      ) : null}
    </AppShell>
  );
}
