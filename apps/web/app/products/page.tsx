import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingShell } from '@/components/marketing/marketing-shell';
import { buildPageMetadata } from '@/lib/seo';
import { productsByFamily, type ProductFamily } from '@/lib/product-pages';

export const metadata: Metadata = buildPageMetadata({
  title: 'VerbaLab Products',
  description:
    'Explore VerbaLab creative, agents, API, and resource products — dedicated pages for African speech, voice, translate, and language intelligence.',
  path: '/products',
  ogTitle: 'VerbaLab Products',
  ogImage: '/cms/og-default.svg',
  keywords: ['VerbaLab products', 'African TTS', 'speech API', 'voice agents'],
});

const ORDER: ProductFamily[] = ['VerbaCreative', 'VerbaAgents', 'VerbaAPI', 'Resources'];

export default function ProductsIndexPage() {
  const groups = productsByFamily();

  return (
    <MarketingShell
      navLinks={
        <>
          <Link href="/#products">Platform</Link>
          <Link href="/docs">Docs</Link>
          <Link href="/coverage">Coverage</Link>
        </>
      }
    >
      <main className="vl-mkt-section">
        <p className="vl-mkt-kicker">Product directory</p>
        <h1 className="vl-mkt-headline" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
          Every product. Its own page.
        </h1>
        <p className="vl-mkt-lede" style={{ maxWidth: '40rem' }}>
          Dedicated landers for SEO and GEO — title, description, canonical URL, and Open Graph for each
          VerbaCreative, VerbaAgents, VerbaAPI, and resource surface.
        </p>

        {ORDER.map((family) => (
          <section key={family} style={{ marginTop: '2.5rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', margin: '0 0 1rem' }}>{family}</h2>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'grid',
                gap: '0.75rem',
                gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))',
              }}
            >
              {groups[family].map((product) => (
                <li key={product.slug} className="vl-panel" style={{ padding: '1.05rem' }}>
                  <Link
                    href={`/products/${product.slug}`}
                    style={{ fontWeight: 700, color: 'inherit', textDecoration: 'none', fontSize: '1.05rem' }}
                  >
                    {product.linkName}
                  </Link>
                  <p style={{ margin: '0.45rem 0 0', fontSize: '0.9rem', color: 'var(--mkt-muted, var(--muted))' }}>
                    {product.description}
                  </p>
                  <p style={{ margin: '0.55rem 0 0', fontSize: '0.8rem', color: 'var(--mkt-muted, var(--muted))' }}>
                    /products/{product.slug}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    </MarketingShell>
  );
}
