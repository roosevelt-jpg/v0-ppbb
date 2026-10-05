'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { resolveApiToken } from '@/lib/dev-auth';
import { formatUtc } from '@/lib/format-date';
import { AppShell } from '@/components/app-shell';
import {
  AnalyticsSection,
  BarChart,
  QuotaMeter,
  SegmentedBar,
  Sparkline,
  StatsCard,
  formatCompact,
} from '@/components/analytics';

type Summary = {
  periodStart: string;
  requests: number;
  characters: number;
  creditsUsed?: number;
  creditsBreakdown?: Record<string, number>;
  translate?: { requests: number; characters: number; credits?: number };
  stt?: { requests: number; seconds: number; minutes: number; credits?: number };
  tts?: { requests: number; characters: number; credits?: number };
  ocr?: { requests: number; pages: number; credits?: number };
  chat?: { requests: number; tokens: number; credits?: number };
  embeddings?: { requests: number; tokens: number; credits?: number };
  music?: { requests: number; credits?: number };
  sfx?: { requests: number; credits?: number };
  voice_changer?: { requests: number; credits?: number };
  voice_isolator?: { requests: number; credits?: number };
  dubbing?: { requests: number; credits?: number };
};

type BillingSlice = {
  monthlyCredits?: number;
  creditsUsed?: number;
  creditsRemaining?: number;
  characterQuota?: number;
  charactersUsed?: number;
  charactersRemaining?: number;
  planName?: string;
};

const FEATURE_LABELS: Record<string, string> = {
  translate: 'Translate',
  tts: 'TTS',
  stt: 'STT',
  ocr: 'OCR',
  chat: 'Chat',
  embeddings: 'Embeddings',
  music: 'Music',
  sfx: 'SFX',
  voice_changer: 'Voice changer',
  voice_isolator: 'Isolator',
  dubbing: 'Dubbing',
};

