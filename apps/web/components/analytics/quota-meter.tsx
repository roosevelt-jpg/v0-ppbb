'use client';

import { clampPct, formatCompact, toneForPct, type Tone } from './types';

type Props = {
  label: string;
  used: number;
  quota: number;
  unit?: string;
  remaining?: number;
  detail?: string;
  showPercent?: boolean;
};

const FILL: Record<Tone, string> = {
  default: 'linear-gradient(90deg, #1a6b52, #2f9a76)',
  brand: 'linear-gradient(90deg, #1a6b52, #2f9a76)',
  ok: 'linear-gradient(90deg, #1a6b52, #2f9a76)',
  warn: 'linear-gradient(90deg, #b7791f, #d69e2e)',
  bad: 'linear-gradient(90deg, #b42318, #e05353)',
};

export function QuotaMeter({
  label,
  used,
  quota,
  unit = 'credits',
  remaining,
  detail,
  showPercent = true,
}: Props) {
  const pct = clampPct(used, quota);
  const tone = toneForPct(pct);
  const left = remaining ?? Math.max(0, quota - used);

  return (
    <div className="vl-quota-meter">
      <div className="vl-quota-meter__row">
        <span className="vl-quota-meter__label">{label}</span>
        {showPercent ? (
          <span className="vl-quota-meter__pct" data-tone={tone}>
            {pct}%
          </span>
        ) : null}
      </div>
      <div className="vl-meter" role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <span style={{ width: `${pct}%`, background: FILL[tone] }} />
      </div>
      <p className="vl-quota-meter__detail">
        {formatCompact(used)} / {formatCompact(quota)} {unit}
        {quota > 0 ? ` · ${formatCompact(left)} left` : null}
        {detail ? ` · ${detail}` : null}
      </p>
    </div>
  );
}
