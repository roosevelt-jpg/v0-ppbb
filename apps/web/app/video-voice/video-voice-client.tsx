'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { API_URL, apiFetch } from '@/lib/api';
import { resolveApiToken } from '@/lib/dev-auth';
import { AppShell } from '@/components/app-shell';

export function VideoVoiceClient() {
  const { getToken, isLoaded } = useAuth();
  const [engine, setEngine] = useState<Record<string, unknown> | null>(null);
  const [text, setText] = useState('Karibu Nairobi — asante sana for shopping local.');
  const [target, setTarget] = useState('sw');
  const [source, setSource] = useState('en');
  const [voice, setVoice] = useState('alloy');
  const [mode, setMode] = useState('auto_watermark');
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void apiFetch<Record<string, unknown>>('/v1/video-voice/engine').then(setEngine).catch(() => null);
  }, []);

  async function runDub() {
    setBusy(true);
    setError(null);
    try {
      const token = await resolveApiToken(getToken);
      if (!token) throw new Error('Not signed in');
      const form = new FormData();
      if (text.trim()) form.set('text', text.trim());
      form.set('sourceLanguage', source);
      form.set('targetLanguage', target);
      form.set('voice', voice);
      form.set('mode', mode);
      form.set('format', 'mp3');
      if (file) form.set('file', file);
      const res = await fetch(`${API_URL}/v1/video-voice/dub`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? `HTTP ${res.status}`);
      if (data.audioBase64) {
        const bin = atob(data.audioBase64 as string);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(
          URL.createObjectURL(new Blob([bytes], { type: data.mimeType ?? 'audio/mpeg' })),
        );
      }
      setMeta(
        `Dubbed → ${data.targetLanguage} · ${data.creditsCharged} credits · ${data.minutesBilled} min · watermark=${data.watermarkApplied}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Dub failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <main style={{ padding: '1.5rem', maxWidth: 880, display: 'grid', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.35rem', fontFamily: 'var(--font-display)' }}>Video Voice / Dubbing</h1>
          <p style={{ color: 'var(--muted)', margin: 0 }}>
            <Link href="/voice-fm">Voice FM</Link> · <Link href="/translate-fm">Translate FM</Link> ·{' '}
            <Link href="/creative-media">Creative Media</Link> ·{' '}
            <Link href="/intent-preserving-dub">Intent-preserving dub</Link>
          </p>
          <p style={{ color: 'var(--muted)', margin: '0.5rem 0 0' }}>
            End-to-end dubbing: optional source audio STT → translate → TTS. Billed as dubbing minutes from your shared
            credit pool. Watermarked modes work on Free; clean commercial export needs Starter+.
          </p>
        </div>

        {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

        <div className="vl-panel" style={{ padding: '1.1rem 1.25rem', display: 'grid', gap: '0.75rem' }}>
          <label className="vl-label" style={{ display: 'grid', gap: '0.35rem' }}>
            Script (or leave empty if uploading audio)
            <textarea className="vl-field" rows={3} value={text} onChange={(e) => setText(e.target.value)} />
          </label>
          <label className="vl-label" style={{ display: 'grid', gap: '0.35rem' }}>
            Source audio (optional)
            <input
              type="file"
              accept="audio/*,video/mp4"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            <label className="vl-label" style={{ display: 'grid', gap: '0.35rem' }}>
              Source
              <input className="vl-field" value={source} onChange={(e) => setSource(e.target.value)} />
            </label>
            <label className="vl-label" style={{ display: 'grid', gap: '0.35rem' }}>
              Target
              <input className="vl-field" value={target} onChange={(e) => setTarget(e.target.value)} />
            </label>
            <label className="vl-label" style={{ display: 'grid', gap: '0.35rem' }}>
              Voice
              <input className="vl-field" value={voice} onChange={(e) => setVoice(e.target.value)} />
            </label>
            <label className="vl-label" style={{ display: 'grid', gap: '0.35rem' }}>
              Mode
              <select className="vl-field" value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="auto_watermark">Auto + watermark (Free)</option>
                <option value="auto">Auto clean (Starter+)</option>
                <option value="studio_watermark">Studio + watermark</option>
                <option value="studio">Studio clean (Starter+)</option>
              </select>
            </label>
          </div>
          <button type="button" className="vl-btn vl-btn-primary" disabled={busy || !isLoaded} onClick={() => void runDub()}>
            {busy ? 'Dubbing…' : 'Run dub job'}
          </button>
          {meta ? <p style={{ margin: 0, color: 'var(--muted)' }}>{meta}</p> : null}
          {audioUrl ? <audio controls src={audioUrl} style={{ width: '100%' }} /> : null}
        </div>

        <pre style={{ background: 'var(--surface, #f4f4f5)', padding: 12, overflow: 'auto' }}>
          {JSON.stringify(engine, null, 2)}
        </pre>
      </main>
    </AppShell>
  );
}
