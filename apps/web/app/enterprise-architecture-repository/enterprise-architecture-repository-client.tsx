'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { resolveApiToken } from '@/lib/dev-auth';
import { AppShell } from '@/components/app-shell';
import { CatalogConsole, type CatalogRow } from '@/components/catalog-console';

type Engine = {
  product: string;
  note: string;
  honesty: Record<string, unknown>;
  safety?: { note?: string } & Record<string, unknown>;
  capabilities?: CatalogRow[];
};

type RecordRow = {
  id: string;
  domain: string;
  kind: string;
  title: string;
  status: string;
  summary: string;
  ownerLabel?: string | null;
};

export function EnterpriseArchitectureRepositoryClient() {
  const { getToken, isLoaded } = useAuth();
  const [data, setData] = useState<Engine | null>(null);
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState('capability_model');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void apiFetch<Engine>('/v1/enterprise-architecture-repository/engine')
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    void (async () => {
      try {
        const token = await resolveApiToken(getToken);
        if (!token) return;
        const res = await apiFetch<{ records: RecordRow[] }>(
          '/v1/enterprise-architecture-repository/records',
          { token },
        );
        setRecords(res.records ?? []);
      } catch {
        /* public engine still useful without auth */
      }
    })();
  }, [isLoaded, getToken]);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const token = await resolveApiToken(getToken);
      if (!token) throw new Error('Sign in to add architecture records');
      await apiFetch('/v1/enterprise-architecture-repository/records', {
        token,
        method: 'POST',
        body: JSON.stringify({ kind, title, summary: 'Created from architecture repository console' }),
      });
      const res = await apiFetch<{ records: RecordRow[] }>(
        '/v1/enterprise-architecture-repository/records',
        { token },
      );
      setRecords(res.records ?? []);
      setTitle('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.85rem', fontWeight: 720, letterSpacing: '-0.03em', margin: '0 0 0.35rem' }}>
        Enterprise Architecture Repository
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}>
        Capability, information, application, and technology architecture artifacts with ArchiMate views.
      </p>
      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}
      {!data && !error ? <p style={{ color: 'var(--muted)' }}>Loading…</p> : null}
      {data ? (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          <CatalogConsole
            note={data.note}
            safetyNote={data.safety?.note ? String(data.safety.note) : undefined}
            honesty={data.honesty}
            sections={[
              { title: 'Capabilities', rows: data.capabilities ?? [] },
              {
                title: 'Records',
                rows: records.map((r) => ({
                  id: r.id,
                  name: r.title,
                  status: r.status,
                  kind: r.kind,
                  notes: r.summary,
                })),
              },
            ]}
            backHref="/corporate-operating-system"
            backLabel="Corporate Operating System"
          />
          <section style={{ display: 'grid', gap: '0.75rem' }}>
            <h2 style={{ margin: 0, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)' }}>
              Add record
            </h2>
            <form onSubmit={onCreate} style={{ display: 'grid', gap: '0.55rem' }}>
              <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.9rem' }}>
                Kind
                <input value={kind} onChange={(e) => setKind(e.target.value)} style={{ padding: '0.55rem 0.7rem' }} />
              </label>
              <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.9rem' }}>
                Title
                <input value={title} onChange={(e) => setTitle(e.target.value)} required style={{ padding: '0.55rem 0.7rem' }} />
              </label>
              <button type="submit" disabled={busy} style={{ justifySelf: 'start', padding: '0.55rem 0.9rem' }}>
                {busy ? 'Saving…' : 'Add record'}
              </button>
            </form>
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}
