'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { resolveApiToken } from '@/lib/dev-auth';
import { AppShell } from '@/components/app-shell';
import { CatalogConsole, type CatalogRow } from '@/components/catalog-console';

type Bundle = {
  product: string;
  note: string;
  honesty: Record<string, unknown>;
  safety?: { note?: string } & Record<string, unknown>;
  products?: CatalogRow[];
  docs?: string;
  links?: Record<string, string>;
  deferred?: Record<string, unknown>;
};

export function TrustCloudClient() {
  const { getToken, isLoaded } = useAuth();
  const [data, setData] = useState<Bundle | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await resolveApiToken(getToken);
    if (token) {
      setData(await apiFetch<Bundle>('/v1/trust-cloud/overview', { token }));
      return;
    }
    setData(await apiFetch<Bundle>('/v1/trust-cloud/products'));
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  const linkEntries = Object.entries(data?.links ?? {}).filter(([, href]) => typeof href === 'string');

  return (
    <AppShell>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.85rem', fontWeight: 720, letterSpacing: '-0.03em', margin: '0 0 0.35rem' }}>
        Trust Center
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 0.75rem', maxWidth: '42rem' }}>
        Trust, safety, and compliance posture for VerbaLab African voice and language products — enforcement and
        governance over Policy Runtime, AgentOps, and consent. Not a certified GRC / SOC attestation portal.
      </p>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
        <Link href="/compliance-attestations">Compliance attestations</Link>
        <Link href="/enterprise">Enterprise</Link>
        <Link href="/data">Data & policies</Link>
        <Link href="/docs">Docs</Link>
        {data?.docs ? (
          <a href={data.docs.startsWith('/') ? data.docs : `/docs`} style={{ color: 'inherit' }}>
            Trust Cloud notes
          </a>
        ) : null}
      </p>
      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}
      {!data && !error ? <p style={{ color: 'var(--muted)' }}>Loading…</p> : null}
      {data ? (
        <>
          <div className="vl-panel" style={{ padding: '1rem 1.2rem', marginBottom: '1.25rem' }}>
            <p style={{ margin: 0 }}>{data.note}</p>
            {data.safety?.note ? (
              <p style={{ margin: '0.5rem 0 0', color: 'var(--muted)' }}>{String(data.safety.note)}</p>
            ) : null}
            {data.honesty ? (
              <p style={{ margin: '0.5rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
                Honesty: certificationsProduct=
                {String((data.honesty as { certificationsProduct?: boolean }).certificationsProduct ?? false)} ·
                compliance tooling ≠ certification.
              </p>
            ) : null}
          </div>
          {linkEntries.length ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '1.25rem' }}>
              {linkEntries.map(([label, href]) => (
                <Link key={label} href={href} className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none' }}>
                  {label}
                </Link>
              ))}
            </div>
          ) : null}
          <CatalogConsole
            note={data.note}
            safetyNote={data.safety?.note ? String(data.safety.note) : undefined}
            honesty={data.honesty}
            sections={[{ title: 'Trust surfaces', rows: data.products ?? [] }]}
          />
        </>
      ) : null}
    </AppShell>
  );
}
