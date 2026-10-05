'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { resolveApiToken } from '@/lib/dev-auth';
import { formatUtc } from '@/lib/format-date';
import { AppShell } from '@/components/app-shell';
import {
  AnalyticsSection,
  BarChart,
  SegmentedBar,
  Sparkline,
  StatsCard,
  formatCompact,
  toneForPct,
} from '@/components/analytics';

type Catalog = {
  product: string;
  note: string;
  capabilities: Array<{ id: string; name: string; status: string; api: string | null }>;
};

type Overview = {
  periodStart: string;
  periodEnd: string;
  byFeature: Array<{
    feature: string;
    requests: number;
    units: number;
    unitType: string;
    estimatedCostUsd: number;
  }>;
  byLanguagePair: Array<{
    source: string;
    target: string;
    requests: number;
    characters: number;
  }>;
  cost: { estimatedUsd: number; currency: string; note: string };
  errors: {
    jobSucceeded: number;
    jobFailed: number;
    jobTotal: number;
    errorRate: number;
  };
};

type Quality = {
  averageQualityScore: number | null;
  translationAccuracyProxy: number | null;
  reviews: number;
  accepted: number;
  rejected: number;
  note: string;
};

type Latency = {
  samples: number;
  p50Ms: number | null;
  p95Ms: number | null;
  p99Ms: number | null;
  avgMs: number | null;
};

type Dialects = {
  dialectDetects: number;
  accentDetects: number;
  byDialect: Array<{ code: string; count: number }>;
};

