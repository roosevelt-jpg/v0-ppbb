'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { resolveApiToken } from '@/lib/dev-auth';
import { AppShell } from '@/components/app-shell';
import {
  AnalyticsSection,
  QuotaMeter,
  SegmentedBar,
  Sparkline,
  StatsCard,
  formatCompact,
  toneForPct,
  clampPct,
} from '@/components/analytics';

type Overview = {
  organization: { id: string; name: string; plan: string; billingStatus: string };
  workspace: { id: string; name: string; defaultSourceLang: string; defaultTargetLang: string } | null;
  workspaces: { id: string; name: string }[];
  billing: {
    planName: string;
    charactersUsed: number;
    characterQuota: number;
    charactersRemaining: number;
    requests: number;
  };
  residency: {
    dataRegion: string | null;
    matchesCurrentDeploy: boolean;
    currentDeploy: { code: string; name: string; residencyLabel: string };
  };
  featureFlags: Record<string, boolean>;
  account: { role: string };
};

type UsageSummary = {
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
};

const HUBS = [
  {
    href: '/translate',
    title: 'Translate',
    body: 'Metered text translation with language pairs, glossary, and TM.',
    free: true,
  },
  {
    href: '/voice-studio',
    title: 'Voice Studio',
    body: 'Generate African voices for projects — TTS, pronunciation, profiles.',
    free: true,
  },
  {
    href: '/speech',
    title: 'Speech',
    body: 'STT / TTS hub, streaming, interpreter, and speech analytics.',
    free: true,
  },
  {
    href: '/playground',
    title: 'Playground',
    body: 'Try APIs quickly without leaving the console.',
    free: true,
  },
  {
    href: '/keys',
    title: 'API keys',
    body: 'Mint keys when you are building and need to integrate VerbaLab.',
    free: true,
  },
  {
    href: '/voice-cloning',
    title: 'Voice cloning',
    body: 'Consent-gated cloning with watermark — Pro plan.',
    free: false,
  },
  {
    href: '/docs',
    title: 'Developer docs',
    body: 'Reference every endpoint when you hit errors or need examples.',
    free: true,
  },
  {
    href: '/developers',
    title: 'Developers hub',
    body: 'SDKs, OpenAPI explorer, and builder tooling.',
    free: true,
  },
] as const;

const STEPS = [
  {
    n: '01',
    title: 'Account & Free plan',
    body: 'Sign up creates your org + workspace on Free — limited monthly characters and rate limits, full access to core products.',
    href: '/billing',
    cta: 'View plan',
  },
  {
    n: '02',
    title: 'API keys for builders',
    body: 'Need to integrate? Create a key and call Translate, Speech, or Voice from your app.',
    href: '/keys',
    cta: 'Create API key',
  },
  {
    n: '03',
    title: 'Generate or clone voices',
    body: 'Generate available African voices in Voice Studio on Free. Ethical cloning unlocks on Pro.',
    href: '/voice-studio',
    cta: 'Open Voice Studio',
  },
  {
    n: '04',
    title: 'Docs & support bot',
    body: 'Stuck? Open Developer docs or use the support chat (bottom-right) for technical help.',
    href: '/docs',
    cta: 'Open docs',
  },
] as const;

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

