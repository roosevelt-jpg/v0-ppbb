export type Tone = 'default' | 'brand' | 'ok' | 'warn' | 'bad';

export type ChartDatum = {
  label: string;
  value: number;
  hint?: string;
  color?: string;
};

export function formatCompact(n: number): string {
  if (!Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 10_000) return `${(n / 1_000).toFixed(abs >= 100_000 ? 0 : 1)}k`;
  return n.toLocaleString();
}

export function clampPct(used: number, quota: number): number {
  if (!quota || quota <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((used / quota) * 100)));
}

export function toneForPct(pct: number): Tone {
  if (pct >= 95) return 'bad';
  if (pct >= 80) return 'warn';
  if (pct > 0) return 'brand';
  return 'default';
}

export const CHART_PALETTE = [
  'var(--brand)',
  '#2f9a76',
  '#3d7ea6',
  '#c4a35a',
  '#8b6bb8',
  '#c46b5a',
  '#5a8f6b',
  '#6b7c8b',
] as const;
