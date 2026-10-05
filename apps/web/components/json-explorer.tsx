'use client';

import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';

type JsonExplorerProps = {
  data: unknown;
  rootLabel?: string;
  defaultExpandDepth?: number;
  initialChildLimit?: number;
  className?: string;
  style?: CSSProperties;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function valueKind(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function preview(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'string') {
    const trimmed = value.length > 72 ? `${value.slice(0, 72)}…` : value;
    return JSON.stringify(trimmed);
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return `Array(${value.length})`;
  if (isPlainObject(value)) return `Object(${Object.keys(value).length})`;
  return String(value);
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }
  try {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

function IconButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{
        border: '1px solid var(--border, var(--line))',
        background: active ? 'var(--bg-soft, var(--surface))' : 'transparent',
        color: 'var(--muted)',
        borderRadius: 6,
        minWidth: 28,
        height: 28,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: '0.72rem',
        letterSpacing: '0.02em',
        lineHeight: 1,
        padding: '0 0.4rem',
        font: 'inherit',
      }}
    >
      {children}
    </button>
  );
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="5" y="5" width="8" height="8" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 10V3.5A1.5 1.5 0 0 1 4.5 2H10" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function EyeIcon({ crossed }: { crossed?: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8s-2.5 4.5-6.5 4.5S1.5 8 1.5 8z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <circle cx="8" cy="8" r="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
      {crossed ? <path d="M3 13 L13 3" stroke="currentColor" strokeWidth="1.4" /> : null}
    </svg>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [ok, setOk] = useState(false);
  return (
    <IconButton
      label={ok ? 'Copied' : label}
      active={ok}
      onClick={() => {
        void copyText(text).then((success) => {
          if (!success) return;
          setOk(true);
          window.setTimeout(() => setOk(false), 1200);
        });
      }}
    >
      {ok ? 'OK' : <CopyIcon />}
    </IconButton>
  );
}

function EyeButton({ hidden, onToggle }: { hidden: boolean; onToggle: () => void }) {
  return (
    <IconButton label={hidden ? 'Show value' : 'Hide value'} active={hidden} onClick={onToggle}>
      <EyeIcon crossed={hidden} />
    </IconButton>
  );
}

function NodeRow({
  name,
  path,
  value,
  depth,
  defaultExpandDepth,
  initialChildLimit,
}: {
  name: string;
  path: string;
  value: unknown;
  depth: number;
  defaultExpandDepth: number;
  initialChildLimit: number;
}) {
  const kind = valueKind(value);
  const expandable = kind === 'object' || kind === 'array';
  const [open, setOpen] = useState(depth < defaultExpandDepth);
  const [hidden, setHidden] = useState(false);
  const [childLimit, setChildLimit] = useState(initialChildLimit);

  const entries = useMemo(() => {
    if (Array.isArray(value)) {
      return value.map((item, index) => ({ key: String(index), childPath: `${path}[${index}]`, child: item }));
    }
    if (isPlainObject(value)) {
      return Object.keys(value)
        .sort()
        .map((key) => ({
          key,
          childPath: path ? `${path}.${key}` : key,
          child: value[key],
        }));
    }
    return [] as Array<{ key: string; childPath: string; child: unknown }>;
  }, [path, value]);

  const visibleEntries = expandable && open ? entries.slice(0, childLimit) : [];
  const remaining = expandable && open ? Math.max(0, entries.length - childLimit) : 0;

  const rawText =
    typeof value === 'string'
      ? value
      : (() => {
          try {
            return JSON.stringify(value, null, 2);
          } catch {
            return String(value);
          }
        })();

  const displayValue =
    !expandable && hidden
      ? typeof value === 'string'
        ? '"••••••••"'
        : '••••'
      : preview(value);

  return (
    <div style={{ marginLeft: depth === 0 ? 0 : '0.85rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.45rem',
          padding: '0.28rem 0',
          borderBottom: '1px solid color-mix(in srgb, var(--border, var(--line)) 55%, transparent)',
        }}
      >
        {expandable ? (
          <button
            type="button"
            aria-label={open ? 'Collapse' : 'Expand'}
            onClick={() => setOpen((v) => !v)}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--muted)',
              cursor: 'pointer',
              width: 22,
              padding: 0,
              marginTop: 2,
              font: 'inherit',
            }}
          >
            {open ? '▾' : '▸'}
          </button>
        ) : (
          <span style={{ width: 22, display: 'inline-block' }} />
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'baseline' }}>
            <code style={{ fontWeight: 650, color: 'var(--ink)' }}>{name}</code>
            <span
              style={{
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--muted)',
              }}
            >
              {kind}
              {expandable ? ` · ${entries.length}` : ''}
            </span>
          </div>
          {!expandable || !open ? (
            <div
              style={{
                marginTop: 2,
                color: 'var(--muted)',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: '0.86rem',
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap',
              }}
            >
              {displayValue}
            </div>
          ) : null}
        </div>

        <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
          {!expandable ? <EyeButton hidden={hidden} onToggle={() => setHidden((v) => !v)} /> : null}
          <CopyButton text={path || name} label="Copy path" />
          <CopyButton text={rawText} label="Copy value" />
        </div>
      </div>

      {expandable && open ? (
        <div>
          {visibleEntries.map((entry) => (
            <NodeRow
              key={entry.childPath}
              name={entry.key}
              path={entry.childPath}
              value={entry.child}
              depth={depth + 1}
              defaultExpandDepth={defaultExpandDepth}
              initialChildLimit={initialChildLimit}
            />
          ))}
          {remaining > 0 ? (
            <button
              type="button"
              onClick={() => setChildLimit((n) => n + initialChildLimit)}
              style={{
                margin: '0.35rem 0 0.55rem 1.4rem',
                border: '1px solid var(--border, var(--line))',
                background: 'transparent',
                borderRadius: 8,
                padding: '0.3rem 0.65rem',
                color: 'var(--muted)',
                cursor: 'pointer',
                font: 'inherit',
                fontSize: '0.85rem',
              }}
            >
              Show {Math.min(remaining, initialChildLimit)} more ({remaining} left)
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function JsonExplorer({
  data,
  rootLabel = 'root',
  defaultExpandDepth = 1,
  initialChildLimit = 40,
  className,
  style,
}: JsonExplorerProps) {
  const pretty = useMemo(() => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  }, [data]);

  return (
    <div
      className={className}
      style={{
        border: '1px solid var(--border, var(--line))',
        borderRadius: 12,
        background: 'var(--surface, var(--bg-soft))',
        padding: '0.85rem 1rem',
        ...style,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '0.75rem',
          alignItems: 'center',
          marginBottom: '0.65rem',
        }}
      >
        <span style={{ fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          JSON explorer
        </span>
        <CopyButton text={pretty} label="Copy full JSON" />
      </div>
      <NodeRow
        name={rootLabel}
        path=""
        value={data}
        depth={0}
        defaultExpandDepth={defaultExpandDepth}
        initialChildLimit={initialChildLimit}
      />
    </div>
  );
}
