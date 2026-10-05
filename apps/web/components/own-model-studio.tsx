'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { resolveApiToken } from '@/lib/dev-auth';
import { AppShell } from '@/components/app-shell';
import { AnalyticsSection, StatsCard } from '@/components/analytics';

type Development = {
  sharpness: string;
  cost: {
    tier: string;
    product: string | null;
    rate: { creditsPerUnit: number; unit: string; note: string } | null;
    tip: string;
  };
  useWhen: string[];
  avoidWhen: string[];
  siblings: Array<{ id: string; relation: string }>;
  skus: string[];
  missing: Array<{ id: string; gap: string; fix: string; status: string }>;
  marketingLine: string;
  try: { kind: string; href: string; label: string };
  heroLanguages: string[];
};

type FamilyDetail = {
  family: {
    id: string;
    title: string;
    blurb: string;
    modality: string;
    consolePath: string;
    marketingLine: string;
  };
  cost: Development['cost'];
  links: { try: string; modelRelease: string; hub: string };
};

type RouteResult = {
  primary: { id: string; title: string; costTier: string; consolePath: string };
  reason: string;
  alternates: Array<{ id: string; title: string; costTier: string }>;
  cost: Development['cost'];
};

type Props = {
  modelId: string;
  enginePath: string;
  crumbExtra?: Array<{ href: string; label: string }>;
};

