'use client';

import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { resolveApiToken } from '@/lib/dev-auth';
import { AppShell } from '@/components/app-shell';

type Settings = {
  brandName: string;
  tagline: string;
  defaultTheme: string;
  primaryColor: string;
  accentColor: string;
  designScope: Record<string, unknown>;
};

type PageRow = {
  id: string;
  slug: string;
  title: string;
  status: string;
  description?: string;
  seo?: { reviewStatus?: string; kind?: string };
  _count: { blocks: number; assets: number };
};

type HomePayload = {
  page: {
    blocks: Array<{ id: string; type: string; sortOrder: number; content: Record<string, unknown> }>;
  };
  assetMap: Record<string, { key: string; url: string; alt: string }>;
  settings: Settings;
};

type PrefillEditor = {
  pageSlug: string;
  blockId: string;
  type: string;
  contentJson: string;
};

const PRODUCT_PREVIEW: Record<string, string> = {
  'product-translate': '/translate',
  'product-voice': '/voice-studio',
  'product-speech': '/speech',
  'product-dashboard': '/dashboard',
  'product-playground': '/playground',
  'product-chat': '/chat',
};

function previewHrefForSlug(slug: string): string | null {
  if (slug === 'home') return '/';
  if (PRODUCT_PREVIEW[slug]) return PRODUCT_PREVIEW[slug];
  if (slug.startsWith('use-case-')) return `/use-cases/${slug.slice('use-case-'.length)}`;
  return null;
}

