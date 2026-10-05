'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import { CatalogConsole, type CatalogRow } from '@/components/catalog-console';
import { hidePhaseIds } from '@/lib/ui-copy';

type Scenario = {
  id: string;
  amountCents: number;
  feeBps: number;
  expectedApplicationFeeCents: number;
  expectedPublisherNetCents: number;
  handCheckPassed: boolean;
};

type Engine = {
  product: string;
  note: string;
  safety?: { note?: string };
  honesty?: Record<string, unknown>;
  capabilities?: CatalogRow[];
  royalty?: {
    ecosystemHubFeeBps: number;
    contentMarketplaceFeeBpsDefault: number;
    formula: string;
  };
};

export function CreatorEconomyClient() {
  const [engine, setEngine] = useState<Engine | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [allPassed, setAllPassed] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([
      apiFetch<Engine>('/v1/creator-economy/engine'),
      apiFetch<{ scenarios: Scenario[]; allHandChecksPassed: boolean }>(
        '/v1/creator-economy/royalty/scenarios',
      ),
    ])
      .then(([eng, royalty]) => {
        setEngine(eng);
        setScenarios(royalty.scenarios ?? []);
        setAllPassed(royalty.allHandChecksPassed);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const scenarioRows: CatalogRow[] = scenarios.map((s) => ({
    id: s.id,
    name: s.id,
    status: s.handCheckPassed ? 'passed' : 'review',
    notes: `Gross $${(s.amountCents / 100).toFixed(2)} · fee ${s.feeBps} bps · app fee $${(s.expectedApplicationFeeCents / 100).toFixed(2)} · publisher net $${(s.expectedPublisherNetCents / 100).toFixed(2)}`,
  }));

  const chips = [
    engine?.royalty
      ? { label: 'Hub fee', value: `${engine.royalty.ecosystemHubFeeBps} bps` }
      : null,
    engine?.royalty
      ? {
          label: 'Content market fee',
          value: `${engine.royalty.contentMarketplaceFeeBpsDefault} bps`,
        }
      : null,
    allPassed != null ? { label: 'Royalty checks', value: allPassed ? 'passed' : 'review' } : null,
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
        Creator Economy
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}>
        Royalty math and Connect payouts over marketplace sales — Stripe Connect Express, never a card
        vault.
      </p>
      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}
      {!engine && !error ? <p style={{ color: 'var(--muted)' }}>Loading…</p> : null}
      {engine ? (
        <CatalogConsole
          note={hidePhaseIds(engine.note)}
          safetyNote={engine.safety?.note ? hidePhaseIds(String(engine.safety.note)) : undefined}
          honesty={engine.honesty}
          statusChips={chips}
          sections={[
            { title: 'Capabilities', rows: engine.capabilities ?? [] },
            { title: 'Royalty scenarios', rows: scenarioRows },
          ]}
          backHref="/ecosystem-cloud"
          backLabel="Ecosystem Cloud"
        />
      ) : null}
    </AppShell>
  );
}
