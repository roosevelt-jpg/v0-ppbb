'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { resolveApiToken } from '@/lib/dev-auth';
import { AppShell } from '@/components/app-shell';
import { AnalyticsSection, StatsCard, formatCompact } from '@/components/analytics';

type Sku = {
  id: string;
  family: string;
  language: string;
  version: string;
  displayName: string;
  status: string;
  marketingLine: string;
  qualityCard: {
    suite: string;
    metrics: Record<string, number | string | null>;
    honesty: string;
    lastEvalAt: string | null;
  };
};

type Release = {
  id: string;
  skuId: string;
  stage: string;
  gatePassed: boolean | null;
  changelog: string;
  updatedAt: string;
};

type Overview = {
  engine: {
    title: string;
    blurb: string;
    honesty: { note: string; sotaClaimsForbidden: boolean };
    pad: { active: string; upgradePath: string };
    infrastructureTiers: Record<string, Record<string, string>>;
    heroLanguages: string[];
  };
  skus: Sku[];
  recentReleases: Release[];
};

type Priority = {
  creditsUsed: number;
  rankedFeatures: Array<{ feature: string; credits: number }>;
  recommendedNextModels: Array<{ skuId: string; reason: string }>;
  note: string;
};

export function ModelReleaseClient() {
  const { getToken, isLoaded } = useAuth();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [priority, setPriority] = useState<Priority | null>(null);
  const [skus, setSkus] = useState<Sku[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [selectedSku, setSelectedSku] = useState('vl-mt-af-v1');
  const [gateResult, setGateResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const token = await resolveApiToken(getToken);
    if (!token) throw new Error('Not signed in — use /dev-login');
    const [ov, pri, skuRes, relRes] = await Promise.all([
      apiFetch<Overview>('/v1/model-release/overview', { token }),
      apiFetch<Priority>('/v1/model-release/priority', { token }),
      apiFetch<{ skus: Sku[] }>('/v1/model-release/skus'),
      apiFetch<{ releases: Release[] }>('/v1/model-release/releases', { token }),
    ]);
    setOverview(ov);
    setPriority(pri);
    setSkus(skuRes.skus);
    setReleases(relRes.releases);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void refresh().catch((err: Error) => setError(err.message));
  }, [isLoaded, refresh]);

  async function runGate() {
    setBusy(true);
    setError(null);
    try {
      const token = await resolveApiToken(getToken);
      if (!token) throw new Error('Not signed in');
      const res = await apiFetch<Record<string, unknown>>('/v1/model-release/gate', {
        token,
        method: 'POST',
        body: JSON.stringify({ skuId: selectedSku }),
      });
      setGateResult(res);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gate failed');
    } finally {
      setBusy(false);
    }
  }

  async function startRelease() {
    setBusy(true);
    setError(null);
    try {
      const token = await resolveApiToken(getToken);
      if (!token) throw new Error('Not signed in');
      await apiFetch('/v1/model-release/releases', {
        token,
        method: 'POST',
        body: JSON.stringify({
          skuId: selectedSku,
          changelog: `Console-started release for ${selectedSku}`,
        }),
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create release failed');
    } finally {
      setBusy(false);
    }
  }

  async function promote(id: string) {
    setBusy(true);
    setError(null);
    try {
      const token = await resolveApiToken(getToken);
      if (!token) throw new Error('Not signed in');
      await apiFetch(`/v1/model-release/releases/${id}/promote`, {
        token,
        method: 'POST',
        body: JSON.stringify({}),
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Promote failed');
    } finally {
      setBusy(false);
    }
  }

  const gaCount = skus.filter((s) => s.status === 'ga').length;
  const evalCount = skus.filter((s) => s.status === 'eval' || s.status === 'canary').length;

  return (
    <AppShell>
      <p style={{ color: 'var(--muted)', margin: '0 0 0.5rem' }}>
        <Link href="/model-registry">Model Registry</Link>
        {' · '}
        <Link href="/gpu-platform">GPU Platform</Link>
        {' · '}
        <Link href="/usage">Usage</Link>
        {' · '}
        <Link href="/voice-law-authenticity">Voice Law Auth</Link>
      </p>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.85rem',
          fontWeight: 720,
          letterSpacing: '-0.03em',
          margin: '0 0 0.35rem',
        }}
      >
        Model Release Pipeline
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.25rem', maxWidth: '46rem' }}>
        {overview?.engine.blurb ??
          'Data → Train → Eval → Serve → Announce for VerbaLab African SKUs — not weekly GPT clones.'}
      </p>

      {overview ? (
        <p
          style={{
            margin: '0 0 1.25rem',
            padding: '0.85rem 1rem',
            borderRadius: 12,
            border: '1px solid var(--line)',
            background: 'var(--bg-soft)',
            color: 'var(--muted)',
            fontSize: '0.9rem',
            maxWidth: '46rem',
            lineHeight: 1.45,
          }}
        >
          {overview.engine.honesty.note} PAD provider: <code className="vl-code">{overview.engine.pad.active}</code>.
        </p>
      ) : null}

      {error ? <p style={{ color: 'var(--bad)' }}>{error}</p> : null}

      <section className="vl-stat-grid" style={{ marginBottom: '1.5rem' }}>
        <StatsCard label="SKUs" value={formatCompact(skus.length)} hint="Versioned product models" />
        <StatsCard label="In eval / canary" value={formatCompact(evalCount)} hint="Need African quality gates" tone="warn" />
        <StatsCard label="GA" value={formatCompact(gaCount)} hint="GA with honesty cards" tone="ok" />
        <StatsCard
          label="Credits used"
          value={formatCompact(priority?.creditsUsed ?? 0)}
          hint="Drives next-model priority"
          tone="brand"
        />
      </section>

      <AnalyticsSection title="Usage → next models" subtitle={priority?.note}>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {(priority?.recommendedNextModels ?? []).map((m) => (
            <li
              key={`${m.skuId}-${m.reason}`}
              style={{ borderTop: '1px solid var(--line)', padding: '0.55rem 0', fontSize: '0.9rem' }}
            >
              <button
                type="button"
                className="vl-btn"
                style={{ marginRight: '0.65rem', padding: '0.2rem 0.55rem', fontSize: '0.8rem' }}
                onClick={() => setSelectedSku(m.skuId)}
              >
                {m.skuId}
              </button>
              {m.reason}
            </li>
          ))}
        </ul>
      </AnalyticsSection>

      <section className="vl-panel" style={{ padding: '1.2rem', display: 'grid', gap: '0.85rem', maxWidth: '40rem', margin: '1.5rem 0' }}>
        <label style={{ display: 'grid', gap: '0.3rem' }}>
          <span style={label}>SKU for gate / release</span>
          <select className="vl-field" value={selectedSku} onChange={(e) => setSelectedSku(e.target.value)}>
            {skus.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id} · {s.status}
              </option>
            ))}
          </select>
        </label>
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button type="button" className="vl-btn vl-btn-primary" disabled={busy} onClick={() => void runGate()}>
            {busy ? 'Working…' : 'Run African quality gate'}
          </button>
          <button type="button" className="vl-btn" disabled={busy} onClick={() => void startRelease()}>
            Start release
          </button>
        </div>
        {gateResult ? (
          <pre
            className="vl-code"
            style={{
              margin: 0,
              padding: '0.85rem',
              background: 'var(--bg-soft)',
              borderRadius: 10,
              overflow: 'auto',
              maxHeight: '14rem',
              fontSize: '0.78rem',
            }}
          >
            {JSON.stringify(gateResult, null, 2)}
          </pre>
        ) : null}
      </section>

      <AnalyticsSection title="Active releases" subtitle="Promote stages only after gate pass for GA.">
        {releases.length === 0 ? (
          <p style={{ color: 'var(--muted)', margin: 0 }}>No releases yet — start one above.</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {releases.map((r) => (
              <li
                key={r.id}
                style={{
                  borderTop: '1px solid var(--line)',
                  padding: '0.65rem 0',
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  fontSize: '0.9rem',
                }}
              >
                <code className="vl-code">{r.id}</code>
                <span>
                  {r.skuId} · {r.stage}
                  {r.gatePassed === true ? ' · gate✓' : r.gatePassed === false ? ' · gate✗' : ''}
                </span>
                <button type="button" className="vl-btn" disabled={busy || r.stage === 'ga'} onClick={() => void promote(r.id)}>
                  Promote
                </button>
              </li>
            ))}
          </ul>
        )}
      </AnalyticsSection>

      <AnalyticsSection title="SKU quality cards" subtitle="Market African wins — never “we beat Claude.”">
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {skus.slice(0, 16).map((s) => (
            <div
              key={s.id}
              style={{
                borderTop: '1px solid var(--line)',
                paddingTop: '0.65rem',
                fontSize: '0.9rem',
              }}
            >
              <strong>{s.displayName}</strong>{' '}
              <span style={{ color: 'var(--muted)' }}>
                {s.id} · {s.status} · {s.family}/{s.language}
              </span>
              <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)' }}>{s.marketingLine}</p>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--muted)' }}>{s.qualityCard.honesty}</p>
            </div>
          ))}
        </div>
      </AnalyticsSection>

      {overview?.engine.infrastructureTiers ? (
        <AnalyticsSection title="GPU tiers" subtitle="Ceilings required — Volume 7 GPU Platform patterns.">
          <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.9rem' }}>
            {Object.entries(overview.engine.infrastructureTiers).map(([key, tier]) => (
              <div key={key} style={{ borderTop: '1px solid var(--line)', paddingTop: '0.55rem' }}>
                <strong>Tier {key}</strong> — {tier.name ?? tier.note}
                <p style={{ margin: '0.2rem 0 0', color: 'var(--muted)' }}>
                  {Object.entries(tier)
                    .filter(([k]) => k !== 'name')
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(' · ')}
                </p>
              </div>
            ))}
          </div>
        </AnalyticsSection>
      ) : null}
    </AppShell>
  );
}

const label: React.CSSProperties = {
  fontSize: '0.8rem',
  fontWeight: 650,
  color: 'var(--muted)',
};
