'use client';

import Link from 'next/link';
import { hidePhaseIds } from '@/lib/ui-copy';
import { productStatusLabel, scrubShippedCopy } from '@/lib/product-status';

export type CatalogRow = {
  id: string;
  name?: string;
  title?: string;
  status?: string;
  notes?: string;
  kind?: string;
  severity?: string;
  console?: string | null;
  api?: string | null;
  version?: string;
  stage?: string;
  [key: string]: unknown;
};

type CatalogConsoleProps = {
  note?: string;
  safetyNote?: string;
  honesty?: Record<string, unknown>;
  sections?: Array<{
    title: string;
    rows: CatalogRow[];
    /** Prefer linking via console path when present */
    linkKey?: 'console';
  }>;
  statusChips?: Array<{ label: string; value: string }>;
  backHref?: string;
  backLabel?: string;
};

function rowLabel(row: CatalogRow): string {
  return String(row.name ?? row.title ?? row.id);
}

export function CatalogConsole({
  note,
  safetyNote,
  honesty,
  sections = [],
  statusChips = [],
  backHref,
  backLabel,
}: CatalogConsoleProps) {
  // End users see product copy only — never honesty JSON dumps or denial flags.
  const honestyNote =
    typeof honesty?.note === 'string' ? hidePhaseIds(String(honesty.note)) : null;
  const cleanedNote = note ? hidePhaseIds(note) : null;
  const cleanedSafety = safetyNote ? hidePhaseIds(safetyNote) : null;
  const displaySafety =
    cleanedSafety && cleanedSafety !== cleanedNote && cleanedSafety !== honestyNote
      ? cleanedSafety
      : null;
  const displayHonesty =
    honestyNote && honestyNote !== cleanedNote && honestyNote !== displaySafety
      ? honestyNote
      : null;

  return (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      {cleanedNote ? (
        <p style={{ margin: 0, color: 'var(--muted)' }}>{cleanedNote}</p>
      ) : null}
      {displaySafety ? (
        <p
          style={{
            margin: 0,
            borderLeft: '3px solid #0f766e',
            paddingLeft: '0.85rem',
            color: 'var(--muted)',
          }}
        >
          {displaySafety}
        </p>
      ) : null}
      {displayHonesty ? (
        <p
          style={{
            margin: 0,
            borderLeft: '3px solid #0f766e',
            paddingLeft: '0.85rem',
            color: 'var(--muted)',
          }}
        >
          {displayHonesty}
        </p>
      ) : null}
      {statusChips.length ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {statusChips.map((chip) => (
            <span
              key={chip.label}
              style={{
                fontSize: '0.8rem',
                color: 'var(--muted)',
                border: '1px solid var(--border, var(--line))',
                padding: '0.25rem 0.55rem',
              }}
            >
              {chip.label}: <strong style={{ color: 'var(--ink)' }}>{scrubShippedCopy(chip.value)}</strong>
            </span>
          ))}
        </div>
      ) : null}
      {sections.map((section) =>
        section.rows.length ? (
          <section key={section.title}>
            <h2
              style={{
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--muted)',
                margin: '0 0 0.75rem',
              }}
            >
              {section.title}
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.85rem' }}>
              {section.rows.map((row) => {
                const href = typeof row.console === 'string' ? row.console : null;
                const rowNotes = row.notes ? hidePhaseIds(String(row.notes)) : '';
                const status = productStatusLabel(row.status ? String(row.status) : null);
                return (
                  <li
                    key={row.id}
                    style={{ borderBottom: '1px solid var(--border, var(--line))', paddingBottom: '0.75rem' }}
                  >
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
                      {href ? <Link href={href}>{rowLabel(row)}</Link> : <span>{rowLabel(row)}</span>}
                      {status ? (
                        <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{status}</span>
                      ) : null}
                      {row.severity ? (
                        <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{String(row.severity)}</span>
                      ) : null}
                      {row.kind ? (
                        <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{String(row.kind)}</span>
                      ) : null}
                      {row.version ? (
                        <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>v{String(row.version)}</span>
                      ) : null}
                      {row.stage ? (
                        <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{String(row.stage)}</span>
                      ) : null}
                    </div>
                    {rowNotes ? (
                      <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
                        {rowNotes}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null,
      )}
      {backHref && backLabel ? <Link href={backHref}>← {backLabel}</Link> : null}
    </div>
  );
}
