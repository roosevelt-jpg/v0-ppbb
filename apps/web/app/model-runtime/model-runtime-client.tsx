'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Engine = {
  title?: string;
  blurb?: string;
  safety?: { note?: string };
  deploy?: Record<string, unknown>;
  weights?: { status?: string; mode?: string };
  africanEngine?: { lexiconEntries?: number; lexiconPairs?: string[] };
  local?: { modalities?: Record<string, boolean> };
};

type EvalReport = {
  ownWinRate?: number;
  baselineWinRate?: number;
  total?: number;
  byPair?: Record<string, { total: number; own: number; baseline: number }>;
  honesty?: { note?: string };
};

type Unlock = {
  sector: string;
  productionReady: boolean;
  missing: string[];
  requirements?: Array<{ id: string; label: string; met: boolean }>;
};

type Unlocks = {
  productionUnlocks?: Unlock[];
  honesty?: { note?: string };
};

type Smoke = {
  mt?: { text?: string };
  chat?: { message?: { content?: string } };
  detect?: { language?: string };
  embed?: { dimensions?: number };
  stt?: { provider?: string; language?: string };
  tts?: { bytes?: number; voices?: Array<{ id: string; name: string }> };
  ocr?: { provider?: string };
};

const SECTOR_REQS: Record<string, string[]> = {
  government: [
    'data_residency',
    'audit_trail',
    'sovereign_mt',
    'access_control',
    'dpa',
    'human_review',
  ],
  banking: [
    'data_residency',
    'audit_trail',
    'sovereign_mt',
    'pci_scope',
    'fraud_review',
    'dpa',
  ],
  hospital: [
    'data_residency',
    'audit_trail',
    'sovereign_mt',
    'clinical_safety',
    'baa',
    'no_diagnosis',
  ],
};

