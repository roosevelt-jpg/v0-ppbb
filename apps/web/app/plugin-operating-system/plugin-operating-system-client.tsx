'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import { CatalogConsole, type CatalogRow } from '@/components/catalog-console';

type Engine = {
  product?: string;
  note: string;
  honesty?: Record<string, unknown>;
  safety?: { note?: string } & Record<string, unknown>;
  products?: CatalogRow[];
  capabilities?: CatalogRow[];
  findings?: CatalogRow[];
  packages?: CatalogRow[];
  records?: CatalogRow[];
  routesTo?: Array<Record<string, unknown>>;
};

export function PluginOperatingSystemClient() {
  const [data, setData] = useState<Engine | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void apiFetch<Engine>('/v1/plugin-operating-system/engine')
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

  const routeRows: CatalogRow[] = (data?.routesTo ?? []).map((r, i) => ({
    id: String(r.module ?? r.path ?? i),
    name: String(r.role ?? r.module ?? r.path ?? 'Route'),
    notes: String(r.path ?? ''),
    console: typeof r.path === 'string' && String(r.path).startsWith('/') ? String(r.path) : null,
  }));

  return (
    <AppShell>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.85rem', fontWeight: 720, letterSpacing: '-0.03em', margin: '0 0 0.35rem' }}>
        Plugin Operating System
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}>
        VerbaLab Plugin Operating System console in VAIOS (unifying orchestration layer).
      </p>
      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}
      {!data && !error ? <p style={{ color: 'var(--muted)' }}>Loading…</p> : null}
      {data ? (
        <CatalogConsole
          note={data.note}
          safetyNote={data.safety?.note ? String(data.safety.note) : undefined}
          honesty={data.honesty}
          sections={[
            { title: 'Products', rows: data.products ?? [] },
            { title: 'Capabilities', rows: data.capabilities ?? [] },
            { title: 'Findings', rows: (data.findings ?? []).map((f) => ({
              ...f,
              name: String(f.packageName ?? f.name ?? f.id),
              status: String(f.severity ?? f.status ?? ''),
              notes: String(f.summary ?? f.notes ?? ''),
            })) },
            { title: 'Packages', rows: (data.packages ?? []).map((p) => ({
              ...p,
              id: String(p.name ?? p.id),
              name: String(p.name ?? p.id),
              notes: String(p.path ?? p.notes ?? ''),
            })) },
            { title: 'Routes', rows: routeRows },
          ]}
          backHref="/vaios"
          backLabel="VAIOS"
        />
      ) : null}
    </AppShell>
  );
}