export function OwnModelStudio({ modelId, enginePath, crumbExtra = [] }: Props) {
  const { getToken, isLoaded } = useAuth();
  const [engine, setEngine] = useState<Record<string, unknown> | null>(null);
  const [detail, setDetail] = useState<FamilyDetail | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [estimate, setEstimate] = useState<Record<string, unknown> | null>(null);
  const [units, setUnits] = useState('1000');
  const [intent, setIntent] = useState('chat');
  const [budget, setBudget] = useState<'frugal' | 'balanced' | 'quality'>('balanced');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [eng, fam] = await Promise.all([
      apiFetch<Record<string, unknown>>(enginePath),
      apiFetch<FamilyDetail>(`/v1/own-models/families/${modelId}`).catch(() => null),
    ]);
    setEngine(eng);
    if (fam) setDetail(fam);
  }, [enginePath, modelId]);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  const development = (engine?.development as Development | undefined) ?? null;
  const title = String(engine?.title ?? detail?.family.title ?? modelId);
  const blurb = String(engine?.blurb ?? detail?.family.blurb ?? '');
  const cost = development?.cost ?? detail?.cost;
  const openGaps = (development?.missing ?? []).filter((m) => m.status === 'open');

  async function runRoute() {
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch<RouteResult>('/v1/own-models/route', {
        method: 'POST',
        body: JSON.stringify({ intent, budget }),
      });
      setRoute(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Route failed');
    } finally {
      setBusy(false);
    }
  }

  async function runEstimate() {
    setBusy(true);
    setError(null);
    try {
      const token = await resolveApiToken(getToken);
      const res = await apiFetch<Record<string, unknown>>('/v1/own-models/estimate', {
        token: token ?? undefined,
        method: 'POST',
        body: JSON.stringify({ familyId: modelId, units: Number(units) || 1 }),
      });
      setEstimate(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Estimate failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <p style={{ color: 'var(--muted)', margin: '0 0 0.5rem' }}>
        <Link href="/own-models">Own Models</Link>
        {' · '}
        <Link href="/foundation-model-cloud">Foundation Model Cloud</Link>
        {' · '}
        <Link href="/model-release">Model Release</Link>
        {crumbExtra.map((c) => (
          <span key={c.href}>
            {' · '}
            <Link href={c.href}>{c.label}</Link>
          </span>
        ))}
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
        {title}
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.25rem', maxWidth: '46rem' }}>{blurb}</p>

      {error ? <p style={{ color: 'var(--bad)' }}>{error}</p> : null}

      <section className="vl-stat-grid" style={{ marginBottom: '1.25rem' }}>
        <StatsCard
          label="Cost tier"
          value={cost?.tier ?? '—'}
          hint={cost?.product ? `meters as ${cost.product}` : 'pack / fabric'}
          tone={cost?.tier === 'premium' ? 'warn' : cost?.tier === 'frugal' ? 'ok' : 'brand'}
        />
        <StatsCard
          label="Sharpness"
          value={(development?.sharpness ?? '—').replace(/_/g, ' ')}
          hint={String(engine?.modality ?? detail?.family.modality ?? '')}
        />
        <StatsCard
          label="Open gaps"
          value={String(openGaps.length)}
          hint="Missing pieces tracked below"
          tone={openGaps.length ? 'warn' : 'ok'}
        />
        <StatsCard
          label="Hero languages"
          value={String((development?.heroLanguages ?? []).length || '—')}
          hint={(development?.heroLanguages ?? []).slice(0, 5).join(', ')}
        />
      </section>

      {development?.marketingLine || cost?.tip ? (
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
          {development?.marketingLine} {cost?.tip}
        </p>
      ) : null}

      <div style={{ display: 'grid', gap: '1.25rem', maxWidth: '52rem' }}>
        <AnalyticsSection title="When to use this model" subtitle="Cost-effective sharpness — pick the specialist.">
          <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: '1fr 1fr' }}>
            <div>
              <h3 style={subh}>Use when</h3>
              <ul style={list}>
                {(development?.useWhen ?? []).map((u) => (
                  <li key={u}>{u}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 style={subh}>Avoid when</h3>
              <ul style={list}>
                {(development?.avoidWhen ?? []).map((u) => (
                  <li key={u}>{u}</li>
                ))}
              </ul>
            </div>
          </div>
          {development?.try ? (
            <p style={{ margin: '0.75rem 0 0' }}>
              <Link className="vl-btn vl-btn-primary" href={development.try.href} style={{ display: 'inline-block' }}>
                {development.try.label}
              </Link>
            </p>
          ) : null}
        </AnalyticsSection>

        <AnalyticsSection title="Cost estimate" subtitle={cost?.rate?.note ?? 'Pack / non-unit pricing'}>
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'end' }}>
            <label style={{ display: 'grid', gap: '0.3rem' }}>
              <span style={label}>Units ({cost?.rate?.unit ?? 'n/a'})</span>
              <input className="vl-field" value={units} onChange={(e) => setUnits(e.target.value)} style={{ width: 140 }} />
            </label>
            <button type="button" className="vl-btn" disabled={busy} onClick={() => void runEstimate()}>
              Estimate credits
            </button>
          </div>
          {estimate ? (
            <pre className="vl-code" style={pre}>
              {JSON.stringify(estimate, null, 2)}
            </pre>
          ) : null}
        </AnalyticsSection>

        <AnalyticsSection title="Smart route" subtitle="Ask the router which Own Model fits intent + budget.">
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'end' }}>
            <label style={{ display: 'grid', gap: '0.3rem' }}>
              <span style={label}>Intent</span>
              <select className="vl-field" value={intent} onChange={(e) => setIntent(e.target.value)}>
                {['chat', 'reason', 'stt', 'stt_realtime', 'tts', 'mt', 'ocr', 'embed', 'dub', 'offline', 'multimodal'].map(
                  (i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ),
                )}
              </select>
            </label>
            <label style={{ display: 'grid', gap: '0.3rem' }}>
              <span style={label}>Budget</span>
              <select
                className="vl-field"
                value={budget}
                onChange={(e) => setBudget(e.target.value as typeof budget)}
              >
                <option value="frugal">frugal</option>
                <option value="balanced">balanced</option>
                <option value="quality">quality</option>
              </select>
            </label>
            <button type="button" className="vl-btn vl-btn-primary" disabled={busy} onClick={() => void runRoute()}>
              Route
            </button>
          </div>
          {route ? (
            <div style={{ marginTop: '0.75rem', fontSize: '0.9rem' }}>
              <p style={{ margin: 0 }}>
                → <Link href={route.primary.consolePath}>{route.primary.title}</Link> ({route.primary.costTier}) —{' '}
                {route.reason}
              </p>
              {route.alternates.length ? (
                <p style={{ margin: '0.35rem 0 0', color: 'var(--muted)' }}>
                  Alternates:{' '}
                  {route.alternates.map((a) => (
                    <Link key={a.id} href={`/${a.id}`} style={{ marginRight: 8 }}>
                      {a.title}
                    </Link>
                  ))}
                </p>
              ) : null}
            </div>
          ) : null}
        </AnalyticsSection>

        {(development?.siblings?.length || development?.skus?.length) ? (
          <AnalyticsSection title="Siblings & SKUs" subtitle="Cheaper / sharper alternatives and release SKUs.">
            <ul style={list}>
              {(development?.siblings ?? []).map((s) => (
                <li key={s.id}>
                  <Link href={`/${s.id}`}>{s.id}</Link> — {s.relation}
                </li>
              ))}
              {(development?.skus ?? []).map((sku) => (
                <li key={sku}>
                  SKU <code className="vl-code">{sku}</code> → <Link href="/model-release">Model Release</Link>
                </li>
              ))}
            </ul>
          </AnalyticsSection>
        ) : null}

        {openGaps.length ? (
          <AnalyticsSection title="What's missing" subtitle="Tracked gaps — still honest about unfinished work.">
            <ul style={list}>
              {openGaps.map((g) => (
                <li key={g.id}>
                  <strong>{g.gap}</strong> — {g.fix}
                </li>
              ))}
            </ul>
          </AnalyticsSection>
        ) : (
          <AnalyticsSection title="Gaps" subtitle="No open tracked gaps for this family.">
            <p style={{ margin: 0, color: 'var(--muted)' }}>Keep shipping quality cards via Model Release.</p>
          </AnalyticsSection>
        )}

        {engine ? (
          <details style={{ marginTop: '0.5rem' }}>
            <summary style={{ cursor: 'pointer', color: 'var(--muted)', fontSize: '0.85rem' }}>Engine JSON</summary>
            <pre className="vl-code" style={pre}>
              {JSON.stringify(engine, null, 2)}
            </pre>
          </details>
        ) : null}
      </div>
    </AppShell>
  );
}

const label: React.CSSProperties = { fontSize: '0.8rem', fontWeight: 650, color: 'var(--muted)' };
const subh: React.CSSProperties = { margin: '0 0 0.35rem', fontSize: '0.85rem', fontWeight: 650 };
const list: React.CSSProperties = { margin: 0, paddingLeft: '1.1rem', fontSize: '0.9rem', lineHeight: 1.5 };
const pre: React.CSSProperties = {
  marginTop: '0.75rem',
  padding: '0.85rem',
  background: 'var(--bg-soft)',
  borderRadius: 10,
  overflow: 'auto',
  maxHeight: '16rem',
  fontSize: '0.78rem',
};