export function AnalyticsClient() {
  const { getToken, isLoaded } = useAuth();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [data, setData] = useState<Overview | null>(null);
  const [quality, setQuality] = useState<Quality | null>(null);
  const [latency, setLatency] = useState<Latency | null>(null);
  const [dialects, setDialects] = useState<Dialects | null>(null);
  const [reportNote, setReportNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (token: string) => {
    const [cat, overview, q, lat, dia] = await Promise.all([
      apiFetch<Catalog>('/v1/analytics'),
      apiFetch<Overview>('/v1/analytics/overview', { token }),
      apiFetch<Quality>('/v1/analytics/quality', { token }),
      apiFetch<Latency>('/v1/analytics/latency', { token }),
      apiFetch<Dialects>('/v1/analytics/dialects', { token }),
    ]);
    setCatalog(cat);
    setData(overview);
    setQuality(q);
    setLatency(lat);
    setDialects(dia);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    void (async () => {
      try {
        const token = await resolveApiToken(getToken);
        if (!token) throw new Error('Not signed in');
        await load(token);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      }
    })();
  }, [getToken, isLoaded, load]);

  async function loadEnterpriseReport() {
    setError(null);
    try {
      const token = await resolveApiToken(getToken);
      if (!token) throw new Error('Not signed in');
      const report = await apiFetch<{ note: string; generatedAt: string }>(
        '/v1/analytics/reports/enterprise',
        { token },
      );
      setReportNote(`Report generated ${formatUtc(report.generatedAt)}. ${report.note}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Report failed');
    }
  }

  const featureBars = useMemo(
    () =>
      (data?.byFeature ?? []).map((row) => ({
        label: row.feature,
        value: row.requests,
        hint: `${row.units} ${row.unitType} · $${row.estimatedCostUsd.toFixed(4)}`,
      })),
    [data],
  );

  const pairBars = useMemo(
    () =>
      (data?.byLanguagePair ?? []).map((row) => ({
        label: `${row.source}→${row.target}`,
        value: row.characters,
        hint: `${row.requests} requests`,
      })),
    [data],
  );

  const costSegments = useMemo(
    () =>
      (data?.byFeature ?? []).map((row) => ({
        label: row.feature,
        value: Math.max(row.estimatedCostUsd * 10000, row.requests),
      })),
    [data],
  );

  const dialectBars = useMemo(
    () =>
      (dialects?.byDialect ?? []).slice(0, 8).map((d) => ({
        label: d.code,
        value: d.count,
      })),
    [dialects],
  );

  const latencySpark = useMemo(() => {
    if (!latency) return [0, 0, 0, 0];
    return [
      latency.p50Ms ?? 0,
      latency.avgMs ?? latency.p50Ms ?? 0,
      latency.p95Ms ?? 0,
      latency.p99Ms ?? latency.p95Ms ?? 0,
    ];
  }, [latency]);

  const errorTone = data ? toneForPct(data.errors.errorRate * 100) : 'default';

  return (
    <AppShell>
      <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', fontSize: '2rem' }}>
        Language Analytics
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0.5rem 0 0' }}>
        {catalog?.note ??
          'Volume, quality, latency, and estimated cost from your database — not an analytics cloud.'}
      </p>
      {error ? <p style={{ color: 'var(--bad)' }}>{error}</p> : null}

      {catalog ? (
        <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0 0', display: 'grid', gap: '0.25rem' }}>
          {catalog.capabilities.map((c) => (
            <li key={c.id} style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
              {c.name} · {c.status}
              {c.api ? ` · ${c.api}` : ''}
            </li>
          ))}
        </ul>
      ) : null}

      <div style={{ marginTop: '1rem' }}>
        <button type="button" className="vl-btn" onClick={() => void loadEnterpriseReport()}>
          Generate enterprise report
        </button>
        {reportNote ? (
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginTop: '0.5rem' }}>{reportNote}</p>
        ) : null}
      </div>

      {data ? (
        <div style={{ marginTop: '1.5rem', display: 'grid', gap: '1.5rem' }}>
          <section className="vl-stat-grid-4">
            <StatsCard
              label="Estimated cost (USD)"
              value={`$${data.cost.estimatedUsd.toFixed(4)}`}
              hint={data.cost.currency}
              tone="brand"
            />
            <StatsCard
              label="Job error rate"
              value={`${(data.errors.errorRate * 100).toFixed(2)}%`}
              hint={`${data.errors.jobFailed} failed / ${data.errors.jobTotal} jobs`}
              tone={errorTone === 'default' ? 'ok' : errorTone}
            />
            <StatsCard
              label="Avg quality score"
              value={quality?.averageQualityScore != null ? String(quality.averageQualityScore) : '—'}
              hint={
                quality
                  ? `${quality.reviews} reviews · accuracy proxy ${
                      quality.translationAccuracyProxy != null
                        ? `${(quality.translationAccuracyProxy * 100).toFixed(1)}%`
                        : '—'
                    }`
                  : undefined
              }
            />
            <StatsCard
              label="Translate p95 latency"
              value={latency?.p95Ms != null ? `${latency.p95Ms} ms` : '—'}
              hint={latency ? `${latency.samples} samples · p50 ${latency.p50Ms ?? '—'} ms` : undefined}
              trend={<Sparkline values={latencySpark} ariaLabel="Latency percentiles" />}
            />
          </section>

          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>{data.cost.note}</p>
          {quality ? (
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>{quality.note}</p>
          ) : null}

          <div className="vl-chart-grid">
            <AnalyticsSection title="By feature" subtitle="Request volume across language products.">
              <div className="vl-analytics-panel">
                <BarChart data={featureBars} emptyLabel="No usage events in this period." />
              </div>
            </AnalyticsSection>
            <AnalyticsSection title="Cost / activity mix" subtitle="Relative share by feature.">
              <div className="vl-analytics-panel">
                <SegmentedBar data={costSegments} totalLabel="Activity weight" emptyLabel="No cost data yet." />
              </div>
            </AnalyticsSection>
          </div>

          <AnalyticsSection title="Language pairs (translate)" subtitle="Character volume by source → target.">
            <div className="vl-analytics-panel">
              <BarChart data={pairBars} emptyLabel="No translation requests in this period." valueSuffix="" />
            </div>
          </AnalyticsSection>

          {dialects && dialects.dialectDetects + dialects.accentDetects > 0 ? (
            <AnalyticsSection
              title="Dialect / accent detects"
              subtitle={`Dialects ${dialects.dialectDetects} · Accents ${dialects.accentDetects}`}
            >
              <div className="vl-analytics-panel">
                <BarChart data={dialectBars} emptyLabel="No dialect samples." maxBars={8} />
              </div>
            </AnalyticsSection>
          ) : null}

          {data.byFeature.length > 0 ? (
            <AnalyticsSection title="Feature table" subtitle="Exact units and estimated USD.">
              <div className="vl-analytics-panel" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
                      <th style={{ padding: '0.4rem 0' }}>Feature</th>
                      <th>Requests</th>
                      <th>Units</th>
                      <th>Est. USD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byFeature.map((row) => (
                      <tr key={`${row.feature}-${row.unitType}`}>
                        <td style={{ padding: '0.45rem 0' }}>{row.feature}</td>
                        <td>{formatCompact(row.requests)}</td>
                        <td>
                          {formatCompact(row.units)} {row.unitType}
                        </td>
                        <td>${row.estimatedCostUsd.toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AnalyticsSection>
          ) : null}

          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>
            Period: {formatUtc(data.periodStart)} → {formatUtc(data.periodEnd)}
          </p>
        </div>
      ) : !error ? (
        <p style={{ color: 'var(--muted)' }}>Loading…</p>
      ) : null}
    </AppShell>
  );
}
