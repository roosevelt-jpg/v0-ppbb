'use client';

import type { ReactNode } from 'react';

type Props = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function AnalyticsSection({ title, subtitle, action, children, className }: Props) {
  return (
    <section className={`vl-analytics-section${className ? ` ${className}` : ''}`}>
      <header className="vl-analytics-section__header">
        <div>
          <h2 className="vl-analytics-section__title">{title}</h2>
          {subtitle ? <p className="vl-analytics-section__subtitle">{subtitle}</p> : null}
        </div>
        {action ? <div className="vl-analytics-section__action">{action}</div> : null}
      </header>
      <div className="vl-analytics-section__body">{children}</div>
    </section>
  );
}