export function ModelRuntimeClient() {
  const [engine, setEngine] = useState<Engine | null>(null);
  const [evalReport, setEvalReport] = useState<EvalReport | null>(null);
  const [unlocks, setUnlocks] = useState<Unlocks | null>(null);
  const [smoke, setSmoke] = useState<Smoke | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState('hello');
  const [target, setTarget] = useState('sw');
  const [translated, setTranslated] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function refresh() {
    const [e, ev, u, s] = await Promise.all([
      apiFetch<Engine>('/v1/model-runtime/engine'),
      apiFetch<EvalReport>('/v1/model-runtime/eval'),
      apiFetch<Unlocks>('/v1/model-runtime/unlocks'),
      apiFetch<Smoke>('/v1/model-runtime/modalities/smoke'),
    ]);
    setEngine(e);
    setEvalReport(ev);
    setUnlocks(u);
    setSmoke(s);
  }

  useEffect(() => {
    void refresh().catch((err: Error) => setError(err.message));
  }, []);

  async function runTranslate() {
    setBusy('translate');
    setError(null);
    try {
      const out = await apiFetch<{ text: string }>('/v1/model-runtime/gateway/translate', {
        method: 'POST',
        body: JSON.stringify({ text, source: 'en', target }),
      });
      setTranslated(out.text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'translate failed');
    } finally {
      setBusy(null);
    }
  }

  async function assertSector(sector: string) {
    setBusy(sector);
    setError(null);
    try {
      await apiFetch(`/v1/model-runtime/unlocks/${sector}/assert`, {
        method: 'POST',
        body: JSON.stringify({ metIds: SECTOR_REQS[sector] ?? [] }),
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'unlock assert failed');
    } finally {
      setBusy(null);
    }
  }

  const modalities = engine?.local?.modalities ?? {};

  return (
    <AppShell>
      <main style={{ padding: '1.5rem', maxWidth: 960 }}>
        <p style={{ color: 'var(--muted)' }}>
          <Link href="/translate-fm">Translate FM</Link>
          {' · '}
          <Link href="/model-keys">Model keys</Link>
          {' · '}
          <Link href="/credentials-readiness">Credentials</Link>
          {' · '}
          <Link href="/enterprise-nation-platform">Enterprise Nation</Link>
        </p>
        <h1 style={{ fontSize: '1.75rem', margin: '0.5rem 0' }}>Model Runtime</h1>
        <p>{engine?.blurb ?? 'VerbaLab Own AI local runtime.'}</p>
        {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
        {engine?.safety?.note ? (
          <p style={{ color: 'var(--muted)' }}>{engine.safety.note}</p>
        ) : null}

        <h2 style={{ marginTop: '1.75rem', fontSize: '1.15rem' }}>What&apos;s honest to say out loud</h2>
        <ul style={{ lineHeight: 1.6, paddingLeft: '1.2rem' }}>
          <li>
            Local Own AI runtime is multimodal in-process (
            {Object.entries(modalities)
              .filter(([, v]) => v)
              .map(([k]) => k)
              .join(', ') || 'loading…'}
            ) — {engine?.africanEngine?.lexiconEntries ?? '…'} lexicon entries.
          </li>
          <li>
            African quality eval: Own AI{' '}
            {evalReport?.ownWinRate != null ? `${(evalReport.ownWinRate * 100).toFixed(1)}%` : '…'}{' '}
            exact-match vs vendor baseline stub{' '}
            {evalReport?.baselineWinRate != null
              ? `${(evalReport.baselineWinRate * 100).toFixed(1)}%`
              : '…'}{' '}
            on {evalReport?.total ?? '…'} cases.
          </li>
          <li>
            Gov / bank / hospital production unlocks are checklist-gated
            {unlocks?.productionUnlocks
              ? ` — ${unlocks.productionUnlocks.filter((u) => u.productionReady).length}/${unlocks.productionUnlocks.length} unlocked`
              : ''}
            .
          </li>
          <li>
            Neural weights: {engine?.weights?.status ?? '…'} ({engine?.weights?.mode ?? '…'}) via
            VERBALAB_WEIGHTS_URL — not git-shipped SOTA.
          </li>
        </ul>

        <h2 style={{ marginTop: '1.75rem', fontSize: '1.15rem' }}>Try local MT</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ minWidth: 220, padding: '0.4rem 0.6rem' }}
            aria-label="Source text"
          />
          <select value={target} onChange={(e) => setTarget(e.target.value)} aria-label="Target language">
            <option value="sw">sw</option>
            <option value="yo">yo</option>
            <option value="am">am</option>
            <option value="ha">ha</option>
            <option value="zu">zu</option>
          </select>
          <button type="button" onClick={() => void runTranslate()} disabled={busy === 'translate'}>
            {busy === 'translate' ? 'Translating…' : 'Translate'}
          </button>
        </div>
        {translated ? <p style={{ marginTop: 8 }}>→ {translated}</p> : null}

        <h2 style={{ marginTop: '1.75rem', fontSize: '1.15rem' }}>Modality smoke</h2>
        <pre style={{ background: 'var(--surface, #f4f4f5)', padding: 12, overflow: 'auto' }}>
          {JSON.stringify(
            {
              mt: smoke?.mt?.text,
              chat: smoke?.chat?.message?.content?.slice(0, 80),
              detect: smoke?.detect?.language,
              embedDims: smoke?.embed?.dimensions,
              stt: smoke?.stt,
              ttsBytes: smoke?.tts?.bytes,
              ocr: smoke?.ocr?.provider,
            },
            null,
            2,
          )}
        </pre>

        <h2 style={{ marginTop: '1.75rem', fontSize: '1.15rem' }}>Eval by pair</h2>
        <pre style={{ background: 'var(--surface, #f4f4f5)', padding: 12, overflow: 'auto' }}>
          {JSON.stringify(evalReport?.byPair ?? {}, null, 2)}
        </pre>

        <h2 style={{ marginTop: '1.75rem', fontSize: '1.15rem' }}>Enterprise unlocks</h2>
        <div style={{ display: 'grid', gap: 12 }}>
          {(unlocks?.productionUnlocks ?? []).map((u) => (
            <div key={u.sector} style={{ borderTop: '1px solid var(--border, #e4e4e7)', paddingTop: 8 }}>
              <strong style={{ textTransform: 'capitalize' }}>{u.sector}</strong>
              {' — '}
              {u.productionReady ? 'production ready' : `locked (${u.missing.join(', ') || 'checklist'})`}
              {!u.productionReady ? (
                <>
                  {' '}
                  <button
                    type="button"
                    onClick={() => void assertSector(u.sector)}
                    disabled={busy === u.sector}
                  >
                    {busy === u.sector ? 'Unlocking…' : 'Assert checklist'}
                  </button>
                </>
              ) : null}
            </div>
          ))}
        </div>

        <h2 style={{ marginTop: '1.75rem', fontSize: '1.15rem' }}>Deploy shape</h2>
        <pre style={{ background: 'var(--surface, #f4f4f5)', padding: 12, overflow: 'auto' }}>
          {JSON.stringify(engine?.deploy ?? {}, null, 2)}
        </pre>
      </main>
    </AppShell>
  );
}
