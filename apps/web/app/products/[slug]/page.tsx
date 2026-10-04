import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ThemeSwitcher } from '@/components/theme-provider';
import { buildPageMetadata } from '@/lib/seo';
import { getProductPage, listProductSlugs, productsByFamily } from '@/lib/product-pages';
import { getProductStory } from '@/lib/product-stories';
import { ProductLiveDemo } from './product-live-demo';
import { ProductDemoMedia } from './product-demo-media';
import { ProductApiGuide } from './product-api-guide';

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

  const story = getProductStory(product);
  const related = productsByFamily()[product.family]
    .filter((p) => p.slug !== product.slug)
    .slice(0, 4);

  return (
    <div className="vl-mkt vl-prod-page">
      <header className="vl-mkt-nav">
        <Link href="/" className="vl-mkt-brand">
          VerbaLab
        </Link>
        <nav className="vl-mkt-nav-links">
          <Link href="/products">All products</Link>
          <Link href="/#products">{product.family}</Link>
          <Link href="/docs">Docs</Link>
          <a href="#illustrations">Demos</a>
          <a href="#live-demo">Live demo</a>
          <a href="#api-guide">APIs</a>
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
        <section className="vl-mkt-section vl-prod-hero">
          <p className="vl-mkt-kicker">{product.kicker}</p>
          <h1 className="vl-mkt-headline">{product.headline}</h1>
          <p className="vl-mkt-lede">{product.lede}</p>
          <div className="vl-mkt-hero-actions">
            <a href="#live-demo" className="vl-btn vl-btn-primary vl-mkt-cta">
              Try live demo
            </a>
            <Link href={product.consoleHref} className="vl-btn vl-btn-secondary">
              Open {product.linkName}
            </Link>
            {product.secondaryHref ? (
              <Link href={product.secondaryHref} className="vl-mkt-link">
                {product.secondaryLabel ?? 'Learn more'}
              </Link>
            ) : (
              <Link href="/sign-up" className="vl-mkt-link">
                Start free
              </Link>
            )}
          </div>
        </section>

        <section className="vl-mkt-section vl-prod-overview">
          <h2>What {product.linkName} is</h2>
          <p>{story.overview}</p>
          <ul className="vl-prod-proof">
            {story.proofPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </section>

        <section className="vl-mkt-section vl-prod-split">
          <div>
            <h2>How it works</h2>
            <ol className="vl-prod-steps">
              {story.howItWorks.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
          <div>
            <h2>What you get</h2>
            <ul className="vl-prod-list">
              {product.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <h2 className="vl-prod-subhead">Built for</h2>
            <ul className="vl-prod-list">
              {product.audiences.map((audience) => (
                <li key={audience}>{audience}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="vl-mkt-section">
          <h2>Use cases that win deals</h2>
          <p className="vl-prod-section-lede">
            Concrete scenarios buyers recognize — so the page sells the outcome, not only the feature list.
          </p>
          <div className="vl-prod-usecases">
            {story.useCases.map((useCase) => (
              <article key={useCase.title} className="vl-prod-usecase">
                <h3>{useCase.title}</h3>
                <p>{useCase.scenario}</p>
                <p className="vl-prod-outcome">
                  <span>Outcome</span> {useCase.outcome}
                </p>
              </article>
            ))}
          </div>
        </section>

        <div className="vl-mkt-section">
          <ProductDemoMedia media={story.media} />
        </div>

        <div className="vl-mkt-section">
          <ProductLiveDemo
            demoKind={story.demoKind}
            demoTitle={story.demoTitle}
            demoBlurb={story.demoBlurb}
            samplePrompt={story.samplePrompt}
            consoleHref={product.consoleHref}
            productName={product.linkName}
          />
        </div>

        <div className="vl-mkt-section">
          <ProductApiGuide
            endpoints={story.apiEndpoints}
            sampleCode={story.sampleCode}
            productName={product.linkName}
          />
        </div>

        <section className="vl-mkt-section vl-prod-code">
          <h2>Ship it in your stack</h2>
          <p className="vl-prod-section-lede">
            Same capability as the live demo — copy the pattern into backends, apps, and agents.
          </p>
          <pre className="vl-prod-code-block">{story.sampleCode}</pre>
          <div className="vl-mkt-hero-actions">
            <Link href="/docs" className="vl-btn vl-btn-secondary">
              Read docs
            </Link>
            <Link href="/docs/openapi" className="vl-btn vl-btn-secondary">
              OpenAPI explorer
            </Link>
            <Link href="/keys" className="vl-btn vl-btn-primary">
              Create API key
            </Link>
          </div>
        </section>

        {related.length ? (
          <section className="vl-mkt-section">
            <h2>More in {product.family}</h2>
            <ul className="vl-prod-related">
              {related.map((item) => (
                <li key={item.slug}>
                  <Link href={`/products/${item.slug}`}>
                    <strong>{item.linkName}</strong>
                    <span>{item.lede}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="vl-mkt-section vl-prod-close">
          <h2>Ready to put {product.linkName} in front of customers?</h2>
          <p>
            Run the live demo above, open the console on your content, then integrate with keys and SDKs.
          </p>
          <div className="vl-mkt-hero-actions">
            <a href="#live-demo" className="vl-btn vl-btn-primary vl-mkt-cta">
              Back to live demo
            </a>
            <Link href={product.consoleHref} className="vl-btn vl-btn-secondary">
              Open {product.linkName}
            </Link>
            <Link href="/sign-up" className="vl-btn vl-btn-secondary">
              Start free
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
