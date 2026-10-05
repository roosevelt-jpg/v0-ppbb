'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { resolveApiToken } from '@/lib/dev-auth';
import { AppShell } from '@/components/app-shell';
import { AnalyticsSection, StatsCard, formatCompact } from '@/components/analytics';

type FamilyRow = {
  id: string;
  title: string;
  modality: string;
  costTier: string;
  sharpness: string;
  consolePath: string;
  marketingLine: string;
  openGaps: number;
};

type Engine = {
  title: string;
  blurb: string;
  familyCount: number;
  families: FamilyRow[];
  honesty: { note: string };
};

type RouteResult = {
  primary: { id: string; title: string; costTier: string; consolePath: string };
  reason: string;
  alternates: Array<{ id: string; title: string }>;
};

export function OwnModelsHubClient() {
  const { getToken, isLoaded } = useAuth();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [gaps, setGaps] = useState(0);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [intent, setIntent] = useState('stt');
  const [budget, setBudget] = useState('frugal');
  const [error, setError] = useState<string | null>(null);
  const [usageHint, setUsageHint] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await resolveApiToken(getToken);
    const [eng, gapRes, overview] = await Promise.all([
      apiFetch<Engine>('/v1/own-models/engine'),
      apiFetch<{ count: number }>('/v1/own-models/gaps'),
      token
        ? apiFetch<{ usagePriority?: { suggestedFamily: string; reason: string } }>('/v1/own-models/overview', {
            token,
          }).catch(() => null)
        : Promise.resolve(null),
    ]);
    setEngine(eng);
    setGaps(gapRes.count);
    if (overview?.usagePriority) {
      setUsageHint(`${overview.usagePriority.suggestedFamily}: ${overview.usagePriority.reason}`);
    }
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  async function runRoute() {
    try {
      const res = await apiFetch<RouteResult>('/v1/own-models/route', {
        method: 'POST',
        body: JSON.stringify({ intent, budget }),
      });
      setRoute(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Route failed');
    }
  }

  return (
    <AppShell>
      <p style={{ color: 'var(--muted)', margin: '0 0 0.5rem' }}>
        <Link href="/foundation-model-cloud">Foundation Model Cloud</Link>
        {' · '}
        <Link href="/model-release">Model Release</Link>
        {' · '}
        <Link href="/usage">Usage</Link>
        {' · '}
        <Link href="/gpu-platform">GPU Platform</Link>
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
        Own Models
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.25rem', maxWidth: '46rem' }}>
        {engine?.blurb ??
          'Sharp specialists, cost-aware routing — use Echo for STT, Voice FM for TTS, Translate FM for MT, Baobab for African chat.'}
      </p>

      {error ? <p style={{ color: 'var(--bad)' }}>{error}</p> : null}

      <section className="vl-stat-grid" style={{ marginBottom: '1.25rem' }}>
        <StatsCard label="Families" value={formatCompact(engine?.familyCount ?? 0)} hint="Owned specialists" />
        <StatsCard label="Open gaps" value={formatCompact(gaps)} hint="Tracked across families" tone={gaps ? 'warn' : 'ok'} />
        <StatsCard label="Default posture" value="Own AI" hint="Vendor rental off by default" tone="ok" />
      </section>

      {engine?.honesty?.note ? (
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
          {engine.honesty.note}
        </p>
      ) : null}

      {usageHint ? (
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Usage-driven suggestion: {usageHint}
        </p>
      ) : null}

      <AnalyticsSection title="Smart route" subtitle="Intent + budget → cheapest sharp family.">
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'end' }}>
          <label style={{ display: 'grid', gap: '0.3rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 650 }}>Intent</span>
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
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 650 }}>Budget</span>
            <select className="vl-field" value={budget} onChange={(e) => setBudget(e.target.value)}>
              <option value="frugal">frugal</option>
              <option value="balanced">balanced</option>
              <option value="quality">quality</option>
            </select>
          </label>
          <button type="button" className="vl-btn vl-btn-primary" onClick={() => void runRoute()}>
            Route
          </button>
        </div>
        {route ? (
          <p style={{ margin: '0.75rem 0 0', fontSize: '0.9rem' }}>
            → <Link href={route.primary.consolePath}>{route.primary.title}</Link> ({route.primary.costTier}) —{' '}
            {route.reason}
          </p>
        ) : null}
      </AnalyticsSection>

      <AnalyticsSection title="Families" subtitle="Open a studio for cost, gaps, SKUs, and try links.">
        <div style={{ display: 'grid', gap: '0.65rem' }}>
          {(engine?.families ?? []).map((f) => (
            <Link
              key={f.id}
              href={f.consolePath}
              style={{
                display: 'block',
                borderTop: '1px solid var(--line)',
                padding: '0.65rem 0',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <strong>{f.title}</strong>{' '}
              <span style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>
                {f.modality} · {f.costTier} · {f.sharpness}
                {f.openGaps ? ` · ${f.openGaps} gaps` : ''}
              </span>
              <p style={{ margin: '0.2rem 0 0', color: 'var(--muted)', fontSize: '0.88rem' }}>{f.marketingLine}</p>
            </Link>
          ))}
        </div>
      </AnalyticsSection>
    </AppShell>
  );
}
