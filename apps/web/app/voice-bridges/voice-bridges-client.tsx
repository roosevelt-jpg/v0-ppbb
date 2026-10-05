'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Platform = {
  id: string;
  name: string;
  status: string;
  verdict: string;
  protocols: string[];
  endpoints: string[];
  setup: string;
  honesty: string;
};

type Engine = {
  blurb?: string;
  platforms?: Platform[];
  honesty?: { note?: string; ownAiPrimary?: boolean };
  score?: { total?: number; shipped?: number; yes?: number };
  links?: Record<string, string>;
};

export function VoiceBridgesClient() {
  const [engine, setEngine] = useState<Engine | null>(null);
  const [snippet, setSnippet] = useState<string | null>(null);
  const [snippetBusy, setSnippetBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState('vapi');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setError(null);
      try {
        const eng = await apiFetch<Engine>('/v1/voice-bridges/engine');
        if (cancelled) return;
        setEngine(eng);
        if (eng.platforms?.[0]?.id) setSelected(eng.platforms[0].id);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load voice bridges');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    setSnippetBusy(true);
    setSnippet(null);
    void (async () => {
      try {
        const snip = await apiFetch<Record<string, unknown>>(
          `/v1/voice-bridges/platforms/${encodeURIComponent(selected)}/snippet`,
        );
        if (cancelled) return;
        // Guard against a stale VAPI payload if selection raced.
        if (snip.platform && snip.platform !== selected) return;
        setSnippet(JSON.stringify(snip, null, 2));
      } catch (err) {
        if (!cancelled) {
          setSnippet(
            JSON.stringify(
              {
                platform: selected,
                error: err instanceof Error ? err.message : 'Failed to load snippet',
              },
              null,
              2,
            ),
          );
        }
      } finally {
        if (!cancelled) setSnippetBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected]);

  const platforms = engine?.platforms ?? [];
  const active = platforms.find((p) => p.id === selected) ?? platforms[0];
  // Title always tracks the selected chip — never a hardcoded VAPI label.
  const snippetHeading = active
    ? `${active.name} integration snippet`
    : 'Integration snippet';

  return (
    <AppShell>
      <main style={{ padding: '1.5rem', maxWidth: 980 }}>
        <p style={{ color: 'var(--muted)' }}>
          <Link href="/voice">Voice agents</Link>
          {' · '}
          <Link href="/verba-voice">Verba Voice</Link>
          {' · '}
          <Link href="/partner-connectors">Partner Connectors</Link>
          {' · '}
          <Link href="/docs">Docs</Link>
        </p>
        <h1 style={{ fontSize: '1.75rem', margin: '0.5rem 0' }}>Voice platform bridges</h1>
        <p>
          {engine?.blurb ||
            'Plug VerbaLab Own AI TTS/STT/agents into VAPI, Twilio, Amazon, Google, SIP, and WebRTC.'}
        </p>
        {engine?.score ? (
          <p style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>
            {engine.score.yes}/{engine.score.total} platforms ready
          </p>
        ) : null}
        {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}

        <h2 style={{ marginTop: '1.5rem', fontSize: '1.15rem' }}>Platforms</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {platforms.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelected(p.id)}
              style={{
                padding: '0.35rem 0.75rem',
                border:
                  selected === p.id
                    ? '1px solid var(--fg, #18181b)'
                    : '1px solid var(--border, #e4e4e7)',
                background: selected === p.id ? 'var(--fg, #18181b)' : 'transparent',
                color: selected === p.id ? 'var(--bg, #fff)' : 'inherit',
                cursor: 'pointer',
              }}
            >
              {p.name} · {p.verdict.toUpperCase()}
            </button>
          ))}
        </div>

        {active ? (
          <section style={{ borderTop: '1px solid var(--border, #e4e4e7)', paddingTop: 12 }}>
            <h3 style={{ margin: '0 0 0.5rem' }}>
              {active.name}{' '}
              <span style={{ color: 'var(--muted)', fontWeight: 400 }}>
                ({active.status} / {active.verdict})
              </span>
            </h3>
            <p>{active.setup}</p>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{active.honesty}</p>
            <p style={{ fontSize: '0.85rem' }}>Protocols: {active.protocols.join(', ')}</p>
            <ul style={{ fontSize: '0.9rem', paddingLeft: '1.2rem' }}>
              {active.endpoints.map((ep) => (
                <li key={ep}>
                  <code className="vl-code">{ep}</code>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <h2 style={{ marginTop: '1.5rem', fontSize: '1.15rem' }}>{snippetHeading}</h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: 0 }}>
          Showing recipe for <code className="vl-code">{selected}</code>
        </p>
        <pre
          style={{
            overflow: 'auto',
            padding: 12,
            background: 'var(--surface, #f4f4f5)',
            fontSize: '0.8rem',
            maxHeight: 360,
          }}
        >
          {snippetBusy && !snippet ? 'Loading…' : snippet || 'Loading…'}
        </pre>

        {engine?.honesty?.note ? (
          <p style={{ marginTop: '1.5rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
            {engine.honesty.note}
          </p>
        ) : null}
      </main>
    </AppShell>
  );
}
