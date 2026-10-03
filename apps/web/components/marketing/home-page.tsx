'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useMemo, useState } from 'react';
import { API_URL, apiFetch } from '@/lib/api';
import { getDevBearer, resolveApiToken } from '@/lib/dev-auth';
import { ThemeSwitcher } from '@/components/theme-provider';

type CmsAsset = { key: string; url: string; alt: string };
type CmsBlock = { id: string; type: string; sortOrder: number; content: Record<string, unknown> };
type CmsPagePayload = {
  settings: {
    brandName: string;
    tagline: string;
    defaultTheme: string;
    primaryColor: string;
    accentColor: string;
    designScope: Record<string, unknown>;
  };
  page: { slug: string; title: string; description: string; blocks: CmsBlock[] };
  assetMap: Record<string, CmsAsset>;
};

type FooterLink = {
  label: string;
  href: string;
  adminOnly?: boolean;
};

const ADMIN_FOOTER_HREFS = new Set(['/cms', '/dashboard']);

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function isAdminFooterLink(link: FooterLink): boolean {
  if (link.adminOnly) return true;
  return ADMIN_FOOTER_HREFS.has(link.href);
}

export function MarketingHomePage() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [data, setData] = useState<CmsPagePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [voice, setVoice] = useState('alloy');
  const [busy, setBusy] = useState(false);
  const [playError, setPlayError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    void fetch(`${API_URL}/v1/cms/pages/home`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`CMS load failed (${res.status})`);
        return res.json() as Promise<CmsPagePayload>;
      })
      .then((payload) => {
        setData(payload);
        const hero = payload.page.blocks.find((b) => b.type === 'hero');
        const playground = (hero?.content?.playground ?? {}) as {
          sample?: string;
          voices?: Array<{ id: string }>;
        };
        if (playground.sample) setText(playground.sample);
        if (playground.voices?.[0]?.id) setVoice(playground.voices[0].id);
        if (payload.settings.primaryColor) {
          document.documentElement.style.setProperty('--brand', payload.settings.primaryColor);
        }
        if (payload.settings.accentColor) {
          document.documentElement.style.setProperty('--mkt-accent', payload.settings.accentColor);
        }
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    let cancelled = false;
    void (async () => {
      try {
        const token = await resolveApiToken(getToken);
        if (!token) {
          if (!cancelled) setIsAdmin(false);
          return;
        }
        const me = await apiFetch<{ role?: string }>('/v1/identity/me', { token });
        if (!cancelled) {
          setIsAdmin(me.role === 'owner' || me.role === 'admin');
        }
      } catch {
        if (!cancelled) setIsAdmin(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, getToken]);

  const blocks = data?.page.blocks ?? [];
  const assetMap = data?.assetMap ?? {};
  const hero = blocks.find((b) => b.type === 'hero');
  const nav = blocks.find((b) => b.type === 'nav');

  const playground = (hero?.content?.playground ?? {}) as {
    title?: string;
    sample?: string;
    voices?: Array<{ id: string; label: string; meta: string }>;
    footnote?: string;
  };
  const voices = playground.voices ?? [];
  const activeVoice = useMemo(
    () => voices.find((v) => v.id === voice) ?? voices[0],
    [voices, voice],
  );

  async function playDemo() {
    setBusy(true);
    setPlayError(null);
    try {
      const token = getDevBearer();
      if (!token) {
        window.location.href = '/dev-login';
        return;
      }
      const res = await fetch(`${API_URL}/v1/audio/speech`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: text, voice, format: 'mp3' }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? `Could not generate speech (${res.status})`);
      }
      const blob = await res.blob();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      void new Audio(url).play();
    } catch (err) {
      setPlayError(err instanceof Error ? err.message : 'Playback failed');
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <div className="vl-mkt" style={{ padding: '3rem 1.5rem' }}>
        <p>Could not load marketing CMS: {error}</p>
        <p>
          Ensure API is on :3001, then open <Link href="/cms">/cms</Link> after login to reseed.
        </p>
      </div>
    );
  }

  if (!data || !hero) {
    return (
      <div className="vl-mkt" style={{ padding: '3rem 1.5rem', color: 'var(--mkt-muted)' }}>
        Loading VerbaLab…
      </div>
    );
  }

  const heroContent = hero.content as {
    kicker?: string;
    brand?: string;
    headline?: string;
    lede?: string;
    primaryCta?: { label: string; href: string };
    secondaryCta?: { label: string; href: string };
    atmosphereImageKey?: string;
  };
  const atmosphere = heroContent.atmosphereImageKey
    ? assetMap[heroContent.atmosphereImageKey]
    : undefined;
  const navContent = (nav?.content ?? {}) as {
    links?: Array<{ label: string; href: string }>;
    ctaPrimary?: { label: string; href: string };
    ctaSecondary?: { label: string; href: string };
  };

  return (
    <div className="vl-mkt">
      {atmosphere ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="vl-mkt-atmosphere" src={atmosphere.url} alt={atmosphere.alt} />
      ) : null}

      <header className="vl-mkt-nav">
        <Link href="/" className="vl-mkt-brand">
          {data.settings.brandName}
        </Link>
        <nav className="vl-mkt-nav-links" aria-label="Marketing">
          {asArray<{ label: string; href: string }>(navContent.links).map((link) =>
            link.href.startsWith('/') ? (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ) : (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ),
          )}
        </nav>
        <div className="vl-mkt-nav-actions">
          <ThemeSwitcher />
          {navContent.ctaSecondary ? (
            <Link href={navContent.ctaSecondary.href} className="vl-mkt-link">
              {navContent.ctaSecondary.label}
            </Link>
          ) : null}
          {navContent.ctaPrimary ? (
            <Link href={navContent.ctaPrimary.href} className="vl-btn vl-btn-primary vl-mkt-cta">
              {navContent.ctaPrimary.label}
            </Link>
          ) : null}
        </div>
      </header>

      <section className="vl-mkt-hero">
        <div className="vl-mkt-hero-copy vl-fade-up">
          <p className="vl-mkt-kicker">{heroContent.kicker}</p>
          <h1 className="vl-mkt-title">{heroContent.brand ?? data.settings.brandName}</h1>
          {heroContent.headline ? <p className="vl-mkt-headline">{heroContent.headline}</p> : null}
          <p className="vl-mkt-lede">{heroContent.lede}</p>
          <div className="vl-mkt-hero-actions">
            {heroContent.primaryCta ? (
              <Link href={heroContent.primaryCta.href} className="vl-btn vl-btn-primary vl-mkt-cta">
                {heroContent.primaryCta.label}
              </Link>
            ) : null}
            {heroContent.secondaryCta ? (
              <Link
                href={heroContent.secondaryCta.href}
                className="vl-btn vl-btn-secondary vl-mkt-cta-ghost"
              >
                {heroContent.secondaryCta.label}
              </Link>
            ) : null}
          </div>
        </div>

        <div className="vl-mkt-playground vl-fade-up-delay" aria-label="Voice playground">
          <div className="vl-mkt-playground-top">
            <span>{playground.title ?? 'Text to speech'}</span>
            <span className="vl-mkt-pill">{activeVoice?.label ?? 'Voice'}</span>
          </div>
          <textarea
            className="vl-mkt-playground-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
          />
          <div className="vl-mkt-voice-row">
            {voices.map((v) => (
              <button
                key={v.id}
                type="button"
                className={`vl-mkt-voice${voice === v.id ? ' is-active' : ''}`}
                onClick={() => setVoice(v.id)}
              >
                <strong>{v.label}</strong>
                <span>{v.meta}</span>
              </button>
            ))}
          </div>
          <div className="vl-mkt-playground-foot">
            <button
              type="button"
              className="vl-btn vl-btn-primary"
              disabled={busy || !text.trim()}
              onClick={() => void playDemo()}
            >
              {busy ? 'Generating…' : 'Play'}
            </button>
            <p>{playground.footnote}</p>
          </div>
          {playError ? <p className="vl-mkt-error">{playError}</p> : null}
          {audioUrl ? <audio controls src={audioUrl} className="vl-mkt-audio" /> : null}
        </div>
      </section>

      {blocks.map((block) => {
        if (block.type === 'nav' || block.type === 'hero') return null;
        if (block.type === 'logo_strip') {
          const c = block.content as { label?: string; items?: string[] };
          return (
            <section key={block.id} className="vl-mkt-strip" aria-label="Coverage">
              <p>
                {c.label}
                {c.items?.length ? ` · ${c.items.join(' · ')}` : ''}
              </p>
            </section>
          );
        }
        if (block.type === 'products') {
          const c = block.content as {
            id?: string;
            title?: string;
            subtitle?: string;
            items?: Array<{
              kicker: string;
              title: string;
              body: string;
              href: string;
              imageKey?: string;
            }>;
          };
          return (
            <section key={block.id} id={c.id} className="vl-mkt-section">
              <div className="vl-mkt-section-head">
                <h2>{c.title}</h2>
                <p>{c.subtitle}</p>
              </div>
              <div className="vl-mkt-product-grid">
                {(c.items ?? []).map((p) => {
                  const img = p.imageKey ? assetMap[p.imageKey] : undefined;
                  return (
                    <Link key={p.href} href={p.href} className="vl-mkt-product">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img.url} alt={img.alt} className="vl-mkt-card-img" />
                      ) : null}
                      <span>{p.kicker}</span>
                      <h3>{p.title}</h3>
                      <p>{p.body}</p>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        }
        if (block.type === 'use_cases') {
          const c = block.content as {
            id?: string;
            title?: string;
            subtitle?: string;
            items?: Array<{ title: string; body: string; imageKey?: string; href?: string }>;
          };
          return (
            <section key={block.id} id={c.id} className="vl-mkt-section">
              <div className="vl-mkt-section-head">
                <h2>{c.title}</h2>
                <p>{c.subtitle}</p>
              </div>
              <div className="vl-mkt-use-grid">
                {(c.items ?? []).map((item) => {
                  const img = item.imageKey ? assetMap[item.imageKey] : undefined;
                  const inner = (
                    <>
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img.url} alt={img.alt} className="vl-mkt-card-img" />
                      ) : null}
                      <h3>{item.title}</h3>
                      <p>{item.body}</p>
                    </>
                  );
                  return item.href ? (
                    <Link key={item.title} href={item.href} className="vl-mkt-use">
                      {inner}
                    </Link>
                  ) : (
                    <article key={item.title} className="vl-mkt-use">
                      {inner}
                    </article>
                  );
                })}
              </div>
            </section>
          );
        }
        if (block.type === 'platforms') {
          const c = block.content as {
            id?: string;
            title?: string;
            items?: Array<{ title: string; body: string; href: string; bullets?: string[] }>;
          };
          return (
            <section key={block.id} id={c.id} className="vl-mkt-section">
              <div className="vl-mkt-section-head">
                <h2>{c.title}</h2>
              </div>
              <div className="vl-mkt-product-grid">
                {(c.items ?? []).map((item) => (
                  <Link key={item.title} href={item.href} className="vl-mkt-product">
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                    <ul className="vl-mkt-bullets">
                      {(item.bullets ?? []).map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  </Link>
                ))}
              </div>
            </section>
          );
        }
        if (block.type === 'api') {
          const c = block.content as {
            title?: string;
            subtitle?: string;
            cta?: { label: string; href: string };
            code?: string;
          };
          return (
            <section key={block.id} className="vl-mkt-section vl-mkt-section-split">
              <div>
                <h2>{c.title}</h2>
                <p>{c.subtitle}</p>
                {c.cta ? (
                  <div className="vl-mkt-hero-actions" style={{ marginTop: '1.25rem' }}>
                    <Link href={c.cta.href} className="vl-btn vl-btn-primary vl-mkt-cta">
                      {c.cta.label}
                    </Link>
                  </div>
                ) : null}
              </div>
              <pre className="vl-mkt-code">{c.code}</pre>
            </section>
          );
        }
        if (block.type === 'research') {
          const c = block.content as {
            id?: string;
            title?: string;
            items?: Array<{ date: string; title: string; body: string }>;
          };
          return (
            <section key={block.id} id={c.id} className="vl-mkt-section">
              <div className="vl-mkt-section-head">
                <h2>{c.title}</h2>
              </div>
              <div className="vl-mkt-use-grid">
                {(c.items ?? []).map((item) => (
                  <article key={item.title} className="vl-mkt-use">
                    <span className="vl-mkt-kicker">{item.date}</span>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </article>
                ))}
              </div>
            </section>
          );
        }
        if (block.type === 'safety') {
          const c = block.content as {
            id?: string;
            title?: string;
            items?: Array<{ title: string; body: string }>;
          };
          return (
            <section key={block.id} id={c.id} className="vl-mkt-section">
              <div className="vl-mkt-section-head">
                <h2>{c.title}</h2>
              </div>
              <div className="vl-mkt-use-grid">
                {(c.items ?? []).map((item) => (
                  <article key={item.title} className="vl-mkt-use">
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </article>
                ))}
              </div>
            </section>
          );
        }
        if (block.type === 'footer') {
          const c = block.content as {
            brand?: string;
            blurb?: string;
            links?: FooterLink[];
          };
          const links = (c.links ?? []).filter((link) => !isAdminFooterLink(link) || isAdmin);
          return (
            <footer key={block.id} className="vl-mkt-footer">
              <strong>{c.brand}</strong>
              <span>{c.blurb}</span>
              <div>
                {links.map((link) => (
                  <Link key={link.href} href={link.href}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </footer>
          );
        }
        return null;
      })}
    </div>
  );
}
