'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { resolveApiToken } from '@/lib/dev-auth';
import { formatDateTime } from '@/lib/format-date';
import { AppShell } from '@/components/app-shell';

type ChecklistItem = {
  ready: boolean;
  env?: string[];
  howToGet?: string;
  note?: string;
  path?: string;
  console?: string;
  createInProduct?: Record<string, unknown>;
  fixture?: boolean;
  localRuntime?: boolean;
};

type Engine = {
  id: string;
  title: string;
  blurb: string;
  score: { ready: number; total: number };
  checklist: Record<string, ChecklistItem>;
  capabilities: Array<{ id: string; name: string; status: string; api: string; console: string }>;
  note?: string;
};

type Overview = {
  session: { organizationId: string; workspaceId: string; role: string };
  engine: Engine;
  summary: { total?: number; byDomain?: Record<string, number> } | Record<string, unknown>;
  links: Record<string, string>;
};

type RecordRow = {
  id: string;
  kind: string;
  title: string;
  summary?: string | null;
  createdAt?: string;
  updatedAt?: string;
  content?: Record<string, unknown> | null;
};

export function CredentialsReadinessClient() {
  const { getToken, isLoaded } = useAuth();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [kind, setKind] = useState('note');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await resolveApiToken(getToken);
    if (!token) throw new Error('Not signed in');
    const [ov, rec] = await Promise.all([
      apiFetch<Overview>('/v1/credentials-readiness/overview', { token }),
      apiFetch<{ data: RecordRow[] }>('/v1/credentials-readiness/records', { token }),
    ]);
    setOverview(ov);
    setRecords(rec.data ?? []);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const token = await resolveApiToken(getToken);
      if (!token) throw new Error('Not signed in');
      await apiFetch('/v1/credentials-readiness/records', {
        method: 'POST',
        token,
        body: JSON.stringify({
          kind: kind.trim() || 'note',
          title: title.trim(),
          summary: summary.trim() || undefined,
          content: { source: 'console', at: new Date().toISOString() },
        }),
      });
      setTitle('');
      setSummary('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setBusy(false);
    }
  }

  const engine = overview?.engine;
  const checklistEntries = engine ? Object.entries(engine.checklist) : [];

  return (
    <AppShell>
      <p style={{ color: 'var(--muted)', margin: 0 }}>
        <Link href="/model-keys">Model keys</Link> · <Link href="/keys">API keys</Link> ·{' '}
        <Link href="/billing">Billing</Link>
      </p>
      <h1 style={{ margin: '0.5rem 0 0', fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', fontSize: '2rem' }}>
        Credentials Readiness
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0.5rem 0 0', maxWidth: '40rem' }}>
        Live deploy checklist for Clerk, Stripe, VerbaLab model keys, Fly, residency unlocks, and ops notes for your
        workspace.
      </p>

      {error ? <p style={{ color: 'var(--bad)' }}>{error}</p> : null}
      {!overview && !error ? <p style={{ color: 'var(--muted)', marginTop: '1.25rem' }}>Loading…</p> : null}

      {overview && engine ? (
        <div style={{ marginTop: '1.5rem', display: 'grid', gap: '1.25rem' }}>
          <div
            className="vl-panel"
            style={{
              padding: '1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
              background: 'var(--bg-soft)',
              border: 'none',
            }}
          >
            <div>
              <div style={{ fontWeight: 650, fontSize: '1.1rem' }}>{engine.title}</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '0.35rem' }}>{engine.blurb}</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.45rem' }}>
                Workspace role: <strong style={{ color: 'var(--ink)' }}>{overview.session.role}</strong>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700 }}>
                {engine.score.ready}/{engine.score.total}
              </div>
              <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>checks ready</div>
            </div>
          </div>

          <section>
            <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.05rem' }}>Checklist</h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.65rem' }}>
              {checklistEntries.map(([key, item]) => (
                <li key={key} className="vl-panel" style={{ padding: '0.95rem 1.05rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: 650 }}>{labelize(key)}</div>
                      {item.note ? (
                        <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>{item.note}</div>
                      ) : null}
                      {item.env?.length ? (
                        <div className="vl-code" style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: '0.35rem' }}>
                          {item.env.join(' · ')}
                        </div>
                      ) : null}
                      {item.howToGet ? (
                        <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.35rem' }}>{item.howToGet}</div>
                      ) : null}
                      {item.createInProduct?.console ? (
                        <div style={{ marginTop: '0.45rem' }}>
                          <Link href={String(item.createInProduct.console)} style={{ color: 'var(--accent)', fontWeight: 550 }}>
                            Open {String(item.createInProduct.console)} →
                          </Link>
                        </div>
                      ) : null}
                      {item.console ? (
                        <div style={{ marginTop: '0.45rem' }}>
                          <Link href={item.console} style={{ color: 'var(--accent)', fontWeight: 550 }}>
                            Open {item.console} →
                          </Link>
                        </div>
                      ) : null}
                    </div>
                    <span
                      className="vl-code"
                      style={{
                        fontSize: '0.8rem',
                        color: item.ready ? 'var(--ok, #0f766e)' : 'var(--muted)',
                        fontWeight: 650,
                      }}
                    >
                      {item.ready ? 'ready' : 'pending'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.05rem' }}>Capabilities</h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.5rem' }}>
              {engine.capabilities.map((cap) => (
                <li
                  key={cap.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    flexWrap: 'wrap',
                    padding: '0.55rem 0',
                    borderTop: '1px solid var(--line)',
                    fontSize: '0.9rem',
                  }}
                >
                  <span>
                    {cap.name}{' '}
                    <span style={{ color: 'var(--muted)' }}>· {cap.api}</span>
                  </span>
                  <span className="vl-code" style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                    {cap.status}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="vl-panel" style={{ padding: '1.25rem' }}>
            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.05rem' }}>Workspace credential notes</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: '0 0 1rem' }}>
              Store ops notes for this org (who rotated keys, which Fly app, residency sign-off). JSON content is saved
              with each record.
            </p>
            <form onSubmit={onCreate} style={{ display: 'grid', gap: '0.65rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                <input
                  className="vl-field"
                  value={kind}
                  onChange={(e) => setKind(e.target.value)}
                  placeholder="kind (note, rotation, unlock…)"
                  style={{ flex: '1 1 10rem' }}
                  required
                />
                <input
                  className="vl-field"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Title"
                  style={{ flex: '2 1 16rem' }}
                  required
                />
              </div>
              <input
                className="vl-field"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Optional summary"
              />
              <div>
                <button type="submit" className="vl-btn vl-btn-primary" disabled={busy}>
                  {busy ? 'Saving…' : 'Add note'}
                </button>
              </div>
            </form>

            {records.length === 0 ? (
              <p style={{ color: 'var(--muted)', margin: 0 }}>No credential notes yet.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.55rem' }}>
                {records.map((row) => {
                  const open = expandedId === row.id;
                  return (
                    <li key={row.id} style={{ padding: '0.65rem 0', borderTop: '1px solid var(--line)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>
                            {row.title}{' '}
                            <span style={{ color: 'var(--muted)', fontWeight: 500, fontSize: '0.85rem' }}>· {row.kind}</span>
                          </div>
                          {row.summary ? (
                            <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>{row.summary}</div>
                          ) : null}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="vl-code" style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                            {formatDateTime(row.createdAt ?? row.updatedAt)}
                          </div>
                          {row.content ? (
                            <button
                              type="button"
                              onClick={() => setExpandedId(open ? null : row.id)}
                              style={{
                                marginTop: '0.35rem',
                                fontSize: '0.8rem',
                                color: 'var(--accent)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0,
                              }}
                            >
                              {open ? 'Hide JSON' : 'Show JSON'}
                            </button>
                          ) : null}
                        </div>
                      </div>
                      {open && row.content ? (
                        <pre
                          className="vl-code"
                          style={{
                            margin: '0.65rem 0 0',
                            padding: '0.75rem',
                            background: 'var(--bg-soft)',
                            borderRadius: 10,
                            overflow: 'auto',
                            fontSize: '0.8rem',
                          }}
                        >
                          {JSON.stringify(row.content, null, 2)}
                        </pre>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {engine.note ? (
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>{engine.note}</p>
          ) : null}
        </div>
      ) : null}
    </AppShell>
  );
}

function labelize(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());
}
