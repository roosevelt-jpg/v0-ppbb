'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import { CatalogConsole, type CatalogRow } from '@/components/catalog-console';
import { hidePhaseIds } from '@/lib/ui-copy';

type FocusPair = {
  sourceLang: string;
  targetLang: string;
  inRegistry: boolean;
  hasGolden: boolean;
  evalStatus: 'evaluated' | 'unevaluated';
  segmentCount: number;
  exactMatchRate: number | null;
  meanCharSimilarity: number | null;
  mode: string | null;
  asOf: string | null;
};

type Coverage = {
  disclaimer: string;
  asOf: string | null;
  lastEvalMode: string | null;
  focusPairs: FocusPair[];
  languages: {
    total: number;
    strategicAfrican: number;
    codes: Array<{ code: string; name: string; tier: string; script: string }>;
  };
  countryPacks?: {
    total: number;
    note: string;
    packs: Array<{
      code: string;
      name: string;
      region: string | null;
      currencyCode: string | null;
      primaryLanguages: string[];
      api: string;
    }>;
  };
  note: string;
};

export function CoverageClient() {
  const [data, setData] = useState<Coverage | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void apiFetch<Coverage>('/v1/coverage')
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

  const focusRows: CatalogRow[] = (data?.focusPairs ?? []).map((p) => ({
    id: `${p.sourceLang}-${p.targetLang}`,
    name: `${p.sourceLang} → ${p.targetLang}`,
    status: p.evalStatus,
    notes: [
      p.inRegistry ? 'in registry' : 'missing registry language',
      p.hasGolden ? `${p.segmentCount} golden segments` : 'no golden',
      p.exactMatchRate != null ? `exact ${(p.exactMatchRate * 100).toFixed(1)}%` : '',
      p.meanCharSimilarity != null ? `char sim ${(p.meanCharSimilarity * 100).toFixed(1)}%` : '',
      p.mode ? `mode ${p.mode}` : '',
      p.asOf ? `as of ${p.asOf}` : '',
    ]
      .filter(Boolean)
      .join(' · '),
  }));

  const langRows: CatalogRow[] = (data?.languages.codes ?? []).slice(0, 40).map((l) => ({
    id: l.code,
    name: `${l.name} (${l.code})`,
    status: l.tier,
    notes: l.script,
  }));

  const packRows: CatalogRow[] = (data?.countryPacks?.packs ?? []).map((p) => ({
    id: p.code,
    name: `${p.name} (${p.code})`,
    status: p.region ?? 'country',
    api: p.api,
    notes: [
      p.api,
      p.currencyCode ? `currency ${p.currencyCode}` : '',
      p.primaryLanguages?.length ? `langs ${p.primaryLanguages.join(', ')}` : '',
    ]
      .filter(Boolean)
      .join(' · '),
  }));

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
        Coverage
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 0.75rem', maxWidth: '42rem' }}>
        Language coverage, African country packs, and golden-eval status for focus translation pairs.
      </p>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem' }}>
        <Link href="/languages">Languages</Link> · <Link href="/docs">Docs</Link> · API{' '}
        <code className="vl-code">GET /v1/coverage</code> · <code className="vl-code">GET /v1/country-packs</code>
      </p>
      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}
      {!data && !error ? <p style={{ color: 'var(--muted)' }}>Loading…</p> : null}
      {data ? (
        <CatalogConsole
          note={hidePhaseIds(data.note)}
          safetyNote={hidePhaseIds(data.disclaimer)}
          statusChips={[
            { label: 'Languages', value: String(data.languages.total) },
            { label: 'Strategic African', value: String(data.languages.strategicAfrican) },
            { label: 'Country packs', value: String(data.countryPacks?.total ?? 0) },
            { label: 'Focus pairs', value: String(data.focusPairs.length) },
            {
              label: 'Last eval',
              value: data.lastEvalMode ?? data.asOf ?? 'none',
            },
          ]}
          sections={[
            { title: 'Country packs', rows: packRows },
            { title: 'Focus pairs', rows: focusRows },
            { title: 'Registry languages (sample)', rows: langRows },
          ]}
          backHref="/ecosystem-cloud"
          backLabel="Ecosystem Cloud"
        />
      ) : null}
    </AppShell>
  );
}
