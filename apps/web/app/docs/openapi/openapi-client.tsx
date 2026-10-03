'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { API_URL } from '@/lib/api';
import { JsonExplorer } from '@/components/json-explorer';

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'options' | 'head' | 'trace';

type OpenApiOperation = {
  summary?: string;
  description?: string;
  operationId?: string;
  tags?: string[];
  parameters?: unknown[];
  requestBody?: unknown;
  responses?: Record<string, unknown>;
  security?: unknown[];
};

type OpenApiSpec = {
  openapi?: string;
  info?: { title?: string; version?: string; description?: string };
  paths?: Record<string, Partial<Record<HttpMethod, OpenApiOperation>> & Record<string, unknown>>;
  components?: Record<string, unknown>;
  servers?: Array<{ url?: string; description?: string }>;
};

const METHODS: HttpMethod[] = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace'];

type EndpointRow = {
  id: string;
  method: HttpMethod;
  path: string;
  summary: string;
  operation: OpenApiOperation;
};

export function OpenApiClient() {
  const [spec, setSpec] = useState<OpenApiSpec | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'endpoints' | 'json'>('endpoints');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    void fetch(`${API_URL}/v1/openapi.json`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`OpenAPI HTTP ${res.status}`);
        const json = (await res.json()) as OpenApiSpec;
        setSpec(json);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const endpoints = useMemo(() => {
    const rows: EndpointRow[] = [];
    for (const [path, item] of Object.entries(spec?.paths ?? {})) {
      for (const method of METHODS) {
        const operation = item?.[method];
        if (!operation || typeof operation !== 'object') continue;
        rows.push({
          id: `${method}:${path}`,
          method,
          path,
          summary: String(operation.summary ?? operation.operationId ?? ''),
          operation,
        });
      }
    }
    rows.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));
    return rows;
  }, [spec]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return endpoints;
    return endpoints.filter(
      (row) =>
        row.path.toLowerCase().includes(q) ||
        row.method.includes(q) ||
        row.summary.toLowerCase().includes(q) ||
        (row.operation.operationId ?? '').toLowerCase().includes(q) ||
        (row.operation.tags ?? []).some((t) => String(t).toLowerCase().includes(q)),
    );
  }, [endpoints, query]);

  const selected = filtered.find((row) => row.id === selectedId) ?? filtered[0] ?? null;

  useEffect(() => {
    if (!selectedId && filtered[0]) setSelectedId(filtered[0].id);
  }, [filtered, selectedId]);

  const selectedPayload = selected
    ? {
        method: selected.method.toUpperCase(),
        path: selected.path,
        operationId: selected.operation.operationId ?? null,
        summary: selected.operation.summary ?? null,
        description: selected.operation.description ?? null,
        tags: selected.operation.tags ?? [],
        parameters: selected.operation.parameters ?? [],
        requestBody: selected.operation.requestBody ?? null,
        responses: selected.operation.responses ?? {},
        security: selected.operation.security ?? [],
      }
    : null;

  return (
    <div className="vl-fade-up" style={{ maxWidth: '72rem', margin: '0 auto', padding: '2.25rem 1.5rem 4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <Link
          href="/"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 760, textDecoration: 'none', fontSize: '1.15rem' }}
        >
          VerbaLab
        </Link>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/docs" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
            Docs
          </Link>
          <Link href="/developers" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
            Developers
          </Link>
          <Link href="/playground" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
            Playground
          </Link>
          <a
            href={`${API_URL}/v1/openapi.json`}
            className="vl-btn vl-btn-secondary"
            style={{ textDecoration: 'none', padding: '0.45rem 0.9rem' }}
            download
          >
            Download raw JSON
          </a>
        </div>
      </div>

      <h1
        style={{
          margin: '1.75rem 0 0',
          fontFamily: 'var(--font-display)',
          letterSpacing: '-0.03em',
          fontSize: '2.2rem',
        }}
      >
        OpenAPI explorer
      </h1>
      <p style={{ color: 'var(--muted)', lineHeight: 1.65, maxWidth: '42rem' }}>
        Browse every VerbaLab API field as structured JSON. Expand nodes, copy paths or values, and hide values when
        sharing your screen. Spec:{' '}
        <code className="vl-code">
          {spec?.info?.title ?? 'VerbaLab API'} {spec?.info?.version ? `v${spec.info.version}` : ''}
        </code>
        .
      </p>

      {error ? (
        <p style={{ color: 'var(--bad)' }}>Could not load OpenAPI ({error}). Is the API running at {API_URL}?</p>
      ) : null}
      {!spec && !error ? <p style={{ color: 'var(--muted)' }}>Loading OpenAPI…</p> : null}

      {spec ? (
        <div style={{ marginTop: '1.25rem', display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <TabButton active={tab === 'endpoints'} onClick={() => setTab('endpoints')}>
              Endpoints ({endpoints.length})
            </TabButton>
            <TabButton active={tab === 'json'} onClick={() => setTab('json')}>
              Full JSON
            </TabButton>
          </div>

          {tab === 'endpoints' ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(16rem, 22rem) minmax(0, 1fr)',
                gap: '1rem',
                alignItems: 'start',
              }}
              className="openapi-split"
            >
              <aside
                className="vl-panel"
                style={{ padding: '0.85rem', position: 'sticky', top: '1rem', maxHeight: '78vh', overflow: 'auto' }}
              >
                <label className="vl-label" style={{ display: 'grid', gap: '0.35rem' }}>
                  Search APIs
                  <input
                    className="vl-field"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="/v1/translate, post, knowledge…"
                  />
                </label>
                <ul style={{ listStyle: 'none', margin: '0.85rem 0 0', padding: 0, display: 'grid', gap: '0.35rem' }}>
                  {filtered.map((row) => {
                    const active = selected?.id === row.id;
                    return (
                      <li key={row.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(row.id)}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            border: active
                              ? '1px solid color-mix(in srgb, var(--ink) 28%, transparent)'
                              : '1px solid transparent',
                            background: active ? 'var(--bg-soft, var(--surface))' : 'transparent',
                            borderRadius: 8,
                            padding: '0.45rem 0.55rem',
                            cursor: 'pointer',
                            color: 'inherit',
                            font: 'inherit',
                          }}
                        >
                          <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'baseline' }}>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                letterSpacing: '0.04em',
                                textTransform: 'uppercase',
                                color: methodColor(row.method),
                                minWidth: '3.2rem',
                              }}
                            >
                              {row.method}
                            </span>
                            <code style={{ fontSize: '0.82rem' }}>{row.path}</code>
                          </div>
                          {row.summary ? (
                            <div style={{ marginTop: 2, color: 'var(--muted)', fontSize: '0.8rem' }}>{row.summary}</div>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {!filtered.length ? (
                  <p style={{ color: 'var(--muted)', margin: '0.75rem 0 0' }}>No endpoints match that search.</p>
                ) : null}
              </aside>

              <section style={{ display: 'grid', gap: '0.85rem', minWidth: 0 }}>
                {selected && selectedPayload ? (
                  <>
                    <div className="vl-panel" style={{ padding: '1.1rem 1.25rem' }}>
                      <div style={{ display: 'flex', gap: '0.55rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 740,
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                            color: methodColor(selected.method),
                          }}
                        >
                          {selected.method}
                        </span>
                        <code className="vl-code" style={{ fontSize: '1rem' }}>
                          {selected.path}
                        </code>
                      </div>
                      {selected.summary ? (
                        <p style={{ margin: '0.55rem 0 0', color: 'var(--muted)', lineHeight: 1.55 }}>
                          {selected.summary}
                        </p>
                      ) : null}
                      {selected.operation.operationId ? (
                        <p style={{ margin: '0.35rem 0 0', color: 'var(--muted)', fontSize: '0.88rem' }}>
                          operationId: <code className="vl-code">{selected.operation.operationId}</code>
                        </p>
                      ) : null}
                    </div>
                    <JsonExplorer
                      data={selectedPayload}
                      rootLabel={`${selected.method.toUpperCase()} ${selected.path}`}
                      defaultExpandDepth={2}
                      initialChildLimit={60}
                    />
                  </>
                ) : (
                  <p style={{ color: 'var(--muted)' }}>Select an endpoint to inspect its JSON fields.</p>
                )}
              </section>
            </div>
          ) : (
            <JsonExplorer data={spec} rootLabel="openapi" defaultExpandDepth={1} initialChildLimit={50} />
          )}
        </div>
      ) : null}

      <style>{`
        @media (max-width: 900px) {
          .openapi-split {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={active ? 'vl-btn vl-btn-primary' : 'vl-btn vl-btn-secondary'}
      style={{ padding: '0.45rem 0.9rem' }}
    >
      {children}
    </button>
  );
}

function methodColor(method: string): string {
  switch (method) {
    case 'get':
      return '#0f766e';
    case 'post':
      return '#1d4ed8';
    case 'put':
      return '#a16207';
    case 'patch':
      return '#7c3aed';
    case 'delete':
      return '#b42318';
    default:
      return 'var(--muted)';
  }
}
