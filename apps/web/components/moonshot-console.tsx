'use client';

import { useAuth } from '@clerk/nextjs';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { resolveApiToken } from '@/lib/dev-auth';
import { AppShell } from '@/components/app-shell';
import { CatalogConsole, type CatalogRow } from '@/components/catalog-console';

export type MoonshotAction = {
  id: string;
  label: string;
  path: string;
  method?: 'POST' | 'GET';
  fields?: Array<{ name: string; label: string; placeholder?: string; type?: 'text' | 'textarea' | 'checkbox' }>;
  buildBody?: (values: Record<string, string>) => Record<string, unknown>;
};

type Props = {
  title: string;
  apiBase: string;
  actions: MoonshotAction[];
};

type Engine = {
  title?: string;
  blurb?: string;
  note?: string;
  honesty?: Record<string, unknown>;
  capabilities?: CatalogRow[];
  [key: string]: unknown;
};

export function MoonshotConsole({ title, apiBase, actions }: Props) {
  const { getToken, isLoaded } = useAuth();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [overview, setOverview] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [activeAction, setActiveAction] = useState(actions[0]?.id ?? '');
  const [values, setValues] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const token = await resolveApiToken(getToken);
    if (!token) throw new Error('Sign in to use this product');
    const [eng, ov] = await Promise.all([
      apiFetch<Engine>(`${apiBase}/engine`, { token }),
      apiFetch<Record<string, unknown>>(`${apiBase}/overview`, { token }),
    ]);
    setEngine(eng);
    setOverview(ov);
  }, [apiBase, getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  const action = actions.find((a) => a.id === activeAction) ?? actions[0];

  async function onRun(event: FormEvent) {
    event.preventDefault();
    if (!action) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const token = await resolveApiToken(getToken);
      if (!token) throw new Error('Sign in required');
      const method = action.method ?? 'POST';
      const path = action.path.startsWith('/v1/') ? action.path : `${apiBase}/${action.path}`;
      const out =
        method === 'GET'
          ? await apiFetch<unknown>(path, { method: 'GET', token })
          : await apiFetch<unknown>(path, {
              method: 'POST',
              token,
              body: JSON.stringify(action.buildBody ? action.buildBody(values) : { ...values }),
            });
      setResult(JSON.stringify(out, null, 2));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', fontSize: '2rem' }}>
        {engine?.title ?? title}
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0.5rem 0 1.25rem', maxWidth: '46rem' }}>
        {engine?.blurb ?? ''}
      </p>

      {error ? <p style={{ color: 'var(--bad)' }}>{error}</p> : null}

      <CatalogConsole
        note={typeof engine?.honesty?.note === 'string' ? String(engine.honesty.note) : undefined}
        honesty={engine?.honesty}
        sections={[
          {
            title: 'Capabilities',
            rows: (engine?.capabilities ?? []) as CatalogRow[],
          },
        ]}
        statusChips={[
          { label: 'API', value: apiBase },
          {
            label: 'Activity',
            value: String((overview?.activity as { count?: number } | undefined)?.count ?? 0),
          },
        ]}
      />

      <section className="vl-panel" style={{ padding: '1.25rem', marginTop: '1.25rem', maxWidth: '46rem' }}>
        <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.1rem' }}>Try it</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '0.85rem' }}>
          {actions.map((a) => (
            <button
              key={a.id}
              type="button"
              className={`vl-btn ${a.id === action?.id ? 'vl-btn-primary' : 'vl-btn-secondary'}`}
              onClick={() => {
                setActiveAction(a.id);
                setResult(null);
              }}
              disabled={busy}
            >
              {a.label}
            </button>
          ))}
        </div>
        {action ? (
          <form onSubmit={onRun} style={{ display: 'grid', gap: '0.65rem' }}>
            {(action.fields ?? []).map((field) =>
              field.type === 'checkbox' ? (
                <label key={field.name} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={values[field.name] === 'true'}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [field.name]: e.target.checked ? 'true' : 'false' }))
                    }
                  />
                  {field.label}
                </label>
              ) : field.type === 'textarea' ? (
                <label key={field.name} style={{ display: 'grid', gap: '0.3rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{field.label}</span>
                  <textarea
                    className="vl-input"
                    rows={4}
                    value={values[field.name] ?? ''}
                    placeholder={field.placeholder}
                    onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                  />
                </label>
              ) : (
                <label key={field.name} style={{ display: 'grid', gap: '0.3rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{field.label}</span>
                  <input
                    className="vl-input"
                    value={values[field.name] ?? ''}
                    placeholder={field.placeholder}
                    onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                  />
                </label>
              ),
            )}
            <button type="submit" className="vl-btn vl-btn-primary" disabled={busy}>
              {busy ? 'Running…' : `Run ${action.label}`}
            </button>
          </form>
        ) : null}
        {result ? (
          <pre
            style={{
              marginTop: '0.85rem',
              padding: '0.85rem',
              background: 'var(--bg-soft)',
              border: '1px solid var(--line)',
              borderRadius: '0.5rem',
              overflow: 'auto',
              fontSize: '0.8rem',
            }}
          >
            {result}
          </pre>
        ) : null}
      </section>
    </AppShell>
  );
}
