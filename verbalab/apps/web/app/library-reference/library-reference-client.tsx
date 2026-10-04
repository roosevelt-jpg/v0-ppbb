'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Products = {
  product: string;
  note: string;
  honesty: Record<string, boolean | string>;
  summary?: Record<string, unknown>;
  products?: Array<Record<string, unknown>>;
};

type Index = {
  volumes: Array<{ volume: number; title: string; phases: Array<{ phase: number; name: string }> }>;
  summary: { volumeCount: number; phaseCount: number; executableThroughPhase: number };
};

type Risks = {
  areas: Array<{ id: string; volume: number; phase: number; title: string; severity: string; summary: string; safeBuild: string }>;
  pattern: string;
};

type Vision = {
  label: string;
  executablePhases: boolean;
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

  return (
    <AppShell>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.85rem', fontWeight: 720, letterSpacing: '-0.03em', margin: '0 0 0.35rem' }}>
        Library Reference
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}>
        Master phase index, deeper risk notes, and raw AI Internet vision. Index/reference only — vision names are not executable phases.
      </p>
      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}
      {!products && !error ? <p style={{ color: 'var(--muted)' }}>Loading…</p> : null}

      {products ? (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          <p style={{ margin: 0, color: 'var(--muted)' }}>{products.note}</p>
          <pre style={{ margin: 0, padding: '1rem', background: 'var(--surface)', overflow: 'auto', fontSize: '0.78rem' }}>
            {JSON.stringify({ honesty: products.honesty, summary: products.summary }, null, 2)}
          </pre>

          {risks ? (
            <section className="vl-panel" style={{ padding: '1.2rem', display: 'grid', gap: '0.75rem' }}>
              <h2 style={{ margin: 0, fontSize: '1rem' }}>Deeper risk notes (5)</h2>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>{risks.pattern}</p>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.55rem' }}>
                {risks.areas.map((a) => (
                  <li key={a.id} style={{ borderTop: '1px solid var(--line)', paddingTop: '0.55rem' }}>
                    <strong>
                      Vol {a.volume} / Phase {a.phase}: {a.title}
                    </strong>{' '}
                    <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>({a.severity})</span>
                    <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.88rem' }}>{a.summary}</p>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem' }}>Safe build: {a.safeBuild}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {vision ? (
            <section className="vl-panel" style={{ padding: '1.2rem', display: 'grid', gap: '0.75rem' }}>
              <h2 style={{ margin: 0, fontSize: '1rem' }}>{vision.label}</h2>
              <p style={{ margin: 0, borderLeft: '3px solid #b45309', paddingLeft: '0.75rem', fontSize: '0.9rem' }}>
                executablePhases={String(vision.executablePhases)}. {vision.note}
              </p>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.88rem' }}>{vision.missionControl}</p>
              <p style={{ margin: 0, fontSize: '0.88rem' }}>
                Six-repo recommendation: {vision.sixRepoRecommendation.join(', ')}
              </p>
              <details>
                <summary style={{ cursor: 'pointer' }}>{vision.features.length} vision feature names</summary>
                <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.2rem', color: 'var(--muted)', fontSize: '0.88rem' }}>
                  {vision.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </details>
            </section>
          ) : null}

          {index ? (
            <section className="vl-panel" style={{ padding: '1.2rem', display: 'grid', gap: '0.75rem' }}>
              <h2 style={{ margin: 0, fontSize: '1rem' }}>
                Master phase index ({index.summary.volumeCount} volumes / {index.summary.phaseCount} phase rows)
              </h2>
              <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap', alignItems: 'end' }}>
                <label className="vl-label" style={{ flex: '0 1 8rem' }}>
                  Volume
                  <input className="vl-field" value={volumeFilter} onChange={(e) => setVolumeFilter(e.target.value)} placeholder="e.g. 24" />
                </label>
                <button type="button" className="vl-btn vl-btn-primary" onClick={() => void loadVolume()}>
                  Filter
                </button>
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.85rem' }}>
                {index.volumes.map((v) => (
                  <li key={v.volume} style={{ borderTop: '1px solid var(--line)', paddingTop: '0.55rem' }}>
                    <strong>
                      Volume {v.volume} — {v.title}
                    </strong>
                    <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
                      {v.phases.map((p) => `${p.phase}:${p.name}`).join(' · ')}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : null}
    </AppShell>
  );
}
