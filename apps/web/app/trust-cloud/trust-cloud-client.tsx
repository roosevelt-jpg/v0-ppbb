'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import { CatalogConsole, type CatalogRow } from '@/components/catalog-console';

type Bundle = {
  product: string;
  note: string;
  honesty: Record<string, unknown>;
  safety?: { note?: string } & Record<string, unknown>;
  products?: CatalogRow[];
};

export function TrustCloudClient() {
  const [data, setData] = useState<Bundle | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void apiFetch<Bundle>('/v1/trust-cloud/products')
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <AppShell>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.85rem', fontWeight: 720, letterSpacing: '-0.03em', margin: '0 0 0.35rem' }}>
        Trust Cloud
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}>
        Enforcement and governance layer over Policy Runtime, AgentOps, Continuous Learning, and Volume 12 consent —
        not Okta, GRC, certification, or SIEM OS.
      </p>
      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}
      {!data && !error ? <p style={{ color: 'var(--muted)' }}>Loading…</p> : null}
      {data ? (
        <CatalogConsole
          note={data.note}
          safetyNote={data.safety?.note ? String(data.safety.note) : undefined}
          honesty={data.honesty}
          sections={[{ title: 'Products', rows: data.products ?? [] }]}
        />
      ) : null}
    </AppShell>
  );
}
