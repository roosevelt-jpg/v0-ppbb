'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { StatusSuffix } from '@/components/status-suffix';
import { resolveApiToken } from '@/lib/dev-auth';
import { AppShell } from '@/components/app-shell';

type Capability = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  notes: string;
};

type Engine = {
  product: string;
  note: string;
  capabilities: Capability[];
  honesty: {
    confluenceOs: boolean;
    sharePointParity: boolean;
    approvalWorkflow: boolean;
    multimodalMediaIngest: boolean;
    orgWorkspaceScoped: boolean;
    extendsVl062: boolean;
  };
};

type Analytics = {
  documents: number;
  ready: number;
  failed: number;
  chunks: number;
};

type Doc = {
  id: string;
  filename: string;
  status: string;
  tags?: string[];
  version?: number;
  chunkCount?: number;
};

export function KnowledgeBaseClient() {
  const { getToken, isLoaded } = useAuth();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const token = await resolveApiToken(getToken);
    if (!token) throw new Error('Not signed in');
    const [eng, ana, list] = await Promise.all([
      apiFetch<Engine>('/v1/knowledge-base/engine', { token }),
      apiFetch<Analytics>('/v1/knowledge-base/analytics', { token }),
      apiFetch<{ data: Doc[] } | Doc[]>('/v1/knowledge-base/documents', { token }),
    ]);
    setEngine(eng);
    setAnalytics(ana);
    setDocs(Array.isArray(list) ? list : list.data ?? []);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  async function approve(id: string, status: 'approved' | 'rejected' | 'pending') {
    setLoading(true);
    setError(null);
    try {
      const token = await resolveApiToken(getToken);
      if (!token) throw new Error('Not signed in');
      const body = await apiFetch<{ documentId: string; approval: string; note: string }>(
        `/v1/knowledge-base/documents/${id}/approve`,
        { token, method: 'POST', body: { status } },
      );
      setResult(JSON.stringify(body, null, 2));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approval failed');
    } finally {
      setLoading(false);
    }
  }

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
        Enterprise Knowledge Base
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}>
        Org/workspace-scoped document store over with light approval. Upload on{' '}
        <Link href="/knowledge">Knowledge / RAG</Link>. Not a Confluence/SharePoint OS.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}
      {!engine && !error ? <p style={{ color: 'var(--muted)' }}>Loading…</p> : null}

      {engine ? (
        <div style={{ display: 'grid', gap: '1.75rem' }}>
          {analytics ? (
            <p style={{ margin: 0, fontWeight: 600 }}>
              Docs {analytics.documents} · Ready {analytics.ready} · Failed {analytics.failed} ·
              Chunks {analytics.chunks}
            </p>
          ) : null}
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>{engine.note}</p>

          <section>
            <h2 style={label}>Honesty</h2>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.55 }}>
              Org/workspace scoped {engine.honesty.orgWorkspaceScoped ? 'yes' : 'no'} · Extends
              {engine.honesty.extendsVl062 ? 'yes' : 'no'} · Confluence OS{' '}
              {engine.honesty.confluenceOs ? 'yes' : 'no'} · SharePoint parity{' '}
              {engine.honesty.sharePointParity ? 'yes' : 'no'} · Approval workflow{' '}
              {engine.honesty.approvalWorkflow ? 'yes' : 'no'} · Media ingest{' '}
              {engine.honesty.multimodalMediaIngest ? 'yes' : 'no'}
            </p>
          </section>

          <section>
            <h2 style={label}>Documents · light approval</h2>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {docs.map((d) => (
                <li
                  key={d.id}
                  style={{
                    borderTop: '1px solid var(--line)',
                    padding: '0.55rem 0',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <strong>{d.filename}</strong>{' '}
                    <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                      · {d.status}
                      {d.version != null ? ` · v${d.version}` : ''}
                      {d.tags?.length ? ` · ${d.tags.join(', ')}` : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      type="button"
                      disabled={loading}
                      style={tiny}
                      onClick={() => void approve(d.id, 'approved')}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      style={tiny}
                      onClick={() => void approve(d.id, 'rejected')}
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      style={tiny}
                      onClick={() => void approve(d.id, 'pending')}
                    >
                      Pending
                    </button>
                  </div>
                </li>
              ))}
              {docs.length === 0 ? (
                <li style={{ color: 'var(--muted)' }}>
                  No documents yet — ingest via <Link href="/knowledge">Knowledge / RAG</Link>.
                </li>
              ) : null}
            </ul>
            {result ? <pre style={pre}>{result}</pre> : null}
          </section>

          <section>
            <h2 style={label}>Links</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
              <Link href="/knowledge" style={secondary}>
                Ingest / RAG / OCR
              </Link>
              <Link href="/knowledge-cloud" style={secondary}>
                Knowledge Cloud
              </Link>
              <Link href="/vector-cloud" style={secondary}>
                Vector Cloud
              </Link>
            </div>
          </section>

          <section>
            <h2 style={label}>Capabilities</h2>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {engine.capabilities.map((c) => (
                <li key={c.id} style={{ borderTop: '1px solid var(--line)', padding: '0.55rem 0' }}>
                  <strong>{c.name}</strong>{' '}
                  <StatusSuffix status={c.status} />
                  <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{c.notes}</div>
                </li>
              ))}
            </ul>
          </section>
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
  margin: '0 0 0.5rem',
};

const secondary: React.CSSProperties = {
  display: 'inline-block',
  padding: '0.45rem 0.75rem',
  border: '1px solid var(--line)',
  borderRadius: '0.4rem',
  color: 'var(--ink)',
  textDecoration: 'none',
  fontSize: '0.85rem',
  fontWeight: 600,
};

const tiny: React.CSSProperties = {
  padding: '0.3rem 0.55rem',
  border: '1px solid var(--line)',
  borderRadius: '0.35rem',
  background: 'transparent',
  color: 'var(--ink)',
  fontSize: '0.8rem',
  fontWeight: 600,
  cursor: 'pointer',
};

const pre: React.CSSProperties = {
  margin: '0.75rem 0 0',
  padding: '0.85rem',
  background: 'var(--surface)',
  border: '1px solid var(--line)',
  borderRadius: '0.45rem',
  overflow: 'auto',
  fontSize: '0.8rem',
};