export function DashboardClient() {
  const { getToken, isLoaded } = useAuth();
  const [data, setData] = useState<Overview | null>(null);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [welcome, setWelcome] = useState(
    'Your dedicated VerbaLab console — Free plan access, API keys, voices, and docs in one place.',
  );

  const load = useCallback(async () => {
    const token = await resolveApiToken(getToken);
    if (!token) throw new Error('Not signed in');
    const [overview, summary] = await Promise.all([
      apiFetch<Overview>('/v1/cloud/overview', { token }),
      apiFetch<UsageSummary>('/v1/usage/summary', { token }).catch(() => null),
    ]);
    setData(overview);
    setUsage(summary);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  useEffect(() => {
    void apiFetch<{ prefill: { welcome?: string } }>('/v1/cms/prefills/dashboard')
      .then((res) => {
        if (res.prefill.welcome) setWelcome(res.prefill.welcome);
      })
      .catch(() => undefined);
  }, []);

  const usagePct = useMemo(() => {
    if (!data?.billing.characterQuota) return 0;
    return clampPct(data.billing.charactersUsed, data.billing.characterQuota);
  }, [data]);

  const featureMix = useMemo(() => {
    if (!usage) return [];
    if (usage.creditsBreakdown) {
      return Object.entries(usage.creditsBreakdown)
        .filter(([, v]) => (v ?? 0) > 0)
        .map(([k, v]) => ({ label: FEATURE_LABELS[k] ?? k, value: v }));
    }
    return [
      { label: 'Translate', value: usage.translate?.requests ?? usage.requests ?? 0 },
      { label: 'STT', value: usage.stt?.requests ?? 0 },
      { label: 'TTS', value: usage.tts?.requests ?? 0 },
      { label: 'OCR', value: usage.ocr?.requests ?? 0 },
      { label: 'Chat', value: usage.chat?.requests ?? 0 },
      { label: 'Embeddings', value: usage.embeddings?.requests ?? 0 },
    ].filter((d) => d.value > 0);
  }, [usage]);

  const sparkValues = useMemo(() => {
    if (!usage) return [0, 0, 0, 0];
    const t = usage.translate?.requests ?? usage.requests ?? 0;
    const s = usage.stt?.requests ?? 0;
    const v = usage.tts?.requests ?? 0;
    const o = usage.ocr?.requests ?? 0;
    const c = usage.chat?.requests ?? 0;
    return [Math.max(1, t * 0.4), Math.max(1, t * 0.7 + s), Math.max(1, t + s + v * 0.5), t + s + v + o + c];
  }, [usage]);

  const isFree = (data?.organization.plan ?? 'free') === 'free';
  const canClone = Boolean(data?.featureFlags.voiceClones);

  return (
    <AppShell>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div>
          <p style={{ margin: 0, color: 'var(--brand)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em' }}>
            CONSOLE
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.6rem, 2.5vw, 2.1rem)',
              fontWeight: 740,
              letterSpacing: '-0.03em',
              margin: '0.25rem 0 0.35rem',
            }}
          >
            {data ? `Welcome, ${data.organization.name}` : 'Dashboard'}
          </h1>
          <p style={{ color: 'var(--muted)', margin: 0, maxWidth: '40rem' }}>{welcome}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.55rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <Link href="/keys" className="vl-btn vl-btn-primary">
            API keys
          </Link>
          <Link href="/voice-studio" className="vl-btn vl-btn-secondary">
            Generate voice
          </Link>
          <Link href="/docs" className="vl-btn vl-btn-secondary">
            Docs
          </Link>
        </div>
      </div>

      {error ? <p style={{ color: 'var(--bad)' }}>{error}</p> : null}
      {!data && !error ? <p style={{ color: 'var(--muted)' }}>Loading workspace…</p> : null}

      {data ? (
        <div style={{ display: 'grid', gap: '1.35rem' }}>
          <section className="vl-panel" style={{ padding: '1.15rem 1.25rem' }}>
            <h2 style={{ margin: '0 0 0.35rem', fontSize: '1rem', fontWeight: 700 }}>
              {isFree ? 'You are on Free' : `You are on ${data.billing.planName}`}
            </h2>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.92rem', maxWidth: '46rem', lineHeight: 1.5 }}>
              {isFree
                ? 'Free gives limited access to platform capabilities: Translate, Voice generation, Speech, Playground, and API keys — within your monthly character quota and rate limits. Upgrade to Pro for voice cloning, marketplace, and higher quotas.'
                : 'Pro unlocks cloning, marketplace, fine-tunes, and higher quotas. Keep using your dashboard hubs and API keys as usual.'}
            </p>
            {isFree ? (
              <div style={{ marginTop: '0.85rem' }}>
                <Link href="/billing" className="vl-btn vl-btn-secondary" style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}>
                  Upgrade to Pro
                </Link>
              </div>
            ) : null}
          </section>

          <section className="vl-stat-grid">
            <StatsCard
              label="Plan"
              value={data.billing.planName}
              hint={`${data.account.role} · billing ${data.organization.billingStatus}`}
              tone="brand"
            />
            <StatsCard
              label="Usage"
              value={`${formatCompact(data.billing.charactersUsed)} / ${formatCompact(data.billing.characterQuota)}`}
              hint={`${formatCompact(data.billing.charactersRemaining)} left · ${data.billing.requests} requests`}
              tone={toneForPct(usagePct)}
              trend={<Sparkline values={sparkValues} ariaLabel="Usage activity mix" />}
            />
            <StatsCard
              label="Workspace"
              value={data.workspace?.name ?? '—'}
              hint={`${data.workspace?.defaultSourceLang ?? '—'} → ${data.workspace?.defaultTargetLang ?? '—'} · ${data.workspaces.length} workspace${data.workspaces.length === 1 ? '' : 's'}`}
            />
          </section>

          <AnalyticsSection
            title="Limits & product mix"
            subtitle="Monthly quota burn and where requests land across the platform."
            action={
              <Link href="/usage" style={{ color: 'var(--brand)', fontWeight: 650, fontSize: '0.86rem' }}>
                Full usage →
              </Link>
            }
          >
            <div className="vl-chart-grid">
              <div className="vl-analytics-panel">
                <QuotaMeter
                  label="Character / credit quota"
                  used={data.billing.charactersUsed}
                  quota={data.billing.characterQuota}
                  remaining={data.billing.charactersRemaining}
                  unit="units"
                  detail={`${data.billing.requests} API requests this period`}
                />
              </div>
              <div className="vl-analytics-panel">
                <SegmentedBar
                  data={featureMix}
                  totalLabel={usage?.creditsBreakdown ? 'Credits by feature' : 'Requests by feature'}
                  emptyLabel="No product usage yet — try Translate or Voice Studio."
                />
              </div>
            </div>
          </AnalyticsSection>

          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.75rem' }}>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>How your account works</h2>
              <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Signup → Free → build</span>
            </div>
            <div className="vl-hub-grid">
              {STEPS.map((step) => (
                <article key={step.n} className="vl-hub-card" style={{ cursor: 'default' }}>
                  <p style={{ margin: 0, color: 'var(--brand)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em' }}>
                    {step.n}
                  </p>
                  <h3 style={{ marginTop: '0.35rem' }}>{step.title}</h3>
                  <p>{step.body}</p>
                  <Link href={step.href} style={{ color: 'var(--brand)', fontWeight: 650, fontSize: '0.86rem' }}>
                    {step.cta} →
                  </Link>
                </article>
              ))}
            </div>
          </section>

          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.75rem' }}>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Products & features</h2>
              <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                Clone {canClone ? 'unlocked' : 'requires Pro'}
              </span>
            </div>
            <div className="vl-hub-grid">
              {HUBS.map((hub) => (
                <Link key={hub.href} href={hub.href} className="vl-hub-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>{hub.title}</h3>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: hub.free || canClone ? 'var(--brand)' : 'var(--muted)',
                      }}
                    >
                      {hub.free ? 'Free' : canClone ? 'Pro' : 'Pro'}
                    </span>
                  </div>
                  <p>{hub.body}</p>
                </Link>
              ))}
            </div>
          </section>

          <section className="vl-panel" style={{ padding: '1.15rem 1.25rem', display: 'grid', gap: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Residency</h2>
                <p style={{ margin: '0.35rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
                  Deploy {data.residency.currentDeploy.name} ({data.residency.currentDeploy.code}) · pin{' '}
                  {data.residency.dataRegion ?? 'none'}
                </p>
              </div>
              <p
                style={{
                  margin: 0,
                  alignSelf: 'center',
                  fontSize: '0.82rem',
                  fontWeight: 650,
                  color: data.residency.matchesCurrentDeploy ? 'var(--ok)' : 'var(--bad)',
                }}
              >
                {data.residency.matchesCurrentDeploy ? 'Matches this island' : 'Region mismatch'}
              </p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem' }}>
              <Link href="/data" className="vl-btn vl-btn-secondary" style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}>
                Data & residency
              </Link>
              <Link href="/billing" className="vl-btn vl-btn-secondary" style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}>
                Billing
              </Link>
              <Link href="/usage" className="vl-btn vl-btn-secondary" style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}>
                Usage
              </Link>
              <Link href="/analytics" className="vl-btn vl-btn-secondary" style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}>
                Analytics
              </Link>
              <Link href="/chat" className="vl-btn vl-btn-secondary" style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}>
                African Voice LLM
              </Link>
            </div>
          </section>

          <section>
            <h2 style={{ margin: '0 0 0.55rem', fontSize: '0.85rem', color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Feature flags
            </h2>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {Object.entries(data.featureFlags).map(([key, on]) => (
                <li
                  key={key}
                  style={{
                    fontSize: '0.78rem',
                    padding: '0.28rem 0.55rem',
                    borderRadius: '0.4rem',
                    background: on ? 'var(--brand-soft)' : 'transparent',
                    border: '1px solid var(--line)',
                    color: on ? 'var(--brand)' : 'var(--muted)',
                    fontWeight: on ? 650 : 500,
                  }}
                >
                  {key}
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}
