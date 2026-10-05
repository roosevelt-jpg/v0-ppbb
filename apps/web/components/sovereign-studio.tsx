'use client';

import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { resolveApiToken } from '@/lib/dev-auth';
import { AppShell } from '@/components/app-shell';
import { hidePhaseIds, hidePhaseIdsInCopyFields } from '@/lib/ui-copy';
import type { MoonshotAction } from '@/components/moonshot-console';

export const SOVEREIGN_SIBLINGS = [
  { href: '/national-voice-runtime', label: 'National Runtime' },
  { href: '/civic-voice-evidence', label: 'Evidence' },
  { href: '/voice-law-authenticity', label: 'Voice Law Auth' },
  { href: '/model-release', label: 'Model Release' },
  { href: '/mutual-intelligibility', label: 'Corridors' },
  { href: '/institutional-voice', label: 'Institutional' },
  { href: '/offline-mesh-voice', label: 'Offline Mesh' },
] as const;

type Props = {
  title: string;
  apiBase: string;
  actions: MoonshotAction[];
  siblingLinks?: Array<{ href: string; label: string }>;
};

function humanizeResult(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return hidePhaseIds(value);
  if (typeof value === 'number' || typeof value === 'boolean') return 'Ready.';
  if (Array.isArray(value)) {
    const lines = value.map((item) => humanizeResult(item)).filter(Boolean);
    if (!lines.length) return 'Nothing to show yet.';
    return lines.slice(0, 6).join('\n');
  }
  if (typeof value === 'object') {
    const obj = hidePhaseIdsInCopyFields(value as Record<string, unknown>);
    const prefer = [
      'answer',
      'bridgedText',
      'note',
      'effect',
      'message',
      'reason',
      'residencyNote',
      'band',
      'recommendation',
    ];
    for (const key of prefer) {
      if (typeof obj[key] === 'string' && obj[key]) return hidePhaseIds(String(obj[key]));
    }
    if (obj.allowed === false && typeof obj.reason === 'string') {
      return hidePhaseIds(String(obj.reason));
    }
    if (obj.refused === true && typeof obj.reason === 'string') {
      return hidePhaseIds(String(obj.reason));
    }
    if (obj.ok === true) return 'Evidence chain integrity confirmed.';
    if (obj.ok === false) return 'Evidence chain needs attention.';
    if (obj.zone && typeof obj.zone === 'object') {
      const z = obj.zone as Record<string, unknown>;
      const place = String(z.countryCode ?? z.ministry ?? '').trim();
      return hidePhaseIds(
        place
          ? `National zone is live${z.killSwitchArmed ? ' with hold engaged' : ''}.`
          : `National zone is live${z.killSwitchArmed ? ' with hold engaged' : ''}.`,
      );
    }
    if (obj.record && typeof obj.record === 'object') {
      return 'Utterance sealed into the civic evidence chain.';
    }
    if (obj.receipt && typeof obj.receipt === 'object') {
      return 'Mesh sync complete. Offline jobs drained quietly.';
    }
    if (obj.agency && typeof obj.agency === 'object') {
      return 'Agency voice registered for policy-bound speech.';
    }
    if (obj.doc && typeof obj.doc === 'object') {
      return 'Policy corpus updated. Answers will stay on the record.';
    }
    if (obj.node && typeof obj.node === 'object') {
      return 'Edge node joined the offline mesh.';
    }
    if (obj.audio && typeof obj.audio === 'object') {
      const answer = typeof obj.answer === 'string' ? hidePhaseIds(obj.answer) : '';
      return answer ? `${answer}\n\nVoice synthesis ready.` : 'Voice synthesis ready.';
    }
    if (Array.isArray(obj.steps)) {
      return 'Deployment recipe composed across residency, evidence, corridors, institutional voice, and mesh.';
    }
    if (Array.isArray(obj.pillars)) {
      return hidePhaseIds(
        (obj.pillars as Array<{ title?: string }>)
          .map((p) => p.title)
          .filter(Boolean)
          .join(' · ') || 'Sovereign pillars are online.',
      );
    }
    if (Array.isArray(obj.corridors)) {
      return hidePhaseIds(
        (obj.corridors as Array<{ name?: string }>)
          .map((c) => c.name)
          .filter(Boolean)
          .join(' · ') || 'Regional corridors are ready.',
      );
    }
    if (Array.isArray(obj.zones)) {
      return (obj.zones as unknown[]).length
        ? 'National zones are active beneath the surface.'
        : 'No zones yet — create one to begin.';
    }
    if (Array.isArray(obj.nodes)) {
      return (obj.nodes as unknown[]).length
        ? 'Mesh nodes are registered and waiting for sync.'
        : 'No mesh nodes yet.';
    }
    if (Array.isArray(obj.docs)) {
      return (obj.docs as unknown[]).length
        ? 'Policy corpus is loaded for institutional answers.'
        : 'Corpus is empty — ingest an approved policy first.';
    }
    if (Array.isArray(obj.records) || Array.isArray(obj.chain)) {
      return 'Recent seals are available in the evidence chain.';
    }
    if (Array.isArray(obj.checklist)) {
      return 'Buyer readiness is mapped — residency, agreements, zones, evidence, corridors, corpus, mesh.';
    }
    if (obj.realtime || obj.sdk || obj.plugins) {
      return 'SDK, partner plugins, and the realtime channel are wired for sovereign deployments.';
    }
    if (typeof obj.title === 'string') return hidePhaseIds(obj.title);
    if (typeof obj.score === 'number' || typeof obj.band === 'string') {
      return typeof obj.band === 'string'
        ? hidePhaseIds(`Corridor affinity: ${obj.band}`)
        : 'Corridor pair scored.';
    }
  }
  return 'Done.';
}

