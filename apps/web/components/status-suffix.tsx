'use client';

import { productStatusLabel } from '@/lib/product-status';

/** Renders ` · status` only when status is not the silent ready default (shipped). */
export function StatusSuffix({
  status,
  style,
}: {
  status?: string | null;
  style?: React.CSSProperties;
}) {
  const label = productStatusLabel(status);
  if (!label) return null;
  return (
    <span style={{ color: 'var(--muted)', fontSize: '0.85rem', fontWeight: 500, ...style }}>
      {' '}
      · {label}
    </span>
  );
}
