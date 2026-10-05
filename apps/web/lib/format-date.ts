/** Safe local date/time for console activity and account timestamps. */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (value == null || value === '') return '—';
  const t = value instanceof Date ? value.getTime() : Date.parse(value);
  if (Number.isNaN(t)) return '—';
  return new Date(t).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });
}

/** UTC period labels (billing / usage windows). */
export function formatUtc(value: string | Date | null | undefined): string {
  if (value == null || value === '') return '—';
  const t = value instanceof Date ? value.getTime() : Date.parse(value);
  if (Number.isNaN(t)) return '—';
  return new Date(t).toUTCString();
}
