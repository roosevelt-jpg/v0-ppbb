'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { API_URL, apiFetch } from '@/lib/api';
import { canOpenProductConsole } from '@/lib/product-status';
import { StatusSuffix } from '@/components/status-suffix';
import { resolveApiToken } from '@/lib/dev-auth';
import { AppShell } from '@/components/app-shell';
import { AnalyticsSection, BarChart, SegmentedBar, StatsCard, formatCompact } from '@/components/analytics';

type Product = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

type Overview = {
  usage: {
    periodStart: string;
    stt: { requests: number; seconds: number; minutes: number };
    tts: { requests: number; characters: number };
  };
  workspace: { voiceClones: number };
  products: Product[];
  architecture: {
    graphql: boolean;
    cqrs: boolean;
    terraform: boolean;
    kubernetes: boolean;
    streaming: boolean;
    batch: boolean;
    billing: boolean;
    monitoring: boolean;
  };
  deferred: Record<string, boolean>;
  links: Record<string, string>;
};

export function SpeechClient() {
  const { getToken, isLoaded } = useAuth();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ttsText, setTtsText] = useState('Karibu VerbaLab Speech Cloud.');
  const [ttsBusy, setTtsBusy] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await resolveApiToken(getToken);
    if (!token) throw new Error('Not signed in');
    setData(await apiFetch<Overview>('/v1/speech/overview', { token }));
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  useEffect(() => {
    void apiFetch<{ prefill: { text?: string } }>('/v1/cms/prefills/speech')
      .then((res) => {
        if (res.prefill.text) setTtsText(res.prefill.text);
      })
      .catch(() => undefined);
  }, []);

  async function previewTts() {
    setTtsBusy(true);
    setTtsError(null);
    try {
      const token = await resolveApiToken(getToken);
      if (!token) throw new Error('Not signed in');
      const res = await fetch(`${API_URL}/v1/audio/speech`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: ttsText, voice: 'alloy', format: 'mp3' }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? `TTS failed (${res.status})`);
      }
      const blob = await res.blob();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(URL.createObjectURL(blob));
    } catch (err) {
      setTtsError(err instanceof Error ? err.message : 'TTS failed');
    } finally {
      setTtsBusy(false);
    }
  }

  return (
    <AppShell>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.35rem' }}>
        <div>
          <p style={{ margin: 0, color: 'var(--brand)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em' }}>
            PRODUCT
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.55rem, 2.4vw, 2rem)',
              fontWeight: 740,
              letterSpacing: '-0.03em',
              margin: '0.25rem 0 0.35rem',
            }}
          >
            Speech
          </h1>
          <p style={{ color: 'var(--muted)', margin: 0, maxWidth: '40rem' }}>
            STT, TTS, interpreter, and speech intelligence — with live usage and a quick voice preview.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.55rem' }}>
          <Link href="/voice-studio" className="vl-btn vl-btn-primary">
            Voice Studio
          </Link>
          <Link href="/speech-recognition" className="vl-btn vl-btn-secondary">
            STT Engine
          </Link>
        </div>
      </div>

      {error ? <p style={{ color: 'var(--bad)' }}>{error}</p> : null}
      {!data && !error ? <p style={{ color: 'var(--muted)' }}>Loading speech hub…</p> : null}

      {data ? (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          <section className="vl-stat-grid">
            <StatsCard
              label="STT this period"
              value={`${formatCompact(data.usage.stt.requests)} req`}
              hint={`${formatCompact(data.usage.stt.minutes)} min · ${formatCompact(data.usage.stt.seconds)}s`}
              tone="brand"
            />
            <StatsCard
              label="TTS this period"
              value={`${formatCompact(data.usage.tts.requests)} req`}
              hint={`${formatCompact(data.usage.tts.characters)} characters`}
            />
            <StatsCard
              label="Workspace clones"
              value={formatCompact(data.workspace.voiceClones)}
              hint={`Since ${data.usage.periodStart.slice(0, 10)}`}
            />
          </section>

          <AnalyticsSection title="Speech usage mix" subtitle="STT vs TTS activity for this billing period.">
            <div className="vl-chart-grid">
              <div className="vl-analytics-panel">
                <BarChart
                  data={[
                    { label: 'STT requests', value: data.usage.stt.requests },
                    { label: 'TTS requests', value: data.usage.tts.requests },
                    { label: 'STT minutes', value: data.usage.stt.minutes },
                    { label: 'TTS chars (k)', value: Math.round(data.usage.tts.characters / 1000) },
                  ]}
                  emptyLabel="No speech usage yet — try the TTS preview below."
                />
              </div>
              <div className="vl-analytics-panel">
                <SegmentedBar
                  data={[
                    { label: 'STT', value: data.usage.stt.requests || data.usage.stt.seconds },
                    { label: 'TTS', value: data.usage.tts.requests || data.usage.tts.characters },
                  ]}
                  totalLabel="Speech activity"
                  emptyLabel="No speech activity yet."
                />
              </div>
            </div>
          </AnalyticsSection>

          <section className="vl-panel" style={{ padding: '1.25rem', display: 'grid', gap: '0.85rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontFamily: 'var(--font-display)' }}>Quick TTS preview</h2>
              <p style={{ margin: '0.3rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
                Generate a short clip with the audio speech API (voice: alloy).
              </p>
            </div>
            <textarea
              className="vl-field"
              rows={3}
              value={ttsText}
              onChange={(e) => setTtsText(e.target.value)}
              style={{ resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="button"
                className="vl-btn vl-btn-primary"
                disabled={ttsBusy || !ttsText.trim()}
                onClick={() => void previewTts()}
              >
                {ttsBusy ? 'Generating…' : 'Generate speech'}
              </button>
              {audioUrl ? <audio controls src={audioUrl} style={{ maxWidth: '100%' }} /> : null}
            </div>
            {ttsError ? <p style={{ margin: 0, color: 'var(--bad)' }}>{ttsError}</p> : null}
          </section>

          <section>
            <h2 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 700 }}>Products in this hub</h2>
            <div className="vl-hub-grid">
              {data.products.map((p) => (
                <div key={p.id} className="vl-hub-card" style={{ cursor: 'default' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
                    <h3>{p.name}</h3>
                    <StatusSuffix status={p.status} />
                  </div>
                  <p>{p.notes}</p>
                  {canOpenProductConsole(p.status, p.console) ? (
                    <Link href={p.console} style={{ color: 'var(--brand)', fontWeight: 650, fontSize: '0.88rem' }}>
                      Open console →
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          <section className="vl-panel" style={{ padding: '1.15rem 1.25rem' }}>
            <h2 style={{ margin: '0 0 0.55rem', fontSize: '0.95rem', fontWeight: 700 }}>Architecture honesty</h2>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.55 }}>
              Batch {data.architecture.batch ? 'yes' : 'no'} · Streaming{' '}
              {data.architecture.streaming ? 'yes (segment SSE)' : 'deferred'} · GraphQL{' '}
              {data.architecture.graphql ? 'yes' : 'no'} · Billing{' '}
              {data.architecture.billing ? 'yes (STT/TTS metering)' : 'no'} · Monitoring{' '}
              {data.architecture.monitoring ? 'yes' : 'no'}
            </p>
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}
