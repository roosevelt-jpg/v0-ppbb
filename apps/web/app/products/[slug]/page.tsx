import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ThemeSwitcher } from '@/components/theme-provider';
import { buildPageMetadata } from '@/lib/seo';
import { getProductPage, listProductSlugs, productsByFamily } from '@/lib/product-pages';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return listProductSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductPage(slug);
  if (!product) {
    return buildPageMetadata({
      title: 'Product not found',
      description: 'This VerbaLab product page does not exist.',
      path: `/products/${slug}`,
      noIndex: true,
    });
  }
  return buildPageMetadata({
    title: product.title,
    description: product.description,
    path: `/products/${product.slug}`,
    ogTitle: product.ogTitle,
    ogDescription: product.description,
    ogImage: `/products/${product.slug}/opengraph-image`,
    keywords: product.keywords,
  });
}

export default async function ProductMarketingPage({ params }: Props) {
  const { slug } = await params;
  const product = getProductPage(slug);
  if (!product) notFound();

  const related = productsByFamily()[product.family]
    .filter((p) => p.slug !== product.slug)
    .slice(0, 4);

  return (
    <div className="vl-mkt">
      <header className="vl-mkt-nav">
        <Link href="/" className="vl-mkt-brand">
          VerbaLab
        </Link>
        <nav className="vl-mkt-nav-links">
          <Link href="/products">All products</Link>
          <Link href={`/#products`}>{product.family}</Link>
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

      <main>
        <section className="vl-mkt-section" style={{ paddingBottom: '1rem' }}>
          <p className="vl-mkt-kicker">{product.kicker}</p>
          <h1 className="vl-mkt-headline" style={{ fontSize: 'clamp(2.1rem, 4.5vw, 3.2rem)', maxWidth: '18ch' }}>
            {product.headline}
          </h1>
          <p className="vl-mkt-lede" style={{ maxWidth: '40rem' }}>
            {product.lede}
          </p>
          <div className="vl-mkt-hero-actions" style={{ marginTop: '1.25rem' }}>
            <Link href={product.consoleHref} className="vl-btn vl-btn-primary vl-mkt-cta">
              Open {product.linkName}
            </Link>
            {product.secondaryHref ? (
              <Link href={product.secondaryHref} className="vl-btn vl-btn-secondary">
                {product.secondaryLabel ?? 'Learn more'}
              </Link>
            ) : (
              <Link href="/sign-up" className="vl-btn vl-btn-secondary">
                Start free
              </Link>
            )}
          </div>
          <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--mkt-muted, var(--muted))' }}>
            Page: <code>/products/{product.slug}</code> · {product.linkName}
          </p>
        </section>

        <section className="vl-mkt-section" style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', margin: '0 0 0.75rem' }}>
              What you get
            </h2>
            <ul style={{ margin: 0, paddingLeft: '1.15rem', display: 'grid', gap: '0.55rem', color: 'var(--mkt-ink, var(--ink))' }}>
              {product.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', margin: '0 0 0.75rem' }}>
              Built for
            </h2>
            <ul style={{ margin: 0, paddingLeft: '1.15rem', display: 'grid', gap: '0.55rem', color: 'var(--mkt-ink, var(--ink))' }}>
              {product.audiences.map((audience) => (
                <li key={audience}>{audience}</li>
              ))}
            </ul>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', margin: '1.5rem 0 0.75rem' }}>
              Why it matters
            </h2>
            <p style={{ margin: 0, color: 'var(--mkt-ink, var(--ink))', lineHeight: 1.55 }}>
              {product.description}
            </p>
          </div>
        </section>

        {related.length ? (
          <section className="vl-mkt-section">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', margin: '0 0 1rem' }}>
              More in {product.family}
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))' }}>
              {related.map((item) => (
                <li key={item.slug} className="vl-panel" style={{ padding: '1rem' }}>
                  <Link href={`/products/${item.slug}`} style={{ fontWeight: 650, color: 'inherit', textDecoration: 'none' }}>
                    {item.linkName}
                  </Link>
                  <p style={{ margin: '0.4rem 0 0', fontSize: '0.9rem', color: 'var(--mkt-muted, var(--muted))' }}>
                    {item.lede}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
    </div>
  );
}
