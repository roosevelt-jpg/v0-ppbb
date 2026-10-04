'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { resolveApiToken } from '@/lib/dev-auth';
import { AppShell } from '@/components/app-shell';

type Surface = { id: string; api: string; console: string | null };
type Capability = { id: string; name: string; status: string; api: string | null };
type Overview = {
  engine: {
    blurb?: string;
    capabilities?: Capability[];
    safety?: Record<string, unknown>;
  };
  dashboard: {
    window: string;
    audits24h: number;
    errors24h: number;
    recent: Array<{ id: string; action: string; route: string | null; at: string }>;
    surfaces: Surface[];
  };
  links: Record<string, string>;
};

export function AiObservabilityClient() {
  const { getToken, isLoaded } = useAuth();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await resolveApiToken(getToken);
    if (!token) throw new Error('Not signed in — use /dev-login');
    setData(await apiFetch<Overview>('/v1/ai-observability/overview', { token }));
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch((e: Error) => setError(e.message));
  }, [isLoaded, load]);

  return (
    <AppShell>
      <p style={{ color: 'var(--muted)', margin: '0 0 0.5rem' }}>
        <Link href="/intelligence-cloud">Intelligence Cloud</Link>
        {' · '}
        <Link href="/intelligence-analytics">Intel Analytics</Link>
        {' · '}
        <Link href="/audit">Audit</Link>
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
        AI Observability
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.5rem', maxWidth: '44rem' }}>
        {data?.engine.blurb ||
          'Request IDs, audits, health, and product monitoring hubs — not a third-party APM OS.'}
      </p>

      {error ? <p style={{ color: 'var(--bad)' }}>{error}</p> : null}
      {!data && !error ? <p style={{ color: 'var(--muted)' }}>Loading…</p> : null}

      {data ? (
        <div style={{ display: 'grid', gap: '1.5rem', maxWidth: '52rem' }}>
          <section className="vl-stat-grid">
            <div className="vl-panel" style={{ padding: '1rem 1.1rem' }}>
              <p style={statLabel}>Audits ({data.dashboard.window})</p>
              <p style={statValue}>{data.dashboard.audits24h}</p>
            </div>
            <div className="vl-panel" style={{ padding: '1rem 1.1rem' }}>
              <p style={statLabel}>Failure-like actions</p>
              <p style={statValue}>{data.dashboard.errors24h}</p>
            </div>
            <div className="vl-panel" style={{ padding: '1rem 1.1rem' }}>
              <p style={statLabel}>Monitoring surfaces</p>
              <p style={statValue}>{data.dashboard.surfaces.length}</p>
            </div>
          </section>

          <section>
            <h2 style={label}>Capabilities</h2>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {(data.engine.capabilities ?? []).map((c) => (
                <li key={c.id} style={{ borderTop: '1px solid var(--line)', padding: '0.5rem 0' }}>
                  <strong>{c.name}</strong>{' '}
                  <span style={{ color: c.status === 'shipped' ? 'var(--brand)' : 'var(--muted)', fontSize: '0.8rem', fontWeight: 650 }}>
                    · {c.status}
                  </span>
                  {c.api ? (
                    <div>
                      <code style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{c.api}</code>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 style={label}>Product monitoring surfaces</h2>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {data.dashboard.surfaces.map((s) => (
                <li
                  key={s.id}
                  style={{
                    borderTop: '1px solid var(--line)',
                    padding: '0.55rem 0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <strong style={{ textTransform: 'capitalize' }}>{s.id.replace(/-/g, ' ')}</strong>
                    <div>
                      <code style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{s.api}</code>
                    </div>
                  </div>
                  {s.console ? (
                    <Link href={s.console} className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none', padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
                      Open console
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 style={label}>Recent audits</h2>
            {data.dashboard.recent.length === 0 ? (
              <p style={{ color: 'var(--muted)', margin: 0 }}>No audit events yet.</p>
            ) : (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {data.dashboard.recent.map((r) => (
                  <li key={r.id} style={{ borderTop: '1px solid var(--line)', padding: '0.4rem 0', fontSize: '0.88rem' }}>
                    <code>{r.action}</code>
                    {r.route ? <span style={{ color: 'var(--muted)' }}> · {r.route}</span> : null}
                    <span style={{ color: 'var(--muted)' }}> · {new Date(r.at).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {data.engine.safety ? (
            <section>
              <h2 style={label}>Honesty</h2>
              <pre style={pre}>{JSON.stringify(data.engine.safety, null, 2)}</pre>
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

const statLabel: React.CSSProperties = {
  margin: 0,
  fontSize: '0.72rem',
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
  fontWeight: 700,
};

const statValue: React.CSSProperties = {
  margin: '0.4rem 0 0',
  fontSize: '1.35rem',
  fontWeight: 700,
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
