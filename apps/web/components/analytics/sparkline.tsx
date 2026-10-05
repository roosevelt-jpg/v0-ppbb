'use client';

type Props = {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  ariaLabel?: string;
};

export function Sparkline({
  values,
  width = 96,
  height = 28,
  stroke = 'var(--brand)',
  fill = 'var(--brand-soft)',
  ariaLabel = 'Trend',
}: Props) {
  const pts = values.filter((v) => Number.isFinite(v));
  if (pts.length < 2) {
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden className="vl-sparkline">
        <line x1={4} y1={height / 2} x2={width - 4} y2={height / 2} stroke="var(--line)" strokeWidth={1.5} />
      </svg>
    );
  }

  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const span = max - min || 1;
  const pad = 2;
  const coords = pts.map((v, i) => {
    const x = pad + (i / (pts.length - 1)) * (width - pad * 2);
    const y = height - pad - ((v - min) / span) * (height - pad * 2);
    return [x, y] as const;
  });
  const first = coords[0];
  const last = coords[coords.length - 1];
  if (!first || !last) {
    return null;
  }
  const line = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = `${line} L${last[0].toFixed(1)} ${height - pad} L${first[0].toFixed(1)} ${height - pad} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="vl-sparkline"
      role="img"
      aria-label={ariaLabel}
    >
      <path d={area} fill={fill} opacity={0.85} />
      <path d={line} fill="none" stroke={stroke} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
