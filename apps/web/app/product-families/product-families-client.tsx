'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { resolveApiToken } from '@/lib/dev-auth';
import { AppShell } from '@/components/app-shell';
import { productStatusLabel } from '@/lib/product-status';

type ProductRow = {
  slug: string;
  family: string;
  name: string;
  status: string;
  api: string | null;
  consoleHref: string;
  metered: boolean;
  planGate: string | null;
  honesty: string;
  unlocksWithPlan: string;
};

type Overview = {
  engine: {
    note: string;
    products: ProductRow[];
    score: {
      total: number;
      byStatus: Record<string, number>;
      shippedRatio: number;
    };
  };
  entitlements: {
    planName: string;
    creditsRemaining: number;
    commercialLicense: boolean;
    professionalVoiceCloning: boolean;
  };
  unlocks: { note: string };
};

export function ProductFamiliesClient() {
  const { getToken, isLoaded } = useAuth();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [family, setFamily] = useState<'all' | 'VerbaCreative' | 'VerbaAgents' | 'VerbaAPI' | 'Resources'>(
    'all',
  );
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await resolveApiToken(getToken);
    if (!token) throw new Error('Not signed in');
    setOverview(await apiFetch<Overview>('/v1/product-families/overview', { token }));
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  const rows =
    overview?.engine.products.filter((p) => (family === 'all' ? true : p.family === family)) ?? [];

  return (
    <AppShell>
      <main style={{ padding: '1.5rem', maxWidth: 1100, display: 'grid', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-display)' }}>Product family readiness</h1>
          <p style={{ color: 'var(--muted)', margin: '0.4rem 0 0' }}>
            VerbaCreative · VerbaAgents · VerbaAPI · Resources — what charging unlocks, with honesty on
            partial surfaces.
          </p>
        </div>

        {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

        {overview ? (
          <>
            <div className="vl-panel" style={{ padding: '1rem 1.2rem' }}>
              <p style={{ margin: 0 }}>
                Plan <strong>{overview.entitlements.planName}</strong> ·{' '}
                {overview.entitlements.creditsRemaining.toLocaleString()} credits left · commercial=
                {String(overview.entitlements.commercialLicense)} · PVC=
                {String(overview.entitlements.professionalVoiceCloning)}
              </p>
              <p style={{ margin: '0.4rem 0 0', color: 'var(--muted)' }}>
                {overview.engine.score.byStatus.shipped_e2e}/{overview.engine.score.total} products ready (
                {Math.round(overview.engine.score.shippedRatio * 100)}%) · {overview.unlocks.note}
              </p>
              <p style={{ margin: '0.4rem 0 0' }}>
                <Link href="/billing">Billing</Link> · <Link href="/creative-media">Creative</Link> ·{' '}
                <Link href="/video-voice">Dubbing</Link> · <Link href="/keys">API keys</Link>
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {(['all', 'VerbaCreative', 'VerbaAgents', 'VerbaAPI', 'Resources'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  className={family === f ? 'vl-btn vl-btn-primary' : 'vl-btn vl-btn-secondary'}
                  onClick={() => setFamily(f)}
                >
                  {f === 'all' ? 'All' : f}
                </button>
              ))}
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.92rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border, #ddd)' }}>
                    <th style={{ padding: '0.5rem' }}>Product</th>
                    <th style={{ padding: '0.5rem' }}>Console</th>
                    <th style={{ padding: '0.5rem' }}>Unlocks</th>
                    <th style={{ padding: '0.5rem' }}>Honesty</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.slug} style={{ borderBottom: '1px solid var(--border, #eee)' }}>
                      <td style={{ padding: '0.55rem', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 600 }}>
                          {p.name}
                          {productStatusLabel(p.status) ? (
                            <span style={{ fontWeight: 500, color: 'var(--muted)', fontSize: '0.85rem' }}>
                              {' '}
                              · {productStatusLabel(p.status)}
                            </span>
                          ) : null}
                        </div>
                        <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                          {p.family} · {p.api ?? '—'}
                        </div>
                      </td>
                      <td style={{ padding: '0.55rem', verticalAlign: 'top' }}>
                        <Link href={p.consoleHref}>{p.consoleHref}</Link>
                      </td>
                      <td style={{ padding: '0.55rem', verticalAlign: 'top' }}>{p.unlocksWithPlan}</td>
                      <td style={{ padding: '0.55rem', verticalAlign: 'top', color: 'var(--muted)' }}>
                        {p.honesty}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p style={{ color: 'var(--muted)' }}>Loading readiness…</p>
        )}
      </main>
    </AppShell>
  );
}