export function UsageClient() {
  const { getToken, isLoaded } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [billing, setBilling] = useState<BillingSlice | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    void (async () => {
      try {
        const token = await resolveApiToken(getToken);
        if (!token) throw new Error('Not signed in');
        const [data, bill] = await Promise.all([
          apiFetch<Summary>('/v1/usage/summary', { token }),
          apiFetch<BillingSlice>('/v1/billing/summary', { token }).catch(() => null),
        ]);
        setSummary(data);
        setBilling(bill);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load usage');
      }
    })();
  }, [getToken, isLoaded]);

  const requestBars = useMemo(() => {
    if (!summary) return [];
    return [
      { label: 'Translate', value: summary.translate?.requests ?? summary.requests ?? 0 },
      { label: 'STT', value: summary.stt?.requests ?? 0 },
      { label: 'TTS', value: summary.tts?.requests ?? 0 },
      { label: 'OCR', value: summary.ocr?.requests ?? 0 },
      { label: 'Chat', value: summary.chat?.requests ?? 0 },
      { label: 'Embeddings', value: summary.embeddings?.requests ?? 0 },
      { label: 'Music', value: summary.music?.requests ?? 0 },
      { label: 'SFX', value: summary.sfx?.requests ?? 0 },
      { label: 'Dubbing', value: summary.dubbing?.requests ?? 0 },
    ];
  }, [summary]);

  const creditSegments = useMemo(() => {
    if (!summary) return [];
    if (summary.creditsBreakdown) {
      return Object.entries(summary.creditsBreakdown)
        .filter(([, v]) => (v ?? 0) > 0)
        .map(([k, v]) => ({ label: FEATURE_LABELS[k] ?? k, value: v }));
    }
    return [
      { label: 'Translate', value: summary.translate?.credits ?? summary.translate?.characters ?? 0 },
      { label: 'STT', value: summary.stt?.credits ?? summary.stt?.seconds ?? 0 },
      { label: 'TTS', value: summary.tts?.credits ?? summary.tts?.characters ?? 0 },
      { label: 'OCR', value: summary.ocr?.credits ?? summary.ocr?.pages ?? 0 },
      { label: 'Chat', value: summary.chat?.credits ?? summary.chat?.tokens ?? 0 },
      { label: 'Embeddings', value: summary.embeddings?.credits ?? summary.embeddings?.tokens ?? 0 },
    ].filter((d) => d.value > 0);
  }, [summary]);

  const spark = useMemo(() => {
    if (!summary) return [0, 0, 0, 0];
    const vals = requestBars.map((b) => b.value);
    const max = Math.max(...vals, 1);
    return vals.length ? vals.map((v) => v / max) : [0.2, 0.4, 0.6, 0.8];
  }, [summary, requestBars]);

  const quotaUsed = billing?.creditsUsed ?? billing?.charactersUsed ?? summary?.creditsUsed ?? summary?.characters ?? 0;
  const quotaTotal =
    billing?.monthlyCredits ?? billing?.characterQuota ?? Math.max(quotaUsed, summary?.characters ?? 0, 1);
  const quotaLeft = billing?.creditsRemaining ?? billing?.charactersRemaining ?? Math.max(0, quotaTotal - quotaUsed);

  return (
    <AppShell>
      <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', fontSize: '2rem' }}>
        Usage
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0.5rem 0 0' }}>
        Month-to-date translation, speech, OCR, chat, and creative-platform usage — with limits and feature mix.
      </p>
      {error ? <p style={{ color: 'var(--bad)' }}>{error}</p> : null}
      {summary ? (
        <div style={{ marginTop: '1.5rem', display: 'grid', gap: '1.35rem' }}>
          <section className="vl-stat-grid-4">
            <StatsCard
              label="Total requests"
              value={formatCompact(summary.requests)}
              hint={`Since ${formatUtc(summary.periodStart)}`}
              tone="brand"
              trend={<Sparkline values={spark} ariaLabel="Request mix sparkline" />}
            />
            <StatsCard
              label="Characters"
              value={formatCompact(summary.characters)}
              hint="Translate + TTS characters"
            />
            <StatsCard
              label="Credits used"
              value={formatCompact(summary.creditsUsed ?? quotaUsed)}
              hint={billing?.planName ? `${billing.planName} pool` : 'Shared credit pool'}
            />
            <StatsCard
              label="STT minutes"
              value={formatCompact(summary.stt?.minutes ?? 0)}
              hint={`${formatCompact(summary.stt?.seconds ?? 0)} seconds`}
            />
          </section>

          <AnalyticsSection
            title="Plan limits"
            subtitle="How much of your monthly credit / character quota is consumed."
            action={
              <Link href="/billing" style={{ color: 'var(--brand)', fontWeight: 650, fontSize: '0.86rem' }}>
                Manage billing →
              </Link>
            }
          >
            <div className="vl-analytics-panel">
              <QuotaMeter
                label="Monthly quota"
                used={quotaUsed}
                quota={quotaTotal}
                remaining={quotaLeft}
                unit="credits"
                detail={`${formatCompact(summary.requests)} requests across products`}
              />
            </div>
          </AnalyticsSection>

          <div className="vl-chart-grid">
            <AnalyticsSection title="Requests by product" subtitle="Where API traffic is landing this period.">
              <div className="vl-analytics-panel">
                <BarChart data={requestBars} emptyLabel="No requests yet this month." />
              </div>
            </AnalyticsSection>
            <AnalyticsSection title="Credits / units mix" subtitle="Share of metered usage by feature.">
              <div className="vl-analytics-panel">
                <SegmentedBar data={creditSegments} totalLabel="Feature units" emptyLabel="No credit burn yet." />
              </div>
            </AnalyticsSection>
          </div>

          <AnalyticsSection title="Product detail" subtitle="Per-product request and unit counters.">
            <section className="vl-stat-grid-2">
              <StatsCard
                label="Translate"
                value={`${formatCompact(summary.translate?.requests ?? summary.requests)} req`}
                hint={`${formatCompact(summary.translate?.characters ?? summary.characters)} characters`}
              />
              <StatsCard
                label="STT"
                value={`${formatCompact(summary.stt?.requests ?? 0)} req`}
                hint={`${formatCompact(summary.stt?.minutes ?? 0)} min`}
              />
              <StatsCard
                label="TTS"
                value={`${formatCompact(summary.tts?.requests ?? 0)} req`}
                hint={`${formatCompact(summary.tts?.characters ?? 0)} characters`}
              />
              <StatsCard
                label="OCR"
                value={`${formatCompact(summary.ocr?.requests ?? 0)} req`}
                hint={`${formatCompact(summary.ocr?.pages ?? 0)} pages`}
              />
              <StatsCard
                label="Chat"
                value={`${formatCompact(summary.chat?.requests ?? 0)} req`}
                hint={`${formatCompact(summary.chat?.tokens ?? 0)} tokens`}
              />
              <StatsCard
                label="Embeddings"
                value={`${formatCompact(summary.embeddings?.requests ?? 0)} req`}
                hint={`${formatCompact(summary.embeddings?.tokens ?? 0)} tokens`}
              />
            </section>
          </AnalyticsSection>
        </div>
      ) : !error ? (
        <p style={{ color: 'var(--muted)' }}>Loading…</p>
      ) : null}
    </AppShell>
  );
}
