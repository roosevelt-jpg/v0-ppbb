'use client';

import { CHART_PALETTE, formatCompact, type ChartDatum } from './types';

type Props = {
  data: ChartDatum[];
  height?: number;
  maxBars?: number;
  emptyLabel?: string;
  valueSuffix?: string;
};

export function BarChart({
  data,
  height = 180,
  maxBars = 8,
  emptyLabel = 'No data in this period.',
  valueSuffix = '',
}: Props) {
  const rows = data
    .filter((d) => Number.isFinite(d.value) && d.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, maxBars);

  if (rows.length === 0) {
    return <p className="vl-chart-empty">{emptyLabel}</p>;
  }

  const max = Math.max(...rows.map((d) => d.value), 1);
  const barH = Math.max(14, Math.min(28, Math.floor((height - 8) / rows.length) - 6));
  const svgH = rows.length * (barH + 10) + 4;
  const labelW = 92;
  const valueW = 56;
  const trackW = 280;
  const width = labelW + trackW + valueW + 16;

  return (
    <div className="vl-bar-chart" role="img" aria-label="Bar chart">
      <svg viewBox={`0 0 ${width} ${svgH}`} width="100%" height={Math.min(height, svgH)} preserveAspectRatio="xMidYMid meet">
        {rows.map((row, i) => {
          const y = i * (barH + 10) + 4;
          const w = Math.max(2, (row.value / max) * trackW);
          const color = row.color ?? CHART_PALETTE[i % CHART_PALETTE.length];
          return (
            <g key={`${row.label}-${i}`}>
              <text x={0} y={y + barH / 2 + 4} className="vl-bar-chart__label">
                {row.label.length > 14 ? `${row.label.slice(0, 13)}…` : row.label}
              </text>
              <rect x={labelW} y={y} width={trackW} height={barH} rx={6} className="vl-bar-chart__track" />
              <rect x={labelW} y={y} width={w} height={barH} rx={6} fill={color} className="vl-bar-chart__bar">
                <title>{`${row.label}: ${row.value.toLocaleString()}${valueSuffix}${row.hint ? ` — ${row.hint}` : ''}`}</title>
              </rect>
              <text x={labelW + trackW + 8} y={y + barH / 2 + 4} className="vl-bar-chart__value">
                {formatCompact(row.value)}
                {valueSuffix}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
