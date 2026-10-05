'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { API_URL, apiFetch } from '@/lib/api';

type Language = { code: string; name: string };
type Mode = 'translate' | 'detect' | 'speech' | 'languages';

function isApiKey(value: string) {
  return value.startsWith('vl_live_') || value.startsWith('vl_test_');
}

export function PlaygroundClient() {
  const [mode, setMode] = useState<Mode>('translate');
  const [apiKey, setApiKey] = useState('');
  const [languages, setLanguages] = useState<Language[]>([]);
  const [source, setSource] = useState('en');
  const [target, setTarget] = useState('sw');
  const [voice, setVoice] = useState('alloy');
  const [text, setText] = useState('');
  const [response, setResponse] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [prefillNote, setPrefillNote] = useState<string | null>(null);

  useEffect(() => {
    void apiFetch<{ data: Language[] }>('/v1/languages')
      .then((res) => setLanguages(res.data))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    void apiFetch<{
      prefill: { text?: string; source?: string; target?: string; note?: string };
    }>('/v1/cms/prefills/playground')
      .then((res) => {
        if (res.prefill.text) setText(res.prefill.text);
        if (res.prefill.source) setSource(res.prefill.source);
        if (res.prefill.target) setTarget(res.prefill.target);
        setPrefillNote(res.prefill.note ?? 'CMS prefill loaded for review.');
      })
      .catch(() => {
        setText('Good morning. We are ready to ship samples from Lagos to Ibadan this week.');
        setPrefillNote('Fallback playground sample (CMS unavailable).');
      });
  }, []);

  const curl =
    mode === 'languages'
      ? `curl "${API_URL}/v1/languages"`
      : mode === 'detect'
        ? `curl -X POST "${API_URL}/v1/detect" \\
  -H "Authorization: Bearer ${apiKey || 'vl_live_...'}" \\
  -H "Content-Type: application/json" \\
  -d '{"text":${JSON.stringify(text)}}'`
        : mode === 'speech'
          ? `curl -X POST "${API_URL}/v1/audio/speech" \\
  -H "Authorization: Bearer ${apiKey || 'vl_live_...'}" \\
  -H "Content-Type: application/json" \\
  -d '{"text":${JSON.stringify(text)},"voice":"${voice}","language":"${target}","format":"mp3"}' \\
  --output speech.mp3`
          : `curl -X POST "${API_URL}/v1/translate" \\
  -H "Authorization: Bearer ${apiKey || 'vl_live_...'}" \\
  -H "Content-Type: application/json" \\
  -d '{"text":${JSON.stringify(text)},"source":"${source}","target":"${target}"}'`;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    setResponse('');
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    try {
      if (mode === 'languages') {
        const res = await apiFetch<unknown>('/v1/languages');
        setResponse(JSON.stringify(res, null, 2));
        return;
      }
      if (!isApiKey(apiKey)) {
        throw new Error('Paste a vl_live_ or vl_test_ API key from the console');
      }
      if (mode === 'detect') {
        const res = await apiFetch<unknown>('/v1/detect', {
          method: 'POST',
          token: apiKey,
          body: JSON.stringify({ text }),
        });
        setResponse(JSON.stringify(res, null, 2));
        return;
      }
      if (mode === 'speech') {
        const res = await fetch(`${API_URL}/v1/audio/speech`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text, voice, language: target, format: 'mp3' }),
        });
        if (!res.ok) {
          const payload = (await res.json().catch(() => ({}))) as {
            error?: { message?: string };
          };
          throw new Error(payload.error?.message ?? `HTTP ${res.status}`);
        }
        const buf = await res.arrayBuffer();
        const blob = new Blob([buf], { type: res.headers.get('content-type') || 'audio/mpeg' });
        setAudioUrl(URL.createObjectURL(blob));
        setResponse(
          JSON.stringify(
            {
              ok: true,
              bytes: buf.byteLength,
              voice: res.headers.get('X-VerbaLab-Voice') ?? voice,
              provider: res.headers.get('X-VerbaLab-Provider'),
              characters: res.headers.get('X-VerbaLab-Characters'),
              note: 'TTS audio rendered below — metered from your shared credit pool.',
            },
            null,
            2,
          ),
        );
        return;
      }
      const res = await apiFetch<unknown>('/v1/translate', {
        method: 'POST',
        token: apiKey,
        body: JSON.stringify({ text, source, target }),
      });
      setResponse(JSON.stringify(res, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="vl-fade-up" style={{ maxWidth: '56rem', margin: '0 auto', padding: '2.25rem 1.5rem 4rem' }}>
      <PublicHeader />
      <h1 style={{ margin: '1.5rem 0 0', fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', fontSize: '2rem' }}>
        API playground
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0.5rem 0 0' }}>
        Try translate, detect, speech (TTS), and languages with a <code className="vl-code">vl_*</code> API key.
      </p>
      {prefillNote ? (
        <p style={{ color: 'var(--muted)', margin: '0.45rem 0 0', fontSize: '0.85rem' }}>{prefillNote}</p>
      ) : null}

      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
        {(['translate', 'detect', 'speech', 'languages'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className="vl-btn"
            style={{
              background: mode === m ? 'var(--ink)' : 'transparent',
              color: mode === m ? '#fff' : 'var(--muted)',
              border: '1px solid var(--line)',
            }}
          >
            {m}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="vl-panel" style={{ marginTop: '1rem', padding: '1.35rem', display: 'grid', gap: '1rem' }}>
        {mode !== 'languages' ? (
          <label className="vl-label">
            API key
            <input
              className="vl-field vl-code"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="vl_live_... or vl_test_..."
              required
            />
          </label>
        ) : null}

        {mode === 'translate' || mode === 'speech' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {mode === 'translate' ? (
              <label className="vl-label">
                Source
                <select className="vl-field" value={source} onChange={(e) => setSource(e.target.value)}>
                  <option value="auto">Auto-detect</option>
                  {(languages.length ? languages : [{ code: 'en', name: 'English' }, { code: 'sw', name: 'Swahili' }]).map(
                    (lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name} ({lang.code})
                      </option>
                    ),
                  )}
                </select>
              </label>
            ) : (
              <label className="vl-label">
                Voice
                <input className="vl-field" value={voice} onChange={(e) => setVoice(e.target.value)} />
              </label>
            )}
            <label className="vl-label">
              {mode === 'speech' ? 'Language' : 'Target'}
              <select className="vl-field" value={target} onChange={(e) => setTarget(e.target.value)}>
                {(languages.length ? languages : [{ code: 'en', name: 'English' }, { code: 'sw', name: 'Swahili' }]).map(
                  (lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name} ({lang.code})
                    </option>
                  ),
                )}
              </select>
            </label>
          </div>
        ) : null}

        {mode !== 'languages' ? (
          <label className="vl-label">
            Text
            <textarea className="vl-field" rows={5} value={text} onChange={(e) => setText(e.target.value)} required />
          </label>
        ) : (
          <p style={{ margin: 0, color: 'var(--muted)' }}>Public language registry — no API key required.</p>
        )}

        <button type="submit" className="vl-btn vl-btn-primary" disabled={loading} style={{ justifySelf: 'start' }}>
          {loading ? 'Sending…' : mode === 'speech' ? 'Synthesize speech' : 'Send request'}
        </button>
      </form>

      {error ? <p style={{ color: 'var(--bad)' }}>{error}</p> : null}
      {audioUrl ? <audio controls src={audioUrl} style={{ width: '100%', marginTop: '1rem' }} /> : null}

      <div style={{ display: 'grid', gap: '1rem', marginTop: '1.25rem' }}>
        <pre className="vl-panel vl-code" style={{ margin: 0, padding: '1rem', overflow: 'auto', background: 'var(--bg-soft)', border: 'none' }}>
          {curl}
        </pre>
        {response ? (
          <pre className="vl-panel vl-code" style={{ margin: 0, padding: '1rem', overflow: 'auto' }}>
            {response}
          </pre>
        ) : null}
      </div>
    </div>
  );
}

function PublicHeader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
      <Link href="/" style={{ fontFamily: 'var(--font-display)', fontWeight: 760, textDecoration: 'none', fontSize: '1.15rem' }}>
        VerbaLab
      </Link>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <Link href="/docs" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
          Docs
        </Link>
        <Link href="/docs/openapi" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
          OpenAPI
        </Link>
        <Link href="/developers" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
          Developers
        </Link>
        <Link href="/dashboard" className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none', padding: '0.45rem 0.9rem' }}>
          Console
        </Link>
      </div>
    </div>
  );
}