export function SovereignStudio({ title, apiBase, actions, siblingLinks = [...SOVEREIGN_SIBLINGS] }: Props) {
  const { getToken, isLoaded } = useAuth();
  const [blurb, setBlurb] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [streamState, setStreamState] = useState<'idle' | 'live' | 'off'>('idle');
  const [activeAction, setActiveAction] = useState(actions[0]?.id ?? '');
  const [values, setValues] = useState<Record<string, string>>({});
  const [pulse, setPulse] = useState(false);

  const action = useMemo(
    () => actions.find((a) => a.id === activeAction) ?? actions[0],
    [actions, activeAction],
  );

  const load = useCallback(async () => {
    const token = await resolveApiToken(getToken);
    if (!token) throw new Error('Sign in to open Sovereign Voice');
    const eng = await apiFetch<{ title?: string; blurb?: string }>(`${apiBase}/engine`, { token });
    setBlurb(hidePhaseIds(eng.blurb ?? ''));
  }, [apiBase, getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let cancelled = false;
    void (async () => {
      try {
        const token = await resolveApiToken(getToken);
        if (!token || cancelled) return;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';
        const wsUrl = apiUrl.replace(/^http/, 'ws').replace(/\/$/, '') + '/v1/sovereign-voice-os/stream';
        ws = new WebSocket(`${wsUrl}?token=${encodeURIComponent(token)}`);
        ws.onopen = () => setStreamState('live');
        ws.onclose = () => setStreamState('off');
        ws.onerror = () => setStreamState('off');
        ws.onmessage = () => {
          setPulse(true);
          window.setTimeout(() => setPulse(false), 700);
        };
      } catch {
        setStreamState('off');
      }
    })();
    return () => {
      cancelled = true;
      ws?.close();
    };
  }, [getToken]);

  async function onRun(event: FormEvent) {
    event.preventDefault();
    if (!action) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const token = await resolveApiToken(getToken);
      if (!token) throw new Error('Sign in required');
      const pathParams = new Set<string>();
      const method = action.method ?? 'POST';
      const resolvedPath = action.path.replace(/\{([a-zA-Z0-9_]+)\}/g, (_m, key: string) => {
        pathParams.add(key);
        const value = values[key]?.trim();
        if (!value) throw new Error(`${key} is required`);
        return encodeURIComponent(value);
      });
      const path = resolvedPath.startsWith('/v1/') ? resolvedPath : `${apiBase}/${resolvedPath}`;
      const bodyValues = Object.fromEntries(
        Object.entries(values).filter(([key]) => !pathParams.has(key)),
      );
      const out = await apiFetch<unknown>(path, {
        method,
        token,
        ...(method === 'GET'
          ? {}
          : { body: JSON.stringify(action.buildBody ? action.buildBody(bodyValues) : bodyValues) }),
      });
      setResult(humanizeResult(out));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <main
        className="sovereign-studio"
        style={{
          padding: '1.75rem 1.5rem 3rem',
          maxWidth: 920,
          background:
            'radial-gradient(1200px 480px at 10% -10%, rgba(15,118,110,0.14), transparent 55%), radial-gradient(900px 420px at 92% 0%, rgba(180,83,9,0.1), transparent 50%), linear-gradient(180deg, rgba(255,255,255,0.02), transparent 40%)',
        }}
      >
        <style>{`
          .sovereign-studio h1 {
            animation: sovereign-rise 700ms ease-out both;
          }
          .sovereign-studio .sovereign-blurb {
            animation: sovereign-rise 900ms ease-out both;
          }
          .sovereign-studio .sovereign-pulse {
            box-shadow: 0 0 0 0 rgba(15,118,110,0.45);
            animation: sovereign-glow 1.8s ease-in-out infinite;
          }
          .sovereign-studio .sovereign-pulse.live-hit {
            animation: sovereign-hit 700ms ease-out;
          }
          .sovereign-studio .sovereign-result {
            animation: sovereign-rise 420ms ease-out both;
          }
          @keyframes sovereign-rise {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes sovereign-glow {
            0%, 100% { box-shadow: 0 0 0 0 rgba(15,118,110,0.25); }
            50% { box-shadow: 0 0 0 6px rgba(15,118,110,0); }
          }
          @keyframes sovereign-hit {
            0% { transform: scale(1); background: #0f766e; }
            40% { transform: scale(1.35); background: #14b8a6; }
            100% { transform: scale(1); background: #0f766e; }
          }
        `}</style>
        <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.9rem' }}>
          <Link href="/sovereign-voice-os">Sovereign Voice</Link>
          {siblingLinks.map((link) => (
            <span key={link.href}>
              {' · '}
              <Link href={link.href}>{link.label}</Link>
            </span>
          ))}
        </p>
        <h1
          style={{
            margin: '0.65rem 0 0.4rem',
            fontFamily: 'var(--font-display)',
            letterSpacing: '-0.03em',
            fontSize: 'clamp(1.85rem, 3vw, 2.4rem)',
          }}
        >
          {title}
        </h1>
        <p
          className="sovereign-blurb"
          style={{ color: 'var(--muted)', margin: '0 0 1.5rem', maxWidth: '40rem', lineHeight: 1.55 }}
        >
          {blurb || 'African voice intelligence for ministries, banks, and continent-scale operators.'}
        </p>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: '1.25rem',
            color: 'var(--muted)',
            fontSize: '0.85rem',
          }}
        >
          <span
            className={`sovereign-pulse${pulse ? ' live-hit' : ''}`}
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: streamState === 'live' ? '#0f766e' : '#a1a1aa',
              display: 'inline-block',
            }}
          />
          {streamState === 'live' ? 'Realtime channel connected' : 'Realtime channel standby'}
        </div>

        {error ? <p style={{ color: 'var(--bad)' }}>{error}</p> : null}

        <section style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {actions.map((a) => (
              <button
                key={a.id}
                type="button"
                className={`vl-btn ${a.id === action?.id ? 'vl-btn-primary' : 'vl-btn-secondary'}`}
                onClick={() => {
                  setActiveAction(a.id);
                  setResult(null);
                }}
                disabled={busy}
              >
                {a.label}
              </button>
            ))}
          </div>

          {action ? (
            <form
              onSubmit={onRun}
              className="vl-panel"
              style={{
                padding: '1.35rem',
                display: 'grid',
                gap: '0.75rem',
                border: 'none',
                background: 'var(--bg-soft)',
              }}
            >
              {(action.fields ?? []).map((field) =>
                field.type === 'textarea' ? (
                  <label key={field.name} style={{ display: 'grid', gap: 6 }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{field.label}</span>
                    <textarea
                      className="vl-input"
                      rows={4}
                      value={values[field.name] ?? ''}
                      placeholder={field.placeholder}
                      onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                    />
                  </label>
                ) : (
                  <label key={field.name} style={{ display: 'grid', gap: 6 }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{field.label}</span>
                    <input
                      className="vl-input"
                      value={values[field.name] ?? ''}
                      placeholder={field.placeholder}
                      onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                    />
                  </label>
                ),
              )}
              <button type="submit" className="vl-btn vl-btn-primary" disabled={busy} style={{ justifySelf: 'start' }}>
                {busy ? 'Working…' : action.label}
              </button>
            </form>
          ) : null}

          {result ? (
            <div
              className="sovereign-result"
              style={{
                padding: '1.1rem 1.25rem',
                borderLeft: '3px solid #0f766e',
                background: 'rgba(15,118,110,0.06)',
                lineHeight: 1.55,
                whiteSpace: 'pre-wrap',
              }}
            >
              {result}
            </div>
          ) : null}
        </section>
      </main>
    </AppShell>
  );
}
