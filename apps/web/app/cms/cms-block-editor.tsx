'use client';

import { useEffect, useState, type ReactNode } from 'react';

type LinkRow = { label: string; href: string; adminOnly?: boolean };
type FooterColumn = { title: string; links: LinkRow[] };

export type EditableBlock = {
  pageSlug: string;
  blockId: string;
  type: string;
  sortOrder: number;
  content: Record<string, unknown>;
};

type Props = {
  editor: EditableBlock;
  busy: boolean;
  onChange: (next: EditableBlock) => void;
  onSave: () => void;
  onClose: () => void;
};

function Field({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="vl-label">
      {label}
      {multiline ? (
        <textarea className="vl-field" rows={3} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className="vl-field" value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

function LinkEditor({
  links,
  onChange,
  allowAdminOnly,
}: {
  links: LinkRow[];
  onChange: (links: LinkRow[]) => void;
  allowAdminOnly?: boolean;
}) {
  return (
    <div style={{ display: 'grid', gap: '0.55rem' }}>
      {links.map((link, i) => (
        <div
          key={`${link.href}-${i}`}
          style={{
            display: 'grid',
            gridTemplateColumns: allowAdminOnly ? '1.2fr 1.4fr auto auto' : '1.2fr 1.4fr auto',
            gap: '0.4rem',
            alignItems: 'end',
          }}
        >
          <label className="vl-label">
            Label
            <input
              className="vl-field"
              value={link.label}
              onChange={(e) => {
                const next = [...links];
                next[i] = { ...link, label: e.target.value };
                onChange(next);
              }}
            />
          </label>
          <label className="vl-label">
            Href
            <input
              className="vl-field"
              value={link.href}
              onChange={(e) => {
                const next = [...links];
                next[i] = { ...link, href: e.target.value };
                onChange(next);
              }}
            />
          </label>
          {allowAdminOnly ? (
            <label className="vl-label" style={{ fontSize: '0.78rem' }}>
              Admin
              <input
                type="checkbox"
                checked={Boolean(link.adminOnly)}
                onChange={(e) => {
                  const next = [...links];
                  next[i] = { ...link, adminOnly: e.target.checked };
                  onChange(next);
                }}
              />
            </label>
          ) : null}
          <button
            type="button"
            className="vl-btn vl-btn-secondary"
            style={{ padding: '0.45rem 0.65rem' }}
            onClick={() => onChange(links.filter((_, idx) => idx !== i))}
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        className="vl-btn vl-btn-secondary"
        style={{ justifySelf: 'start', padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
        onClick={() => onChange([...links, { label: 'New link', href: '/' }])}
      >
        Add link
      </button>
    </div>
  );
}

function patchContent(editor: EditableBlock, patch: Record<string, unknown>): EditableBlock {
  return { ...editor, content: { ...editor.content, ...patch } };
}

function asLinks(value: unknown): LinkRow[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const row = (item ?? {}) as LinkRow;
    return {
      label: String(row.label ?? ''),
      href: String(row.href ?? ''),
      ...(row.adminOnly ? { adminOnly: true } : {}),
    };
  });
}

function asCta(value: unknown): { label: string; href: string } {
  const cta = (value ?? {}) as { label?: string; href?: string };
  return { label: String(cta.label ?? ''), href: String(cta.href ?? '') };
}

function CtaFields({
  label,
  value,
  onChange,
}: {
  label: string;
  value: unknown;
  onChange: (v: { label: string; href: string }) => void;
}) {
  const cta = asCta(value);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.55rem' }}>
      <Field label={`${label} label`} value={cta.label} onChange={(v) => onChange({ ...cta, label: v })} />
      <Field label={`${label} href`} value={cta.href} onChange={(v) => onChange({ ...cta, href: v })} />
    </div>
  );
}

function ItemsJsonField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const [text, setText] = useState(() => JSON.stringify(value ?? [], null, 2));
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    setText(JSON.stringify(value ?? [], null, 2));
    setInvalid(false);
  }, [value]);

  return (
    <label className="vl-label">
      {label}
      {invalid ? <span style={{ color: 'var(--bad)', marginLeft: 8 }}>Invalid JSON</span> : null}
      <textarea
        className="vl-field vl-code"
        rows={10}
        value={text}
        spellCheck={false}
        onChange={(e) => {
          setText(e.target.value);
          try {
            onChange(JSON.parse(e.target.value));
            setInvalid(false);
          } catch {
            setInvalid(true);
          }
        }}
      />
    </label>
  );
}

function FooterEditor({ editor, onChange }: { editor: EditableBlock; onChange: (n: EditableBlock) => void }) {
  const columns = (Array.isArray(editor.content.columns) ? editor.content.columns : []) as FooterColumn[];
  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <Field
        label="Brand"
        value={String(editor.content.brand ?? '')}
        onChange={(v) => onChange(patchContent(editor, { brand: v }))}
      />
      <Field
        label="Blurb"
        value={String(editor.content.blurb ?? '')}
        onChange={(v) => onChange(patchContent(editor, { blurb: v }))}
        multiline
      />
      {columns.map((col, colIdx) => (
        <div
          key={`${col.title}-${colIdx}`}
          className="vl-panel"
          style={{ padding: '0.85rem', display: 'grid', gap: '0.65rem', background: 'var(--bg-soft)' }}
        >
          <div style={{ display: 'flex', gap: '0.55rem', alignItems: 'end' }}>
            <label className="vl-label" style={{ flex: 1 }}>
              Column title
              <input
                className="vl-field"
                value={col.title}
                onChange={(e) => {
                  const next = columns.map((c, i) => (i === colIdx ? { ...c, title: e.target.value } : c));
                  onChange(patchContent(editor, { columns: next }));
                }}
              />
            </label>
            <button
              type="button"
              className="vl-btn vl-btn-secondary"
              onClick={() =>
                onChange(patchContent(editor, { columns: columns.filter((_, i) => i !== colIdx) }))
              }
            >
              Remove column
            </button>
          </div>
          <LinkEditor
            links={asLinks(col.links)}
            allowAdminOnly
            onChange={(links) => {
              const next = columns.map((c, i) => (i === colIdx ? { ...c, links } : c));
              onChange(patchContent(editor, { columns: next }));
            }}
          />
        </div>
      ))}
      <button
        type="button"
        className="vl-btn vl-btn-secondary"
        style={{ justifySelf: 'start' }}
        onClick={() =>
          onChange(
            patchContent(editor, {
              columns: [...columns, { title: 'New column', links: [{ label: 'Link', href: '/' }] }],
            }),
          )
        }
      >
        Add footer column
      </button>
      <div>
        <p style={{ margin: '0 0 0.45rem', fontSize: '0.85rem', color: 'var(--muted)' }}>
          Legacy flat links (used when columns are empty)
        </p>
        <LinkEditor
          links={asLinks(editor.content.links)}
          allowAdminOnly
          onChange={(links) => onChange(patchContent(editor, { links }))}
        />
      </div>
    </div>
  );
}

function NavEditor({ editor, onChange }: { editor: EditableBlock; onChange: (n: EditableBlock) => void }) {
  return (
    <div style={{ display: 'grid', gap: '0.85rem' }}>
      <div>
        <p style={{ margin: '0 0 0.45rem', fontWeight: 600 }}>Nav links</p>
        <LinkEditor
          links={asLinks(editor.content.links)}
          onChange={(links) => onChange(patchContent(editor, { links }))}
        />
      </div>
      <CtaFields
        label="Primary CTA"
        value={editor.content.ctaPrimary}
        onChange={(v) => onChange(patchContent(editor, { ctaPrimary: v }))}
      />
      <CtaFields
        label="Secondary CTA"
        value={editor.content.ctaSecondary}
        onChange={(v) => onChange(patchContent(editor, { ctaSecondary: v }))}
      />
      <CtaFields
        label="Console CTA"
        value={editor.content.consoleCta}
        onChange={(v) => onChange(patchContent(editor, { consoleCta: v }))}
      />
    </div>
  );
}

function HeroEditor({ editor, onChange }: { editor: EditableBlock; onChange: (n: EditableBlock) => void }) {
  const playground = (editor.content.playground ?? {}) as Record<string, unknown>;
  return (
    <div style={{ display: 'grid', gap: '0.85rem' }}>
      <Field label="Kicker" value={String(editor.content.kicker ?? '')} onChange={(v) => onChange(patchContent(editor, { kicker: v }))} />
      <Field label="Brand" value={String(editor.content.brand ?? '')} onChange={(v) => onChange(patchContent(editor, { brand: v }))} />
      <Field label="Headline" value={String(editor.content.headline ?? '')} onChange={(v) => onChange(patchContent(editor, { headline: v }))} />
      <Field label="Lede" value={String(editor.content.lede ?? '')} multiline onChange={(v) => onChange(patchContent(editor, { lede: v }))} />
      <CtaFields label="Primary CTA" value={editor.content.primaryCta} onChange={(v) => onChange(patchContent(editor, { primaryCta: v }))} />
      <CtaFields label="Secondary CTA" value={editor.content.secondaryCta} onChange={(v) => onChange(patchContent(editor, { secondaryCta: v }))} />
      <Field
        label="Atmosphere image key"
        value={String(editor.content.atmosphereImageKey ?? '')}
        onChange={(v) => onChange(patchContent(editor, { atmosphereImageKey: v }))}
      />
      <Field
        label="Playground title"
        value={String(playground.title ?? '')}
        onChange={(v) => onChange(patchContent(editor, { playground: { ...playground, title: v } }))}
      />
      <Field
        label="Playground sample text"
        value={String(playground.sample ?? '')}
        multiline
        onChange={(v) => onChange(patchContent(editor, { playground: { ...playground, sample: v } }))}
      />
      <Field
        label="Playground footnote"
        value={String(playground.footnote ?? '')}
        onChange={(v) => onChange(patchContent(editor, { playground: { ...playground, footnote: v } }))}
      />
      <ItemsJsonField
        label="Playground voices (JSON array)"
        value={playground.voices ?? []}
        onChange={(voices) => onChange(patchContent(editor, { playground: { ...playground, voices } }))}
      />
    </div>
  );
}

function SectionShellEditor({
  editor,
  onChange,
}: {
  editor: EditableBlock;
  onChange: (n: EditableBlock) => void;
}) {
  return (
    <div style={{ display: 'grid', gap: '0.85rem' }}>
      {'id' in editor.content ? (
        <Field label="Anchor id" value={String(editor.content.id ?? '')} onChange={(v) => onChange(patchContent(editor, { id: v }))} />
      ) : null}
      {'kicker' in editor.content ? (
        <Field label="Kicker" value={String(editor.content.kicker ?? '')} onChange={(v) => onChange(patchContent(editor, { kicker: v }))} />
      ) : null}
      {'title' in editor.content ? (
        <Field label="Title" value={String(editor.content.title ?? '')} onChange={(v) => onChange(patchContent(editor, { title: v }))} />
      ) : null}
      {'subtitle' in editor.content ? (
        <Field
          label="Subtitle"
          value={String(editor.content.subtitle ?? '')}
          multiline
          onChange={(v) => onChange(patchContent(editor, { subtitle: v }))}
        />
      ) : null}
      {'lede' in editor.content ? (
        <Field label="Lede" value={String(editor.content.lede ?? '')} multiline onChange={(v) => onChange(patchContent(editor, { lede: v }))} />
      ) : null}
      {'label' in editor.content ? (
        <Field label="Label" value={String(editor.content.label ?? '')} onChange={(v) => onChange(patchContent(editor, { label: v }))} />
      ) : null}
      {'code' in editor.content ? (
        <Field label="Code sample" value={String(editor.content.code ?? '')} multiline onChange={(v) => onChange(patchContent(editor, { code: v }))} />
      ) : null}
      {'cta' in editor.content ? (
        <CtaFields label="CTA" value={editor.content.cta} onChange={(v) => onChange(patchContent(editor, { cta: v }))} />
      ) : null}
      {'primaryCta' in editor.content ? (
        <CtaFields
          label="Primary CTA"
          value={editor.content.primaryCta}
          onChange={(v) => onChange(patchContent(editor, { primaryCta: v }))}
        />
      ) : null}
      {'secondaryCta' in editor.content ? (
        <CtaFields
          label="Secondary CTA"
          value={editor.content.secondaryCta}
          onChange={(v) => onChange(patchContent(editor, { secondaryCta: v }))}
        />
      ) : null}
      {['items', 'tabs', 'cards', 'endpoints', 'preview'].map((key) =>
        key in editor.content ? (
          <ItemsJsonField
            key={key}
            label={`${key} (JSON)`}
            value={editor.content[key]}
            onChange={(v) => onChange(patchContent(editor, { [key]: v }))}
          />
        ) : null,
      )}
    </div>
  );
}

export function blockTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    nav: 'Navigation',
    hero: 'Hero + playground',
    logo_strip: 'Language strip',
    products: 'Products',
    use_cases: 'Use cases',
    product_hubs: 'Product hubs',
    platforms: 'Platforms',
    feature_deep_dive: 'Feature deep dive',
    api: 'API section',
    impact: 'Impact',
    research: 'Research',
    safety: 'Safety',
    updates: 'Updates',
    final_cta: 'Final CTA',
    footer: 'Footer',
  };
  return labels[type] ?? type;
}

