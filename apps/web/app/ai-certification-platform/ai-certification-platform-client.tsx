'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { resolveApiToken } from '@/lib/dev-auth';
import { AppShell } from '@/components/app-shell';

type Engine = {
  product: string;
  note: string;
  honesty: Record<string, boolean | string>;
  safety?: { note?: string } & Record<string, unknown>;
  capabilities?: Array<Record<string, unknown>>;
  products?: Array<Record<string, unknown>>;
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

export function AiCertificationPlatformClient() {
  const { getToken, isLoaded } = useAuth();
  const [data, setData] = useState<Engine | null>(null);
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState('enterprise_risk');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void apiFetch<Engine>('/v1/ai-certification-platform/engine')
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    void (async () => {
      try {
        const token = await resolveApiToken(getToken);
        if (!token) return;
        const res = await apiFetch<{ records: RecordRow[] }>('/v1/ai-certification-platform/records', { token });
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
      if (!token) throw new Error('Not signed in — use /dev-login');
      await apiFetch('/v1/ai-certification-platform/records', {
        token,
        method: 'POST',
        body: JSON.stringify({ kind, title, summary: 'Created from VGAS console' }),
      });
      const res = await apiFetch<{ records: RecordRow[] }>('/v1/ai-certification-platform/records', { token });
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
        AI Certification Platform
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}>
        VL-365 — VerbaLab VGAS console. Internal business tooling; not external industry recognition or third-party accreditation.
      </p>
      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}
      {!data && !error ? <p style={{ color: 'var(--muted)' }}>Loading…</p> : null}
      {data ? (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          <p style={{ margin: 0, color: 'var(--muted)' }}>{data.note}</p>
          {data.safety?.note ? (
            <p style={{ margin: 0, borderLeft: '3px solid #0f766e', paddingLeft: '0.85rem', color: 'var(--muted)' }}>
              {String(data.safety.note)}
            </p>
          ) : null}
          <pre style={{ margin: 0, padding: '1rem', background: 'var(--surface)', overflow: 'auto', fontSize: '0.78rem' }}>
            {JSON.stringify({ honesty: data.honesty, capabilities: data.capabilities, products: data.products }, null, 2)}
          </pre>
          <section className="vl-panel" style={{ padding: '1.2rem', display: 'grid', gap: '0.75rem' }}>
            <h2 style={{ margin: 0, fontSize: '1rem' }}>Records</h2>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.55rem' }}>
              {records.map((r) => (
                <li key={r.id} style={{ borderTop: '1px solid var(--line)', paddingTop: '0.55rem' }}>
                  <strong>{r.title}</strong> 
                  <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                    {r.kind} · {r.status}
                  </span>
                  {r.summary ? <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.88rem' }}>{r.summary}</p> : null}
                </li>
              ))}
              {!records.length ? <li style={{ color: 'var(--muted)' }}>Sign in via /dev-login to load seeded VGAS records.</li> : null}
            </ul>
            <form onSubmit={onCreate} style={{ display: 'grid', gap: '0.55rem', marginTop: '0.5rem' }}>
              <label className="vl-label">
                Kind
                <input className="vl-field" value={kind} onChange={(e) => setKind(e.target.value)} />
              </label>
              <label className="vl-label">
                Title
                <input className="vl-field" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </label>
              <button type="submit" className="vl-btn vl-btn-primary" disabled={busy} style={{ justifySelf: 'start' }}>
                {busy ? 'Saving…' : 'Add record'}
              </button>
            </form>
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}
