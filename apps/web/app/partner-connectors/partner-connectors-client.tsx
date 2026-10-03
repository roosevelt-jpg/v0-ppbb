'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Platform = {
  id: string;
  name: string;
  kind: string;
  protocols: string[];
  useCases: string[];
  api: string;
};

type Tool = { name: string; description: string };

export function PartnerConnectorsClient() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [blurb, setBlurb] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [platformId, setPlatformId] = useState('higgsfield');
  const [text, setText] = useState('hello');
  const [target, setTarget] = useState('sw');

  useEffect(() => {
    void Promise.all([
      apiFetch<{ blurb?: string; platforms?: Platform[] }>('/v1/partner-connectors/engine'),
      apiFetch<{ tools?: Tool[] }>('/v1/partner-connectors/tools'),
    ])
      .then(([engine, toolRes]) => {
        setBlurb(engine.blurb ?? '');
        setPlatforms(engine.platforms ?? []);
        setTools((toolRes.tools ?? []).map((t) => ({ name: t.name, description: t.description })));
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  async function invokeTranslate() {
    setBusy(true);
    setError(null);
    try {
      const out = await apiFetch<{ ok: boolean; result?: { text?: string }; error?: string }>(
        '/v1/partner-connectors/invoke',
        {
          method: 'POST',
          body: JSON.stringify({
            tool: 'verbalab_translate',
            platformId,
            arguments: { text, source: 'en', target },
          }),
        },
      );
      setResult(out.ok ? out.result?.text ?? JSON.stringify(out.result) : out.error ?? 'failed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'invoke failed');
    } finally {
      setBusy(false);
    }
  }

  async function mcpListTools() {
    setBusy(true);
    setError(null);
    try {
      const out = await apiFetch<{ result?: { tools?: Tool[] } }>('/v1/partner-connectors/mcp', {
        method: 'POST',
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
      });
      setResult(JSON.stringify(out.result?.tools?.map((t) => t.name) ?? out, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'mcp failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <main style={{ padding: '1.5rem', maxWidth: 980 }}>
        <p style={{ color: 'var(--muted)' }}>
          <Link href="/connectors">Connectors</Link>
          {' · '}
          <Link href="/connector-marketplace">Connector Market</Link>
          {' · '}
          <Link href="/model-runtime">Model Runtime</Link>
          {' · '}
          <Link href="/video-voice">Video Voice</Link>
        </p>
        <h1 style={{ fontSize: '1.75rem', margin: '0.5rem 0' }}>Partner Connectors</h1>
        <p>{blurb || 'Own-AI APIs for Higgsfield, Claude, Cursor, Runway, and the rest.'}</p>
        {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}

        <h2 style={{ marginTop: '1.5rem', fontSize: '1.15rem' }}>Platforms</h2>
        <div style={{ display: 'grid', gap: 8 }}>
          {platforms.map((p) => (
            <div key={p.id} style={{ borderTop: '1px solid var(--border, #e4e4e7)', paddingTop: 8 }}>
              <strong>{p.name}</strong> <span style={{ color: 'var(--muted)' }}>({p.kind})</span>
              <div style={{ fontSize: '0.9rem' }}>{p.useCases.join(' · ')}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                {p.protocols.join(', ')} — {p.api}
              </div>
            </div>
          ))}
        </div>

        <h2 style={{ marginTop: '1.5rem', fontSize: '1.15rem' }}>Try partner invoke</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={platformId} onChange={(e) => setPlatformId(e.target.value)} aria-label="Platform">
            {platforms.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <input value={text} onChange={(e) => setText(e.target.value)} aria-label="Text" />
          <select value={target} onChange={(e) => setTarget(e.target.value)} aria-label="Target">
            <option value="sw">sw</option>
            <option value="yo">yo</option>
            <option value="ha">ha</option>
            <option value="am">am</option>
            <option value="zu">zu</option>
          </select>
          <button type="button" disabled={busy} onClick={() => void invokeTranslate()}>
            Invoke translate
          </button>
          <button type="button" disabled={busy} onClick={() => void mcpListTools()}>
            MCP tools/list
          </button>
        </div>
        {result ? (
          <pre style={{ background: 'var(--surface, #f4f4f5)', padding: 12, marginTop: 12 }}>{result}</pre>
        ) : null}

        <h2 style={{ marginTop: '1.5rem', fontSize: '1.15rem' }}>MCP / CLI</h2>
        <pre style={{ background: 'var(--surface, #f4f4f5)', padding: 12, overflow: 'auto' }}>
{`# HTTP MCP
POST /v1/partner-connectors/mcp
GET  /v1/partner-connectors/mcp/manifest

# Stdio (Claude / Cursor)
pnpm --filter @verbalab/mcp start

# CLI
verbalab partner-connectors-engine
verbalab partner-invoke --tool verbalab_translate --args '{"text":"hello","source":"en","target":"sw"}'
verbalab partner-mcp-tools`}
        </pre>

        <h2 style={{ marginTop: '1.5rem', fontSize: '1.15rem' }}>Tools ({tools.length})</h2>
        <ul>
          {tools.map((t) => (
            <li key={t.name}>
              <code>{t.name}</code> — {t.description}
            </li>
          ))}
        </ul>
      </main>
    </AppShell>
  );
}