export function CmsAdminClient() {
  const { getToken, isLoaded } = useAuth();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [pages, setPages] = useState<PageRow[]>([]);
  const [home, setHome] = useState<HomePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editor, setEditor] = useState<PrefillEditor | null>(null);

  const load = useCallback(async () => {
    const token = await resolveApiToken(getToken);
    if (!token) throw new Error('Not signed in — use /dev-login first');
    const [s, p, h] = await Promise.all([
      apiFetch<Settings>('/v1/cms/settings', { token }),
      apiFetch<PageRow[]>('/v1/cms/pages', { token }),
      apiFetch<HomePayload>('/v1/cms/pages/home', { token }),
    ]);
    setSettings(s);
    setPages(p);
    setHome(h);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  async function saveSettings() {
    if (!settings) return;
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const token = await resolveApiToken(getToken);
      if (!token) throw new Error('Not signed in');
      const next = await apiFetch<Settings>('/v1/cms/settings', {
        token,
        method: 'PUT',
        body: JSON.stringify({
          brandName: settings.brandName,
          tagline: settings.tagline,
          defaultTheme: settings.defaultTheme,
          primaryColor: settings.primaryColor,
          accentColor: settings.accentColor,
        }),
      });
      setSettings(next);
      setStatus('Settings saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  async function reseed() {
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const token = await resolveApiToken(getToken);
      if (!token) throw new Error('Not signed in');
      await apiFetch('/v1/cms/reseed-home', { token, method: 'POST', body: '{}' });
      await load();
      setStatus('Reseeded home + pending-review use-case/product pages (approved pages kept).');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reseed failed');
    } finally {
      setBusy(false);
    }
  }

  async function setReview(slug: string, reviewStatus: 'pending_review' | 'approved') {
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const token = await resolveApiToken(getToken);
      if (!token) throw new Error('Not signed in');
      await apiFetch(`/v1/cms/pages/${slug}/review`, {
        token,
        method: 'POST',
        body: JSON.stringify({ reviewStatus }),
      });
      await load();
      setStatus(`Marked ${slug} as ${reviewStatus.replace('_', ' ')}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Review update failed');
    } finally {
      setBusy(false);
    }
  }

  async function openPrefillEditor(slug: string) {
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const token = await resolveApiToken(getToken);
      if (!token) throw new Error('Not signed in');
      const data = await apiFetch<{
        page: { blocks: Array<{ id: string; type: string; content: Record<string, unknown> }> };
      }>(`/v1/cms/pages/${slug}`, { token });
      const block =
        data.page.blocks.find((b) => b.type === 'product_prefill' || b.type === 'sample_panel') ??
        data.page.blocks[0];
      if (!block) throw new Error('No editable blocks on this page');
      setEditor({
        pageSlug: slug,
        blockId: block.id,
        type: block.type,
        contentJson: JSON.stringify(block.content, null, 2),
      });
      setStatus(`Editing ${slug} (${block.type}) for review.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load page content');
    } finally {
      setBusy(false);
    }
  }

  async function savePrefillEditor() {
    if (!editor) return;
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const token = await resolveApiToken(getToken);
      if (!token) throw new Error('Not signed in');
      let content: Record<string, unknown>;
      try {
        content = JSON.parse(editor.contentJson) as Record<string, unknown>;
      } catch {
        throw new Error('Content must be valid JSON');
      }
      await apiFetch('/v1/cms/blocks', {
        token,
        method: 'POST',
        body: JSON.stringify({
          pageSlug: editor.pageSlug,
          blockId: editor.blockId,
          type: editor.type,
          content,
          published: true,
        }),
      });
      await apiFetch(`/v1/cms/pages/${editor.pageSlug}/review`, {
        token,
        method: 'POST',
        body: JSON.stringify({ reviewStatus: 'pending_review' }),
      });
      await load();
      setStatus(`Saved ${editor.pageSlug} — left as pending review.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <p style={{ margin: 0, color: 'var(--brand)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em' }}>
        CMS
      </p>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.55rem, 2.4vw, 2rem)',
          fontWeight: 740,
          letterSpacing: '-0.03em',
          margin: '0.25rem 0 0.35rem',
        }}
      >
        Marketing content
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.35rem', maxWidth: '42rem' }}>
        Every use-case and product surface ships prefilled. Review pending pages here, approve when ready, or reseed
        defaults for anything still pending review.
      </p>

      {error ? <p style={{ color: 'var(--bad)' }}>{error}</p> : null}
      {status ? <p style={{ color: 'var(--ok)' }}>{status}</p> : null}
      {!settings && !error ? <p style={{ color: 'var(--muted)' }}>Loading CMS…</p> : null}

      {settings ? (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          <section className="vl-panel" style={{ padding: '1.2rem', display: 'grid', gap: '0.85rem' }}>
            <h2 style={{ margin: 0, fontSize: '1rem' }}>Site settings</h2>
            <label className="vl-label">
              Brand name
              <input
                className="vl-field"
                value={settings.brandName}
                onChange={(e) => setSettings({ ...settings, brandName: e.target.value })}
              />
            </label>
            <label className="vl-label">
              Tagline
              <input
                className="vl-field"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
              />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <label className="vl-label">
                Default theme
                <select
                  className="vl-field"
                  value={settings.defaultTheme}
                  onChange={(e) => setSettings({ ...settings, defaultTheme: e.target.value })}
                >
                  <option value="system">system</option>
                  <option value="light">light</option>
                  <option value="dark">dark</option>
                </select>
              </label>
              <label className="vl-label">
                Primary
                <input
                  className="vl-field"
                  value={settings.primaryColor}
                  onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                />
              </label>
              <label className="vl-label">
                Accent
                <input
                  className="vl-field"
                  value={settings.accentColor}
                  onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                />
              </label>
            </div>
            <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}>
              <button type="button" className="vl-btn vl-btn-primary" disabled={busy} onClick={() => void saveSettings()}>
                Save settings
              </button>
              <button type="button" className="vl-btn vl-btn-secondary" disabled={busy} onClick={() => void reseed()}>
                Reseed pending defaults
              </button>
              <a href="/" className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none' }}>
                View marketing site
              </a>
            </div>
          </section>

          <section className="vl-panel" style={{ padding: '1.2rem' }}>
            <h2 style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>Pages to review</h2>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.75rem' }}>
              {pages.map((p) => {
                const review = p.seo?.reviewStatus ?? 'pending_review';
                const href = previewHrefForSlug(p.slug);
                const canEditPrefill = p.slug.startsWith('product-') || p.slug.startsWith('use-case-');
                return (
                  <li
                    key={p.id}
                    style={{
                      borderTop: '1px solid var(--line)',
                      paddingTop: '0.65rem',
                      display: 'grid',
                      gap: '0.35rem',
                    }}
                  >
                    <div>
                      <strong>{p.title}</strong>{' '}
                      <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                        /{p.slug} · {p._count.blocks} blocks · {review.replace('_', ' ')}
                      </span>
                    </div>
                    {p.description ? (
                      <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.88rem' }}>{p.description}</p>
                    ) : null}
                    <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                      {href ? (
                        <a href={href} className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none', padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
                          Preview
                        </a>
                      ) : null}
                      {canEditPrefill ? (
                        <button
                          type="button"
                          className="vl-btn vl-btn-secondary"
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                          disabled={busy}
                          onClick={() => void openPrefillEditor(p.slug)}
                        >
                          Edit content
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="vl-btn vl-btn-secondary"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                        disabled={busy || review === 'approved'}
                        onClick={() => void setReview(p.slug, 'approved')}
                      >
                        Mark approved
                      </button>
                      <button
                        type="button"
                        className="vl-btn vl-btn-secondary"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                        disabled={busy || review === 'pending_review'}
                        onClick={() => void setReview(p.slug, 'pending_review')}
                      >
                        Needs review
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          {editor ? (
            <section className="vl-panel" style={{ padding: '1.2rem', display: 'grid', gap: '0.75rem' }}>
              <h2 style={{ margin: 0, fontSize: '1rem' }}>Review content · {editor.pageSlug}</h2>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.88rem' }}>
                Edit the JSON block (sample text, CTAs, product prefills). Saving keeps the page in pending review until
                you approve it.
              </p>
              <textarea
                className="vl-field vl-code"
                rows={14}
                value={editor.contentJson}
                onChange={(e) => setEditor({ ...editor, contentJson: e.target.value })}
                spellCheck={false}
              />
              <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}>
                <button type="button" className="vl-btn vl-btn-primary" disabled={busy} onClick={() => void savePrefillEditor()}>
                  Save for later review
                </button>
                <button type="button" className="vl-btn vl-btn-secondary" disabled={busy} onClick={() => setEditor(null)}>
                  Close editor
                </button>
              </div>
            </section>
          ) : null}

          {home ? (
            <>
              <section className="vl-panel" style={{ padding: '1.2rem' }}>
                <h2 style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>Home blocks</h2>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.45rem' }}>
                  {home.page.blocks.map((b) => (
                    <li key={b.id} style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
                      <code>{b.sortOrder}</code> · <strong style={{ color: 'var(--ink)' }}>{b.type}</strong>
                    </li>
                  ))}
                </ul>
              </section>
              <section className="vl-panel" style={{ padding: '1.2rem' }}>
                <h2 style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>Assets</h2>
                <div className="vl-hub-grid">
                  {Object.values(home.assetMap).map((a) => (
                    <div key={a.key} className="vl-hub-card" style={{ cursor: 'default' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={a.url} alt={a.alt} style={{ width: '100%', borderRadius: 10, marginBottom: 8 }} />
                      <h3 style={{ fontSize: '0.9rem' }}>{a.key}</h3>
                      <p>{a.url}</p>
                    </div>
                  ))}
                </div>
              </section>
              <section className="vl-panel" style={{ padding: '1.2rem' }}>
                <h2 style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>Design scope</h2>
                <pre
                  className="vl-code"
                  style={{
                    margin: 0,
                    padding: '1rem',
                    background: 'var(--bg-soft)',
                    borderRadius: 12,
                    overflow: 'auto',
                    maxHeight: 320,
                  }}
                >
                  {JSON.stringify(home.settings.designScope, null, 2)}
                </pre>
              </section>
            </>
          ) : null}
        </div>
      ) : null}
    </AppShell>
  );
}
