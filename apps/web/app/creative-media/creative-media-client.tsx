'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { API_URL, apiFetch } from '@/lib/api';
import { resolveApiToken } from '@/lib/dev-auth';
import { AppShell } from '@/components/app-shell';
import { CatalogConsole, type CatalogRow } from '@/components/catalog-console';

type Engine = {
  product: string;
  note: string;
  capabilities: CatalogRow[];
};

export function CreativeMediaClient() {
  const { getToken, isLoaded } = useAuth();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('Lagos market whoosh into warm afrobeat bed');
  const [script, setScript] = useState('Karibu! Shop local languages with VerbaLab voice.');
  const [product, setProduct] = useState('VerbaMarket');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const token = await resolveApiToken(getToken);
    if (!token) throw new Error('Not signed in');
    setEngine(await apiFetch<Engine>('/v1/creative-media/engine', { token }));
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  async function runJson(path: string, body: Record<string, unknown>, kind: 'audio' | 'image' | 'text') {
    setBusy(true);
    setError(null);
    try {
      const token = await resolveApiToken(getToken);
      if (!token) throw new Error('Not signed in');
      const res = await fetch(`${API_URL}${path}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? `HTTP ${res.status}`);
      if (kind === 'audio' && data.audioBase64) {
        const bin = atob(data.audioBase64 as string);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(URL.createObjectURL(new Blob([bytes], { type: data.mimeType ?? 'audio/wav' })));
        setMeta(String(data.note ?? data.kind ?? 'Audio ready'));
      } else if (kind === 'image' && data.imageBase64) {
        const url = `data:${data.mimeType ?? 'image/svg+xml'};base64,${data.imageBase64}`;
        setImageUrl(url);
        setMeta(String(data.note ?? 'Image ready'));
      } else if (kind === 'audio' && data.package?.music?.audioBase64) {
        const bin = atob(data.package.music.audioBase64 as string);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' })));
        if (data.package?.still?.imageBase64) {
          setImageUrl(`data:image/svg+xml;base64,${data.package.still.imageBase64}`);
        }
        setMeta(String(data.note ?? 'Ads package ready'));
      } else {
        setMeta(JSON.stringify(data).slice(0, 280));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.85rem',
              fontWeight: 720,
              letterSpacing: '-0.03em',
              margin: '0 0 0.35rem',
            }}
          >
            VerbaCreative Media
          </h1>
          <p style={{ color: 'var(--muted)', margin: 0, maxWidth: '40rem' }}>
            Voice changer, isolator, sound effects, music, voice design, image/video, and ads — the creative
            suite mobile and web developers integrate across Africa.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link href="/voice-studio" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
            Voice Studio
          </Link>
          <Link href="/video-voice" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
            Dubbing
          </Link>
          <Link href="/docs" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
            Docs
          </Link>
        </div>
      </div>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      <div
        className="vl-panel"
        style={{ marginTop: '1.25rem', padding: '1.1rem 1.25rem', display: 'grid', gap: '0.75rem' }}
      >
        <label className="vl-label" style={{ display: 'grid', gap: '0.35rem' }}>
          Prompt
          <input className="vl-field" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <button
            type="button"
            className="vl-btn vl-btn-primary"
            disabled={busy}
            onClick={() => void runJson('/v1/creative-media/sound-effects', { prompt }, 'audio')}
          >
            Sound effects
          </button>
          <button
            type="button"
            className="vl-btn vl-btn-secondary"
            disabled={busy}
            onClick={() => void runJson('/v1/creative-media/music', { prompt, durationSeconds: 8 }, 'audio')}
          >
            Music
          </button>
          <button
            type="button"
            className="vl-btn vl-btn-secondary"
            disabled={busy}
            onClick={() => void runJson('/v1/creative-media/image', { prompt }, 'image')}
          >
            Image
          </button>
          <button
            type="button"
            className="vl-btn vl-btn-secondary"
            disabled={busy}
            onClick={() => void runJson('/v1/creative-media/video', { prompt, durationSeconds: 12 }, 'text')}
          >
            Video storyboard
          </button>
          <button
            type="button"
            className="vl-btn vl-btn-secondary"
            disabled={busy}
            onClick={() =>
              void runJson(
                '/v1/creative-media/voice-design',
                {
                  name: product,
                  description: prompt,
                  language: 'sw',
                  accent: 'east-african',
                },
                'text',
              )
            }
          >
            Voice design
          </button>
        </div>
        <label className="vl-label" style={{ display: 'grid', gap: '0.35rem' }}>
          Ads product
          <input className="vl-field" value={product} onChange={(e) => setProduct(e.target.value)} />
        </label>
        <label className="vl-label" style={{ display: 'grid', gap: '0.35rem' }}>
          Ads script
          <textarea className="vl-field" rows={3} value={script} onChange={(e) => setScript(e.target.value)} />
        </label>
        <button
          type="button"
          className="vl-btn vl-btn-primary"
          disabled={busy}
          onClick={() =>
            void runJson(
              '/v1/creative-media/ads',
              { product, script, language: 'sw', mood: 'warm afrobeat' },
              'audio',
            )
          }
        >
          Compose ad package
        </button>
        {meta ? <p style={{ margin: 0, color: 'var(--muted)' }}>{meta}</p> : null}
        {audioUrl ? <audio controls src={audioUrl} style={{ width: '100%' }} /> : null}
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="Generated creative" style={{ width: '100%', maxWidth: 640, borderRadius: 12 }} />
        ) : null}
      </div>

      {engine ? (
        <div style={{ marginTop: '1.5rem' }}>
          <CatalogConsole
            note={engine.note}
            sections={[{ title: 'Creative capabilities', rows: engine.capabilities, linkKey: 'console' }]}
          />
        </div>
      ) : (
        <p style={{ color: 'var(--muted)' }}>Loading creative engine…</p>
      )}
    </AppShell>
  );
}
