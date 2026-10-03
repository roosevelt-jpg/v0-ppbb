'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { resolveApiToken } from '@/lib/dev-auth';
import { AppShell } from '@/components/app-shell';
import { CatalogConsole, type CatalogRow } from '@/components/catalog-console';
import { hidePhaseIds } from '@/lib/ui-copy';

type Listing = {
  id: string;
  title?: string;
  name?: string;
  status?: string;
  verified?: boolean;
  sandboxOnly?: boolean;
  priceCents?: number;
  ratingAverage?: number | null;
  ratingCount?: number;
  publisherName?: string | null;
  pluginVersion?: number;
  category?: string;
};

type Engine = {
  product?: string;
  note: string;
  honesty?: Record<string, unknown>;
  safety?: { note?: string } & Record<string, unknown>;
  capabilities?: CatalogRow[];
  products?: CatalogRow[];
};

export function WorkflowMarketplaceClient() {
  const { getToken, isLoaded } = useAuth();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    void (async () => {
      try {
        const token = await resolveApiToken(getToken);
        if (!token) throw new Error('Not signed in');
        const [eng, list] = await Promise.all([
          apiFetch<Engine>('/v1/workflow-marketplace/engine', { token }),
          apiFetch<{ listings: Listing[] }>('/v1/workflow-marketplace/listings', { token }).catch(() => ({ listings: [] as Listing[] })),
        ]);
        setEngine(eng);
        setListings(list.listings ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      }
    })();
  }, [isLoaded, getToken]);

  const listingRows: CatalogRow[] = listings.map((l) => ({
    id: l.id,
    name: String(l.title ?? l.name ?? l.id),
    status: String(l.status ?? (l.verified ? 'verified' : 'published')),
    notes: hidePhaseIds(
      [
        l.publisherName ? `Publisher: ${l.publisherName}` : '',
        l.pluginVersion != null ? `v${l.pluginVersion}` : '',
        l.sandboxOnly ? 'sandbox' : '',
        l.priceCents != null ? `${(l.priceCents / 100).toFixed(2)} USD` : '',
        l.ratingAverage != null ? `${l.ratingAverage}★ (${l.ratingCount ?? 0})` : '',
        l.category ?? '',
      ]
        .filter(Boolean)
        .join(' · '),
    ),
  }));

  return (
    <AppShell>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.85rem', fontWeight: 720, letterSpacing: '-0.03em', margin: '0 0 0.35rem' }}>
        Workflow Marketplace
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}>
        Buy and sell workflow listings with install entitlements and run analytics.
      </p>
      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}
      {!engine && !error ? <p style={{ color: 'var(--muted)' }}>Loading…</p> : null}
      {engine ? (
        <CatalogConsole
          note={hidePhaseIds(engine.note)}
          safetyNote={engine.safety?.note ? hidePhaseIds(String(engine.safety.note)) : undefined}
          honesty={engine.honesty}
          sections={[
            { title: 'Capabilities', rows: engine.capabilities ?? [] },
            { title: 'Products', rows: engine.products ?? [] },
            { title: 'Listings', rows: listingRows },
          ]}
          backHref="/workflow-runtime"
          backLabel="Workflow Runtime"
        />
      ) : null}
    </AppShell>
  );
}
