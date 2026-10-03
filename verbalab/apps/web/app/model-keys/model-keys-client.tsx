'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { resolveApiToken } from '@/lib/dev-auth';
import { AppShell } from '@/components/app-shell';

type ModelKeyRow = {
  id: string;
  name: string;
  prefix: string;
  kind: string;
  scopes: string[];
  revokedAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
};

type Created = {
  secret: string;
  envSnippet?: string;
  note?: string;
  kind: string;
  prefix: string;
};

export function ModelKeysClient() {
  const { getToken, isLoaded } = useAuth();
  const [keys, setKeys] = useState<ModelKeyRow[]>([]);
  const [name, setName] = useState('Voice FM serving');
  const [environment, setEnvironment] = useState<'live' | 'test'>('live');
  const [created, setCreated] = useState<Created | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guide, setGuide] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(async () => {
    const token = await resolveApiToken(getToken);
    if (!token) return;
    const rows = await apiFetch<ModelKeyRow[]>('/v1/model-keys', { token });
    setKeys(rows);
  }, [getToken]);

  useEffect(() => {
    void apiFetch<Record<string, unknown>>('/v1/model-keys/guide').then(setGuide);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setCreated(null);
    try {
      const token = await resolveApiToken(getToken);
      if (!token) throw new Error('Not signed in');
      const res = await apiFetch<Created>('/v1/model-keys', {
        method: 'POST',
        token,
        body: JSON.stringify({ name, environment, scopes: ['*'] }),
      });
      setCreated(res);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    }
  }

  async function onMintRoot() {
    setError(null);
    setCreated(null);
    try {
      const token = await resolveApiToken(getToken);
      if (!token) throw new Error('Not signed in');
      const res = await apiFetch<Created>('/v1/model-keys/platform-root', {
        method: 'POST',
        token,
        body: JSON.stringify({ name: 'Deploy VERBALAB_MODEL_API_KEY' }),
      });
      setCreated(res);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mint failed');
    }
  }

  async function onRevoke(id: string) {
    setError(null);
    try {
      const token = await resolveApiToken(getToken);
      if (!token) throw new Error('Not signed in');
      await apiFetch(`/v1/model-keys/${id}`, { method: 'DELETE', token });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Revoke failed');
    }
  }

  return (
    <AppShell>
      <p style={{ color: 'var(--muted)', margin: 0 }}>
        <Link href="/keys">Product API keys</Link> ·{' '}
        <Link href="/credentials-readiness">Credentials readiness</Link>
      </p>
      <h1 style={{ margin: '0.5rem 0 0', fontFamily: 'var(--font-display)', fontSize: '2rem' }}>
        VerbaLab model keys
      </h1>
      <p style={{ color: 'var(--muted)' }}>
        Own-model auth for Translate FM / Echo / Voice FM / Atlas — not OpenAI or ElevenLabs keys.
        Secrets are shown once.
      </p>

      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}

      {created ? (
        <div
          style={{
            border: '1px solid var(--accent, #0d9488)',
            padding: '1rem',
            marginBottom: '1rem',
            background: 'var(--surface, #f4f4f5)',
          }}
        >
          <strong>Copy now — shown once</strong>
          <pre style={{ overflow: 'auto' }}>{created.secret}</pre>
          {created.envSnippet ? (
            <>
              <p style={{ marginBottom: 0 }}>Add to deploy env:</p>
              <pre style={{ overflow: 'auto' }}>{created.envSnippet}</pre>
            </>
          ) : null}
          <p style={{ color: 'var(--muted)', marginBottom: 0 }}>{created.note}</p>
        </div>
      ) : null}

      <form onSubmit={onCreate} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Key name"
          className="vl-field"
          style={{ minWidth: 200 }}
        />
        <select
          value={environment}
          onChange={(e) => setEnvironment(e.target.value as 'live' | 'test')}
          className="vl-field"
        >
          <option value="live">vmod_live_</option>
          <option value="test">vmod_test_</option>
        </select>
        <button type="submit">Create model key</button>
        <button type="button" onClick={() => void onMintRoot()}>
          Mint platform root (VERBALAB_MODEL_API_KEY)
        </button>
      </form>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th align="left">Name</th>
            <th align="left">Prefix</th>
            <th align="left">Kind</th>
            <th align="left">Scopes</th>
            <th align="left">Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {keys.map((k) => (
            <tr key={k.id}>
              <td>{k.name}</td>
              <td>
                <code>{k.prefix}…</code>
              </td>
              <td>{k.kind}</td>
              <td>{k.scopes.join(', ')}</td>
              <td>{k.revokedAt ? 'revoked' : 'active'}</td>
              <td>
                {!k.revokedAt ? (
                  <button type="button" onClick={() => void onRevoke(k.id)}>
                    Revoke
                  </button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ marginTop: '2rem' }}>How deploy credentials work</h2>
      <pre style={{ background: 'var(--surface, #f4f4f5)', padding: 12, overflow: 'auto' }}>
        {JSON.stringify(guide, null, 2)}
      </pre>
      <p>
        Full guide: <Link href="/docs">Docs</Link> →{' '}
        <code>docs/CREDENTIALS.md</code> in the repo.
      </p>
    </AppShell>
  );
}
