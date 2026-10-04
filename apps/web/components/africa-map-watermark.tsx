'use client';

import { AFRICA_PLOTTERS, AFRICA_SHARING_ARCS } from '@/lib/africa-plotters';

/**
 * Decorative full-page watermark: Africa outline with country plotters
 * for languages + illustrative data-sharing arcs. Non-interactive.
 */
export function AfricaMapWatermark() {
  const byCode = Object.fromEntries(AFRICA_PLOTTERS.map((p) => [p.code, p]));

  return (
    <div className="vl-africa-watermark" aria-hidden>
      <svg
        className="vl-africa-watermark-svg"
        viewBox="0 0 200 240"
        role="presentation"
        focusable="false"
      >
        <defs>
          <radialGradient id="vl-africa-glow" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.22" />
            <stop offset="70%" stopColor="var(--brand)" stopOpacity="0.06" />
            <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
          </radialGradient>
          <filter id="vl-africa-soft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.2" />
          </filter>
        </defs>

        <ellipse cx="100" cy="118" rx="78" ry="92" fill="url(#vl-africa-glow)" />

        {/* Simplified Africa landmass silhouette */}
        <path
          className="vl-africa-land"
          d="M78 18
             C92 14, 108 16, 118 28
             C128 40, 132 52, 128 64
             C136 70, 144 82, 146 96
             C150 112, 148 128, 142 140
             C138 152, 132 164, 128 176
             C124 190, 120 204, 112 212
             C102 222, 92 226, 84 220
             C74 212, 70 196, 68 180
             C64 164, 58 150, 52 136
             C44 120, 36 108, 34 94
             C32 78, 38 64, 48 54
             C56 44, 62 34, 68 26
             C70 22, 74 20, 78 18 Z
             M118 28
             C126 22, 138 24, 142 34
             C146 44, 140 52, 132 50
             C126 48, 120 40, 118 28 Z"
          filter="url(#vl-africa-soft)"
        />

        {AFRICA_SHARING_ARCS.map(([a, b]) => {
          const from = byCode[a];
          const to = byCode[b];
          if (!from || !to) return null;
          const mx = (from.x + to.x) / 2;
          const my = (from.y + to.y) / 2 - 12;
          return (
            <path
              key={`${a}-${b}`}
              className="vl-africa-arc"
              d={`M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}`}
              fill="none"
            />
          );
        })}

        {AFRICA_PLOTTERS.map((p, i) => (
          <g
            key={p.code}
            className="vl-africa-plotter"
            style={{ animationDelay: `${i * 0.18}s` }}
            aria-label={`${p.name}: ${p.languages.join(', ')} — ${p.sharing}`}
          >
            <circle className="vl-africa-pulse" cx={p.x} cy={p.y} r="7" />
            <circle className="vl-africa-dot" cx={p.x} cy={p.y} r="2.6" />
            <text className="vl-africa-label" x={p.x + 5} y={p.y - 4}>
              {p.code}
            </text>
            <text className="vl-africa-langs" x={p.x + 5} y={p.y + 6}>
              {p.languages.slice(0, 3).join('·')}
            </text>
          </g>
        ))}
      </svg>
      <p className="vl-africa-watermark-caption">
        African languages · shared intelligently across the continent
      </p>
    </div>
  );
}
