'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import { CatalogConsole, type CatalogRow } from '@/components/catalog-console';

type Overview = {
  product?: string;
  note?: string;
  honesty?: Record<string, unknown>;
  safety?: { note?: string } & Record<string, unknown>;
  architecture?: { note?: string } & Record<string, unknown>;
  products?: CatalogRow[];
  capabilities?: CatalogRow[];
  buses?: CatalogRow[];
  portfolio?: CatalogRow[];
  links?: Record<string, string>;
};

export function ContextFabricClient() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void apiFetch<Overview>('/v1/context-fabric/products')
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

  const linkRows: CatalogRow[] = Object.entries(data?.links ?? {}).map(([k, v]) => ({
    id: k,
    name: k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()),
    console: typeof v === 'string' && v.startsWith('/') ? v : null,
    notes: String(v ?? ''),
  }));

  return (
    <AppShell>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.85rem', fontWeight: 720, letterSpacing: '-0.03em', margin: '0 0 0.35rem' }}>
        Context Fabric
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}>
        Cross-cloud context router over Context Runtime.
      </p>
      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}
      {!data && !error ? <p style={{ color: 'var(--muted)' }}>Loading…</p> : null}
      {data ? (
        <CatalogConsole
          note={data.note}
          safetyNote={data.safety?.note ? String(data.safety.note) : data.architecture?.note ? String(data.architecture.note) : undefined}
          honesty={data.honesty}
          sections={[
            { title: 'Products', rows: data.products ?? [] },
            { title: 'Capabilities', rows: data.capabilities ?? [] },
            { title: 'Buses', rows: data.buses ?? [] },
            { title: 'Portfolio', rows: data.portfolio ?? [] },
            { title: 'Links', rows: linkRows },
          ]}
          backHref="/ai-fabric"
          backLabel="AI Fabric"
        />
      ) : null}
    </AppShell>
  );
}
