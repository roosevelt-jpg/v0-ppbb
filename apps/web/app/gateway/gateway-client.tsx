'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { resolveApiToken } from '@/lib/dev-auth';
import { AppShell } from '@/components/app-shell';
import { CatalogConsole, type CatalogRow } from '@/components/catalog-console';
import { hidePhaseIds } from '@/lib/ui-copy';

type Provider = {
  id: string;
  libraryName?: string;
  name?: string;
  status: string;
  features?: string[];
  configured?: boolean;
  notes: string;
};

type ProvidersRes = {
  providers: Provider[];
  capabilities?: {
    fallback?: string[];
    caching?: { responseCache: boolean };
    streaming?: boolean;
    costOptimization?: boolean;
  };
  docs?: string;
};

type Overview = ProvidersRes & {
  health?: { status: string; region: string };
  configured?: Record<string, boolean>;
  links?: Record<string, string>;
  volume?: { closes: string; note: string };
};

export function GatewayClient() {
  const { getToken, isLoaded } = useAuth();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void apiFetch<ProvidersRes>('/v1/gateway/providers')
      .then((providers) => setData(providers))
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    void (async () => {
      try {
        const token = await resolveApiToken(getToken);
        if (!token) return;
        const overview = await apiFetch<Overview>('/v1/gateway/overview', { token });
        setData(overview);
      } catch {
        /* providers already loaded */
      }
    })();
  }, [isLoaded, getToken]);

  const providerRows: CatalogRow[] = (data?.providers ?? []).map((p) => ({
    id: p.id,
    name: String(p.libraryName ?? p.name ?? p.id),
    status: p.status,
    notes: hidePhaseIds(
      [p.notes, p.configured == null ? '' : p.configured ? 'Configured' : 'Not configured', ...(p.features ?? [])]
        .filter(Boolean)
        .join(' · '),
    ),
  }));

  const linkRows: CatalogRow[] = Object.entries(data?.links ?? {}).map(([k, v]) => ({
    id: k,
    name: k,
    console: typeof v === 'string' && v.startsWith('/') ? v : null,
    notes: String(v ?? ''),
  }));

  const chips = [
    data?.health ? { label: 'Health', value: `${data.health.status} · ${data.health.region}` } : null,
    data?.capabilities?.streaming != null
      ? { label: 'Streaming', value: String(data.capabilities.streaming) }
      : null,
    data?.capabilities?.costOptimization != null
      ? { label: 'Cost optimization', value: String(data.capabilities.costOptimization) }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

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
        AI Gateway
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}>
        Thin facade over bought models — Google MT, OpenAI, optional OpenRouter chat fallback, own TTS,
        and fine-tune routes.
      </p>
      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}
      {!data && !error ? <p style={{ color: 'var(--muted)' }}>Loading…</p> : null}
      {data ? (
        <CatalogConsole
          note={data.volume?.note ? hidePhaseIds(data.volume.note) : undefined}
          statusChips={chips}
          sections={[
            { title: 'Providers', rows: providerRows },
            { title: 'Links', rows: linkRows },
          ]}
          backHref="/inference-cloud"
          backLabel="Inference Cloud"
        />
      ) : null}
    </AppShell>
  );
}
