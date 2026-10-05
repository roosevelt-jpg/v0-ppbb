'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { StatusSuffix } from '@/components/status-suffix';
import { resolveApiToken } from '@/lib/dev-auth';
import { AppShell } from '@/components/app-shell';

type Engine = {
  product: string;
  note: string;
  capabilities: Array<{ id: string; name: string; status: string; notes: string; api?: string | null }>;
  modalities: Array<{ id: string; name: string; status: string; notes: string }>;
  honesty: Record<string, unknown>;
  links?: Record<string, string>;
};
type Models = {
  models: Array<{ id: string; provider: string; dimensions: number; default: boolean; status: string }>;
};
type Analytics = {
  requests: number;
  tokens: number;
  byModality: Array<{ modality: string; count: number }>;
  note: string;
};

const MODALITY_HINTS: Record<string, string> = {
  text: 'Any text to embed',
  document: 'Document / article excerpt',
  code: 'Source code snippet',
  speech: 'STT transcript or speech caption',
  image: 'OCR text or image caption',
  video: 'Video transcript or scene captions',
  cross_modal: 'Joint caption: image description + text',
  hybrid: 'Text tagged for hybrid dense retrieval',
};

export function EmbeddingCloudClient() {
  const { getToken, isLoaded } = useAuth();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [models, setModels] = useState<Models | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [input, setInput] = useState('Habari dunia');
  const [modality, setModality] = useState('text');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const token = await resolveApiToken(getToken);
    if (!token) throw new Error('Not signed in');
    const [eng, mods, an] = await Promise.all([
      apiFetch<Engine>('/v1/embedding-cloud/engine', { token }),
      apiFetch<Models>('/v1/embedding-cloud/models', { token }),
      apiFetch<Analytics>('/v1/embedding-cloud/analytics', { token }),
    ]);
    setEngine(eng);
    setModels(mods);
    setAnalytics(an);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void refresh().catch((err: Error) => setError(err.message));
  }, [isLoaded, refresh]);

  async function embed() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const token = await resolveApiToken(getToken);
      if (!token) throw new Error('Not signed in');
      const body = await apiFetch<{
        modality: string;
        data: Array<{ embedding: number[] }>;
        model: string;
        usage: { total_tokens: number };
      }>('/v1/embedding-cloud/embed', {
        token,
        method: 'POST',
        body: { input, modality },
      });
      setResult(
        JSON.stringify(
          {
            modality: body.modality,
            model: body.model,
            dimensions: body.data[0]?.embedding.length ?? 0,
            tokens: body.usage.total_tokens,
            preview: body.data[0]?.embedding.slice(0, 8),
          },
          null,
          2,
        ),
      );
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Embed failed');
    } finally {
      setLoading(false);
    }
  }

  const shippedModalities = (engine?.modalities ?? []).filter((m) => m.status === 'shipped');
  const otherModalities = (engine?.modalities ?? []).filter((m) => m.status !== 'shipped');

  return (
    <AppShell>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.85rem',
          fontWeight: 720,
          letterSpacing: '-0.03em',
          margin: '0 0 0.35rem',
        }}
      >
        Embedding Cloud
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.5rem', maxWidth: '44rem' }}>
        {engine?.note ??
          'Text/document/code embeddings plus caption→embed paths for speech, image, video, and cross-modal.'}{' '}
        <Link href="/intelligence-cloud">Intelligence Cloud</Link> ·{' '}
        <Link href="/knowledge">Knowledge / RAG</Link>
        {engine?.links?.speakerIntelligence ? (
          <>
            {' '}
            · <Link href={engine.links.speakerIntelligence}>Speaker Intelligence</Link>
          </>
        ) : null}
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      {analytics ? (
        <p style={{ margin: '0 0 1.25rem', fontWeight: 600 }}>
          {analytics.requests} requests · {analytics.tokens} tokens this month
          {analytics.byModality?.length
            ? ` · ${analytics.byModality.map((m) => `${m.modality}:${m.count}`).join(' · ')}`
            : ''}
        </p>
      ) : null}

      <div style={{ display: 'grid', gap: '1.75rem', maxWidth: '48rem' }}>
        <section>
          <h2 style={label}>Try embed</h2>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={3}
            placeholder={MODALITY_HINTS[modality] ?? 'Input to embed'}
            style={{
              width: '100%',
              padding: '0.65rem',
              border: '1px solid var(--line)',
              borderRadius: '0.4rem',
              fontFamily: 'inherit',
              background: 'var(--bg-elevated)',
              color: 'var(--ink)',
            }}
          />
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={modality}
              onChange={(e) => setModality(e.target.value)}
              style={{
                padding: '0.45rem',
                borderRadius: '0.35rem',
                border: '1px solid var(--line)',
                background: 'var(--bg-elevated)',
                color: 'var(--ink)',
              }}
            >
              {(shippedModalities.length
                ? shippedModalities
                : [
                    { id: 'text', name: 'Text' },
                    { id: 'document', name: 'Document' },
                    { id: 'code', name: 'Code' },
                    { id: 'speech', name: 'Speech' },
                    { id: 'image', name: 'Image' },
                    { id: 'video', name: 'Video' },
                    { id: 'cross_modal', name: 'Cross Modal' },
                    { id: 'hybrid', name: 'Hybrid' },
                  ]
              ).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <button type="button" disabled={loading || !input.trim()} style={primary} onClick={() => void embed()}>
              {loading ? 'Embedding…' : 'Embed'}
            </button>
          </div>
          <p style={{ margin: '0.45rem 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
            {MODALITY_HINTS[modality]}
          </p>
          {result ? <pre style={pre}>{result}</pre> : null}
        </section>

        {models ? (
          <section>
            <h2 style={label}>Models</h2>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {models.models.map((m) => (
                <li key={m.id} style={{ borderTop: '1px solid var(--line)', padding: '0.4rem 0' }}>
                  <strong>{m.id}</strong>
                  {m.default ? ' · default' : ''} · {m.dimensions}d · {m.provider}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {engine ? (
          <section>
            <h2 style={label}>Modalities</h2>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {engine.modalities.map((m) => (
                <li key={m.id} style={{ borderTop: '1px solid var(--line)', padding: '0.4rem 0' }}>
                  <strong>{m.name}</strong>{' '}
                  <span
                    style={{
                      color: m.status === 'shipped' ? 'var(--brand)' : 'var(--muted)',
                      fontSize: '0.85rem',
                      fontWeight: 650,
                    }}
                  >
                    · {m.status}
                  </span>
                  <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{m.notes}</div>
                </li>
              ))}
            </ul>
            {otherModalities.length ? (
              <p style={{ margin: '0.75rem 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
                Also listed: {otherModalities.map((m) => m.name).join(', ')}.
              </p>
            ) : null}
          </section>
        ) : null}

        {engine?.capabilities?.length ? (
          <section>
            <h2 style={label}>Capabilities</h2>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {engine.capabilities.map((c) => (
                <li key={c.id} style={{ borderTop: '1px solid var(--line)', padding: '0.4rem 0' }}>
                  <strong>{c.name}</strong>{' '}
                  <StatusSuffix status={c.status} />
                  <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{c.notes}</div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}

const label: React.CSSProperties = {
  fontSize: '0.8rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--muted)',
  margin: '0 0 0.5rem',
};

const primary: React.CSSProperties = {
  padding: '0.65rem 1.1rem',
  background: 'var(--ink)',
  color: '#fff',
  border: 'none',
  borderRadius: '0.45rem',
  fontWeight: 600,
  fontSize: '0.9rem',
  cursor: 'pointer',
};

const pre: React.CSSProperties = {
  margin: '0.75rem 0 0',
  padding: '0.85rem',
  background: 'var(--bg-soft)',
  border: '1px solid var(--line)',
  borderRadius: '0.45rem',
  overflow: 'auto',
  fontSize: '0.8rem',
};
