'use client';

import { CHART_PALETTE, formatCompact, type ChartDatum } from './types';

type Props = {
  data: ChartDatum[];
  totalLabel?: string;
  emptyLabel?: string;
};

export function SegmentedBar({
  data,
  totalLabel = 'Total',
  emptyLabel = 'No breakdown yet.',
}: Props) {
  const rows = data.filter((d) => Number.isFinite(d.value) && d.value > 0);
  const total = rows.reduce((sum, d) => sum + d.value, 0);

  if (total <= 0) {
    return <p className="vl-chart-empty">{emptyLabel}</p>;
  }

  return (
    <div className="vl-segmented">
      <div className="vl-segmented__bar" role="img" aria-label={`${totalLabel}: ${total.toLocaleString()}`}>
        {rows.map((row, i) => {
          const pct = (row.value / total) * 100;
          const color = row.color ?? CHART_PALETTE[i % CHART_PALETTE.length];
          return (
            <span
              key={`${row.label}-${i}`}
              style={{ width: `${pct}%`, background: color }}
              title={`${row.label}: ${row.value.toLocaleString()} (${pct.toFixed(1)}%)`}
            />
          );
        })}
      </div>
      <ul className="vl-segmented__legend">
        {rows.map((row, i) => {
          const pct = (row.value / total) * 100;
          const color = row.color ?? CHART_PALETTE[i % CHART_PALETTE.length];
          return (
            <li key={`${row.label}-${i}`}>
              <span className="vl-segmented__swatch" style={{ background: color }} />
              <span className="vl-segmented__name">{row.label}</span>
              <span className="vl-segmented__meta">
                {formatCompact(row.value)} · {pct.toFixed(0)}%
              </span>
            </li>
          );
        })}
      </ul>
      <p className="vl-segmented__total">
        {totalLabel}: {formatCompact(total)}
      </p>
    </div>
  );
}
