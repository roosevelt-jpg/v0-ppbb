'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { resolveApiToken } from '@/lib/dev-auth';
import { AppShell } from '@/components/app-shell';

type Capability = { id: string; name: string; status: string; api: string | null };
type RouteTo = { module: string; path: string; api: string };
type Overview = {
  engine: {
    title?: string;
    blurb?: string;
    capabilities?: Capability[];
    routesTo?: RouteTo[];
    safety?: Record<string, unknown>;
  };
  activity: {
    window: string;
    count: number;
    events: Array<{ id: string; action: string; at: string }>;
  };
  links: Record<string, string>;
  docs?: string;
};

export function AgentIntelligenceClient() {
  const { getToken, isLoaded } = useAuth();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await resolveApiToken(getToken);
    if (!token) throw new Error('Not signed in — use /dev-login');
    setData(await apiFetch<Overview>('/v1/agent-intelligence/overview', { token }));
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch((e: Error) => setError(e.message));
  }, [isLoaded, load]);

  const engine = data?.engine;

  return (
    <AppShell>
      <p style={{ color: 'var(--muted)', margin: '0 0 0.5rem' }}>
        <Link href="/intelligence-cloud">Intelligence Cloud</Link>
        {' · '}
        <Link href="/agent-runtime">Agent Runtime</Link>
        {' · '}
        <Link href="/ai-orchestration">Orchestration</Link>
        {' · '}
        <Link href="/partner-connectors">Partner Connectors</Link>
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
        Agent Intelligence
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.5rem', maxWidth: '44rem' }}>
        {engine?.blurb ||
          'Hub over agent-runtime, voice FAQ, orchestration, and partner MCP tools — not a full agent OS.'}
      </p>

      {error ? <p style={{ color: 'var(--bad)' }}>{error}</p> : null}
      {!data && !error ? <p style={{ color: 'var(--muted)' }}>Loading…</p> : null}

      {data ? (
        <div style={{ display: 'grid', gap: '1.5rem', maxWidth: '52rem' }}>
          <section>
            <h2 style={label}>Open consoles</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem' }}>
              {(engine?.routesTo ?? []).map((r) => (
                <Link key={r.path} href={r.path} className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none' }}>
                  {r.module}
                </Link>
              ))}
              <Link href={data.links.orchestration ?? '/ai-orchestration'} className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none' }}>
                Run orchestration
              </Link>
            </div>
          </section>

          <section>
            <h2 style={label}>Capabilities</h2>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {(engine?.capabilities ?? []).map((c) => (
                <li key={c.id} style={{ borderTop: '1px solid var(--line)', padding: '0.55rem 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <strong>{c.name}</strong>
                    <span style={{ color: c.status === 'shipped' ? 'var(--brand)' : 'var(--muted)', fontWeight: 650, fontSize: '0.8rem' }}>
                      {c.status}
                    </span>
                  </div>
                  {c.api ? (
                    <code style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{c.api}</code>
                  ) : (
                    <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>No public API yet</span>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 style={label}>Recent activity ({data.activity.window})</h2>
            <p style={{ margin: '0 0 0.55rem', fontWeight: 600 }}>{data.activity.count} events</p>
            {data.activity.events.length === 0 ? (
              <p style={{ color: 'var(--muted)', margin: 0 }}>No agent/orchestration events in this window yet.</p>
            ) : (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {data.activity.events.map((e) => (
                  <li key={e.id} style={{ borderTop: '1px solid var(--line)', padding: '0.4rem 0', fontSize: '0.88rem' }}>
                    <code>{e.action}</code>
                    <span style={{ color: 'var(--muted)' }}> · {new Date(e.at).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {engine?.safety ? (
            <section>
              <h2 style={label}>Honesty</h2>
              <pre style={pre}>{JSON.stringify(engine.safety, null, 2)}</pre>
            </section>
          ) : null}
        </div>
      ) : null}
    </AppShell>
  );
}

const label: React.CSSProperties = {
  fontSize: '0.8rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--muted)',
  margin: '0 0 0.55rem',
};

const pre: React.CSSProperties = {
  margin: 0,
  padding: '0.85rem',
  background: 'var(--bg-soft)',
  border: '1px solid var(--line)',
  borderRadius: '0.45rem',
  overflow: 'auto',
  fontSize: '0.8rem',
};
