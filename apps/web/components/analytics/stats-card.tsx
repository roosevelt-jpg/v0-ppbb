'use client';

import type { ReactNode } from 'react';
import type { Tone } from './types';

type Props = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: Tone;
  trend?: ReactNode;
  className?: string;
};

const TONE_COLOR: Record<Tone, string> = {
  default: 'var(--ink)',
  brand: 'var(--brand)',
  ok: 'var(--ok)',
  warn: '#b7791f',
  bad: 'var(--bad)',
};

export function StatsCard({ label, value, hint, tone = 'default', trend, className }: Props) {
  return (
    <article className={`vl-stats-card${className ? ` ${className}` : ''}`}>
      <div className="vl-stats-card__head">
        <p className="vl-stats-card__label">{label}</p>
        {trend ? <div className="vl-stats-card__trend">{trend}</div> : null}
      </div>
      <p className="vl-stats-card__value" style={{ color: TONE_COLOR[tone] }}>
        {value}
      </p>
      {hint ? <p className="vl-stats-card__hint">{hint}</p> : null}
    </article>
  );
}
