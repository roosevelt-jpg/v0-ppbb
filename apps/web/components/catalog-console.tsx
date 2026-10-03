'use client';

import Link from 'next/link';
import { hidePhaseIds } from '@/lib/ui-copy';

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
  const honestyForDisplay = honesty
    ? Object.fromEntries(
        Object.entries(honesty).filter(([k]) => k !== 'note'),
      )
    : null;
  const honestyNote =
    typeof honesty?.note === 'string' ? hidePhaseIds(honesty.note) : null;

  return (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      {note ? (
        <p style={{ margin: 0, color: 'var(--muted)' }}>{hidePhaseIds(note)}</p>
      ) : null}
      {safetyNote ? (
        <p
          style={{
            margin: 0,
            borderLeft: '3px solid #0f766e',
            paddingLeft: '0.85rem',
            color: 'var(--muted)',
          }}
        >
          {hidePhaseIds(safetyNote)}
        </p>
      ) : null}
      {honestyNote ? (
        <p
          style={{
            margin: 0,
            borderLeft: '3px solid #0f766e',
            paddingLeft: '0.85rem',
            color: 'var(--muted)',
          }}
        >
          {honestyNote}
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
              {chip.label}: <strong style={{ color: 'var(--ink)' }}>{chip.value}</strong>
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
                return (
                  <li
                    key={row.id}
                    style={{ borderBottom: '1px solid var(--border, var(--line))', paddingBottom: '0.75rem' }}
                  >
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
                      {href ? <Link href={href}>{rowLabel(row)}</Link> : <span>{rowLabel(row)}</span>}
                      {row.status ? (
                        <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{String(row.status)}</span>
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
                    {row.notes ? (
                      <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
                        {hidePhaseIds(String(row.notes))}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null,
      )}
      {honestyForDisplay ? (
        <pre
          style={{
            margin: 0,
            padding: '1rem',
            background: 'var(--surface)',
            overflow: 'auto',
            fontSize: '0.78rem',
          }}
        >
          {JSON.stringify({ honesty: honestyForDisplay }, null, 2)}
        </pre>
      ) : null}
      {backHref && backLabel ? <Link href={backHref}>← {backLabel}</Link> : null}
    </div>
  );
}
