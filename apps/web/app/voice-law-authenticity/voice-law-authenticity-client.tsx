'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { API_URL, apiFetch } from '@/lib/api';
import { resolveApiToken } from '@/lib/dev-auth';
import { AppShell } from '@/components/app-shell';
import { AnalyticsSection, QuotaMeter, StatsCard, formatCompact } from '@/components/analytics';

type Engine = {
  title: string;
  blurb: string;
  honesty: {
    courtSoleEvidence: boolean;
    nistPadCertified: boolean;
    note: string;
  };
  modelCard: { id: string; version?: string; task: string };
  capabilities: Array<{ id: string; name: string; api: string }>;
};

type Report = {
  id: string;
  createdAt: string;
  caseRef?: string;
  authenticity: {
    riskScore: number;
    label: string;
    confidence: string;
  };
  antiSpoof: { decision: string; riskScore: number; flags: string[]; note: string };
  file: { name: string; sha256: string; bytes: number };
  legal: { disclaimer: string; recommendedNextSteps: string[] };
  speakerMatch?: { matched: boolean; score: number | null; note: string } | null;
  seal?: Record<string, unknown> | null;
};

export function VoiceLawAuthenticityClient() {
  const { getToken, isLoaded } = useAuth();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [caseRef, setCaseRef] = useState('');
  const [claimedSpeaker, setClaimedSpeaker] = useState('');
  const [profileId, setProfileId] = useState('');
  const [sealToken, setSealToken] = useState('');
  const [appendEvidence, setAppendEvidence] = useState(true);
  const [report, setReport] = useState<Report | null>(null);
  const [recent, setRecent] = useState<Array<{ id: string; label: string; riskScore: number; caseRef?: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const token = await resolveApiToken(getToken);
    if (!token) throw new Error('Not signed in — use /dev-login');
    const [eng, list] = await Promise.all([
      apiFetch<Engine>('/v1/voice-law-authenticity/engine'),
      apiFetch<{ reports: Array<{ id: string; label: string; riskScore: number; caseRef?: string }> }>(
        '/v1/voice-law-authenticity/reports',
        { token },
      ).catch(() => ({ reports: [] })),
    ]);
    setEngine(eng);
    setRecent(list.reports.slice(0, 8));
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  async function analyze() {
    if (!file) {
      setError('Choose an audio recording');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const token = await resolveApiToken(getToken);
      if (!token) throw new Error('Not signed in');
      const form = new FormData();
      form.append('file', file);
      if (caseRef.trim()) form.append('caseRef', caseRef.trim());
      if (claimedSpeaker.trim()) form.append('claimedSpeaker', claimedSpeaker.trim());
      if (profileId.trim()) form.append('profileId', profileId.trim());
      if (sealToken.trim()) form.append('sealToken', sealToken.trim());
      form.append('appendEvidence', appendEvidence ? 'true' : 'false');
      const res = await fetch(`${API_URL}/v1/voice-law-authenticity/analyze`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
      setReport(body as Report);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analyze failed');
    } finally {
      setBusy(false);
    }
  }

  const riskPct = Math.round((report?.authenticity.riskScore ?? 0) * 100);
  const tone =
    report?.authenticity.label === 'likely_synthetic_or_spoof'
      ? 'bad'
      : report?.authenticity.label === 'needs_review'
        ? 'warn'
        : 'ok';

  return (
    <AppShell>
      <p style={{ color: 'var(--muted)', margin: '0 0 0.5rem' }}>
        <Link href="/civic-voice-evidence">Evidence Chain</Link>
        {' · '}
        <Link href="/voice-biometrics">Biometrics</Link>
        {' · '}
        <Link href="/civic-voice-seal">Civic Seal</Link>
        {' · '}
        <Link href="/justice-language-access">Justice Language</Link>
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
        Voice Law Authenticity
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.25rem', maxWidth: '46rem' }}>
        {engine?.blurb ??
          'Screen recordings for synthetic / impersonation risk before they reach a courtroom — assistive only, not a verdict.'}
      </p>

      {engine ? (
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
          Model <code className="vl-code">{engine.modelCard.id}</code> · court sole evidence:{' '}
          {String(engine.honesty.courtSoleEvidence)} · NIST PAD: {String(engine.honesty.nistPadCertified)}.
          {engine.honesty.note}
        </p>
      ) : null}

      {error ? <p style={{ color: 'var(--bad)' }}>{error}</p> : null}

      <section className="vl-panel" style={{ padding: '1.2rem', display: 'grid', gap: '0.85rem', maxWidth: '40rem' }}>
        <label style={{ display: 'grid', gap: '0.3rem' }}>
          <span style={label}>Recording</span>
          <input type="file" accept="audio/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        <label style={{ display: 'grid', gap: '0.3rem' }}>
          <span style={label}>Case / matter ref</span>
          <input className="vl-field" value={caseRef} onChange={(e) => setCaseRef(e.target.value)} placeholder="CR-2026-0142" />
        </label>
        <label style={{ display: 'grid', gap: '0.3rem' }}>
          <span style={label}>Claimed speaker</span>
          <input
            className="vl-field"
            value={claimedSpeaker}
            onChange={(e) => setClaimedSpeaker(e.target.value)}
            placeholder="Name attributed in the recording"
          />
        </label>
        <label style={{ display: 'grid', gap: '0.3rem' }}>
          <span style={label}>Enrolled profile ID (optional match)</span>
          <input className="vl-field" value={profileId} onChange={(e) => setProfileId(e.target.value)} placeholder="spk_…" />
        </label>
        <label style={{ display: 'grid', gap: '0.3rem' }}>
          <span style={label}>Civic seal token (optional)</span>
          <input className="vl-field" value={sealToken} onChange={(e) => setSealToken(e.target.value)} placeholder="seal_…" />
        </label>
        <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input type="checkbox" checked={appendEvidence} onChange={(e) => setAppendEvidence(e.target.checked)} />
          <span style={{ fontSize: '0.9rem' }}>Append hash tip to Civic Voice Evidence chain</span>
        </label>
        <button type="button" className="vl-btn vl-btn-primary" disabled={busy || !file} onClick={() => void analyze()}>
          {busy ? 'Analyzing…' : 'Run authenticity screen'}
        </button>
      </section>

      {report ? (
        <div style={{ marginTop: '1.5rem', display: 'grid', gap: '1rem', maxWidth: '52rem' }}>
          <section className="vl-stat-grid">
            <StatsCard
              label="Authenticity label"
              value={report.authenticity.label.replace(/_/g, ' ')}
              hint={`confidence ${report.authenticity.confidence}`}
              tone={tone === 'bad' ? 'bad' : tone === 'warn' ? 'warn' : 'ok'}
            />
            <StatsCard
              label="Risk score"
              value={`${riskPct}%`}
              hint={`anti-spoof ${report.antiSpoof.decision}`}
              tone={tone === 'bad' ? 'bad' : tone === 'warn' ? 'warn' : 'brand'}
            />
            <StatsCard
              label="File"
              value={formatCompact(report.file.bytes)}
              hint={`${report.file.name} · sha256 ${report.file.sha256.slice(0, 12)}…`}
            />
          </section>

          <AnalyticsSection title="Synthetic / spoof risk" subtitle="Assistive meter — not a courtroom finding.">
            <div className="vl-analytics-panel">
              <QuotaMeter
                label="Impersonation / synthetic risk"
                used={riskPct}
                quota={100}
                remaining={100 - riskPct}
                unit="risk points"
                detail={report.antiSpoof.flags.join(', ') || 'no heuristic flags'}
              />
            </div>
          </AnalyticsSection>

          <section className="vl-analytics-panel">
            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1rem' }}>Report {report.id}</h2>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.88rem' }}>{report.legal.disclaimer}</p>
            {report.speakerMatch ? (
              <p style={{ margin: '0.75rem 0 0', fontSize: '0.9rem' }}>
                Speaker match: {report.speakerMatch.matched ? 'matched' : 'not matched'}
                {report.speakerMatch.score != null ? ` · score ${report.speakerMatch.score.toFixed(3)}` : ''} —{' '}
                {report.speakerMatch.note}
              </p>
            ) : null}
            <ul style={{ margin: '0.75rem 0 0', paddingLeft: '1.1rem', color: 'var(--ink)', fontSize: '0.9rem' }}>
              {report.legal.recommendedNextSteps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <pre
              className="vl-code"
              style={{
                marginTop: '1rem',
                padding: '0.85rem',
                background: 'var(--bg-soft)',
                borderRadius: 10,
                overflow: 'auto',
                maxHeight: '18rem',
                fontSize: '0.78rem',
              }}
            >
              {JSON.stringify(report, null, 2)}
            </pre>
          </section>
        </div>
      ) : null}

      {recent.length ? (
        <AnalyticsSection title="Recent screens" subtitle="This organization (process-local until externalized).">
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {recent.map((r) => (
              <li key={r.id} style={{ borderTop: '1px solid var(--line)', padding: '0.45rem 0', fontSize: '0.9rem' }}>
                {r.id} · {r.label.replace(/_/g, ' ')} · {(r.riskScore * 100).toFixed(0)}%
                {r.caseRef ? ` · ${r.caseRef}` : ''}
              </li>
            ))}
          </ul>
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
