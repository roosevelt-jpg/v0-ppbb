'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/api';
import { ThemeSwitcher } from '@/components/theme-provider';

type Block = { id: string; type: string; sortOrder: number; content: Record<string, unknown> };

const SLUG_MAP: Record<string, string> = {
  trade: 'use-case-trade',
  education: 'use-case-education',
  sales: 'use-case-sales',
  'public-speech': 'use-case-public-speech',
  'customer-experience': 'use-case-customer-experience',
  creative: 'use-case-creative',
};

export function UseCasePageClient({ slug }: { slug: string }) {
  const pageSlug = SLUG_MAP[slug] ?? `use-case-${slug}`;
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [title, setTitle] = useState('Use case');
  const [error, setError] = useState<string | null>(null);
  const [reviewStatus, setReviewStatus] = useState<string>('pending_review');

  useEffect(() => {
    void fetch(`${API_URL}/v1/cms/pages/${pageSlug}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Content not found (${res.status})`);
        return res.json();
      })
      .then((data) => {
        setBlocks(data.page.blocks ?? []);
        setTitle(data.page.title ?? 'Use case');
        setReviewStatus(
          (data.page.seo as Record<string, unknown> | undefined)?.reviewStatus?.toString() ??
            'pending_review',
        );
      })
      .catch((err: Error) => setError(err.message));
  }, [pageSlug]);

  return (
    <div className="vl-mkt">
      <header className="vl-mkt-nav">
        <Link href="/" className="vl-mkt-brand">
          VerbaLab
        </Link>
        <nav className="vl-mkt-nav-links">
          <Link href="/#use-cases">All use cases</Link>
          <Link href="/docs">Docs</Link>
        </nav>
        <div className="vl-mkt-nav-actions">
          <ThemeSwitcher />
          <Link href="/sign-in" className="vl-mkt-link">
            Log in
          </Link>
          <Link href="/dev-login" className="vl-btn vl-btn-primary vl-mkt-cta">
            Open console
          </Link>
        </div>
      </header>

      <main className="vl-mkt-section" style={{ maxWidth: '48rem' }}>
        {error ? <p className="vl-mkt-error">{error}</p> : null}
        {!error && !blocks.length ? <p style={{ color: 'var(--mkt-ink)' }}>Loading…</p> : null}

        {blocks.map((block) => {
          if (block.type === 'article_hero') {
            const c = block.content as {
              kicker?: string;
              title?: string;
              lede?: string;
              ctas?: Array<{ label: string; href: string }>;
            };
            return (
              <section key={block.id} style={{ marginBottom: '1.5rem' }}>
                <p className="vl-mkt-kicker">{c.kicker}</p>
                <h1 className="vl-mkt-headline" style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)' }}>
                  {c.title ?? title}
                </h1>
                <p className="vl-mkt-lede">{c.lede}</p>
                <div className="vl-mkt-hero-actions">
                  {(c.ctas ?? []).map((cta) => (
                    <Link key={cta.href} href={cta.href} className="vl-btn vl-btn-primary vl-mkt-cta">
                      {cta.label}
                    </Link>
                  ))}
                </div>
                <p style={{ marginTop: '0.85rem', fontSize: '0.8rem', color: 'var(--mkt-ink)', opacity: 0.7 }}>
                  CMS review: {reviewStatus.replace('_', ' ')}
                </p>
              </section>
            );
          }
          if (block.type === 'rich_text') {
            const paragraphs = (block.content.paragraphs as string[]) ?? [];
            return (
              <section key={block.id} style={{ display: 'grid', gap: '0.85rem', marginBottom: '1.25rem' }}>
                {paragraphs.map((p) => (
                  <p key={p.slice(0, 24)} style={{ margin: 0, lineHeight: 1.65, color: 'var(--mkt-ink)' }}>
                    {p}
                  </p>
                ))}
              </section>
            );
          }
          if (block.type === 'sample_panel') {
            const c = block.content as { label?: string; text?: string; note?: string };
            return (
              <section key={block.id} className="vl-mkt-playground" style={{ marginBottom: '1.25rem' }}>
                <div className="vl-mkt-playground-top">
                  <span>{c.label}</span>
                  <span className="vl-mkt-pill">Prefilled</span>
                </div>
                <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>{c.text}</p>
                {c.note ? (
                  <p style={{ margin: '0.75rem 0 0', fontSize: '0.8rem', opacity: 0.75 }}>{c.note}</p>
                ) : null}
              </section>
            );
          }
          if (block.type === 'checklist') {
            const c = block.content as { title?: string; items?: string[] };
            return (
              <section key={block.id} className="vl-mkt-use" style={{ marginBottom: '1.5rem' }}>
                <h3>{c.title}</h3>
                <ul className="vl-mkt-bullets">
                  {(c.items ?? []).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            );
          }
          return null;
        })}
      </main>
    </div>
  );
}