export function CmsBlockEditor({ editor, busy, onChange, onSave, onClose }: Props) {
  let body: ReactNode;
  if (editor.type === 'footer') {
    body = <FooterEditor editor={editor} onChange={onChange} />;
  } else if (editor.type === 'nav') {
    body = <NavEditor editor={editor} onChange={onChange} />;
  } else if (editor.type === 'hero') {
    body = <HeroEditor editor={editor} onChange={onChange} />;
  } else if (editor.type === 'logo_strip') {
    body = (
      <div style={{ display: 'grid', gap: '0.85rem' }}>
        <Field
          label="Label"
          value={String(editor.content.label ?? '')}
          onChange={(v) => onChange(patchContent(editor, { label: v }))}
        />
        <ItemsJsonField
          label="Languages / items (JSON string array)"
          value={editor.content.items ?? []}
          onChange={(items) => onChange(patchContent(editor, { items }))}
        />
      </div>
    );
  } else {
    body = <SectionShellEditor editor={editor} onChange={onChange} />;
  }

  return (
    <section className="vl-panel" style={{ padding: '1.2rem', display: 'grid', gap: '0.85rem' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1rem' }}>Edit · {blockTypeLabel(editor.type)}</h2>
        <p style={{ margin: '0.35rem 0 0', color: 'var(--muted)', fontSize: '0.88rem' }}>
          Changes publish to the marketing homepage immediately and leave the home page in pending review until
          approved.
        </p>
      </div>
      {body}
      <details>
        <summary style={{ cursor: 'pointer', color: 'var(--muted)', fontSize: '0.85rem' }}>
          Advanced: raw JSON
        </summary>
        <textarea
          className="vl-field vl-code"
          rows={12}
          style={{ marginTop: '0.55rem' }}
          value={JSON.stringify(editor.content, null, 2)}
          spellCheck={false}
          onChange={(e) => {
            try {
              const content = JSON.parse(e.target.value) as Record<string, unknown>;
              onChange({ ...editor, content });
            } catch {
              /* ignore while typing */
            }
          }}
        />
      </details>
      <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}>
        <button type="button" className="vl-btn vl-btn-primary" disabled={busy} onClick={onSave}>
          Save block
        </button>
        <button type="button" className="vl-btn vl-btn-secondary" disabled={busy} onClick={onClose}>
          Close
        </button>
      </div>
    </section>
  );
}
