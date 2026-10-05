'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { resolveApiToken } from '@/lib/dev-auth';
import { AppShell } from '@/components/app-shell';
import { AnalyticsSection, StatsCard } from '@/components/analytics';

type Recipe = {
  id: string;
  title: string;
  blurb: string;
  intent: string;
  pipeline: string[];
  sampleInput: { text: string; source?: string; target?: string };
  successLooksLike: string;
};

type Reco = {
  intent: string;
  budget: string;
  reason: string;
  howToTest: string;
  sampleInput: { text: string; source?: string; target?: string };
  primary: { id: string; title: string; costTier: string; marketingLine: string; consolePath: string };
  compareWith: { id: string; title: string; costTier: string; consolePath: string } | null;
  pipeline: Array<{ id: string; title: string; costTier: string }>;
  recipe: { id: string; title: string; successLooksLike: string } | null;
};

type TryResult = {
  familyId: string;
  title: string;
  costTier: string;
  kind: string;
  latencyMs: number;
  costHint?: { credits?: number; tip?: string };
  output: Record<string, unknown>;
};

function audioFromBase64(b64: string, mime: string) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: mime }));
}

export function ModelLabClient() {
  const { getToken, isLoaded } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [goal, setGoal] = useState('I need to translate English product copy into Swahili and speak it for an IVR.');
  const [budget, setBudget] = useState<'frugal' | 'balanced' | 'quality'>('balanced');
  const [recipeId, setRecipeId] = useState('');
  const [reco, setReco] = useState<Reco | null>(null);
  const [text, setText] = useState('');
  const [source, setSource] = useState('en');
  const [target, setTarget] = useState('sw');
  const [left, setLeft] = useState<TryResult | null>(null);
  const [right, setRight] = useState<TryResult | null>(null);
  const [leftAudio, setLeftAudio] = useState<string | null>(null);
  const [rightAudio, setRightAudio] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pickNote, setPickNote] = useState<string | null>(null);

  const loadRecipes = useCallback(async () => {
    const res = await apiFetch<{ recipes: Recipe[] }>('/v1/own-models/lab/recipes');
    setRecipes(res.recipes);
  }, []);

  useEffect(() => {
    void loadRecipes().catch((err: Error) => setError(err.message));
  }, [loadRecipes]);

  useEffect(() => {
    return () => {
      if (leftAudio) URL.revokeObjectURL(leftAudio);
      if (rightAudio) URL.revokeObjectURL(rightAudio);
    };
  }, [leftAudio, rightAudio]);

  async function recommend(nextRecipeId?: string) {
    setBusy(true);
    setError(null);
    setPickNote(null);
    try {
      const body = {
        goal,
        budget,
        recipeId: nextRecipeId || recipeId || undefined,
      };
      const res = await apiFetch<Reco>('/v1/own-models/lab/recommend', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setReco(res);
      setText(res.sampleInput.text);
      setSource(res.sampleInput.source ?? 'en');
      setTarget(res.sampleInput.target ?? 'sw');
      setLeft(null);
      setRight(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Recommend failed');
    } finally {
      setBusy(false);
    }
  }

  async function compareLive() {
    if (!reco?.primary) return;
    setBusy(true);
    setError(null);
    setPickNote(null);
    try {
      const token = await resolveApiToken(getToken);
      if (!token) throw new Error('Not signed in — use /dev-login');
      const rightId = reco.compareWith?.id ?? reco.pipeline[1]?.id ?? reco.primary.id;
      const res = await apiFetch<{ left: TryResult; right: TryResult; tip: string }>(
        '/v1/own-models/lab/compare',
        {
          token,
          method: 'POST',
          body: JSON.stringify({
            leftFamilyId: reco.primary.id,
            rightFamilyId: rightId,
            text,
            source,
            target,
          }),
        },
      );
      setLeft(res.left);
      setRight(res.right);
      if (leftAudio) URL.revokeObjectURL(leftAudio);
      if (rightAudio) URL.revokeObjectURL(rightAudio);
      const lAudio = res.left.output.audioBase64
        ? audioFromBase64(String(res.left.output.audioBase64), String(res.left.output.mimeType ?? 'audio/mpeg'))
        : null;
      const rAudio = res.right.output.audioBase64
        ? audioFromBase64(String(res.right.output.audioBase64), String(res.right.output.mimeType ?? 'audio/mpeg'))
        : null;
      setLeftAudio(lAudio);
      setRightAudio(rAudio);
      setPickNote(res.tip);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Compare failed');
    } finally {
      setBusy(false);
    }
  }

  async function prefer(winnerId: string, loserId?: string) {
    setBusy(true);
    setError(null);
    try {
      const token = await resolveApiToken(getToken);
      if (!token) throw new Error('Not signed in');
      const res = await apiFetch<{ message: string; next: string }>('/v1/own-models/lab/prefer', {
        token,
        method: 'POST',
        body: JSON.stringify({ winnerId, loserId, goal }),
      });
      setPickNote(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save preference');
    } finally {
      setBusy(false);
    }
  }

  if (!isLoaded) {
    return (
      <AppShell>
        <p style={{ color: 'var(--muted)' }}>Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <p style={{ color: 'var(--muted)', margin: '0 0 0.5rem' }}>
        <Link href="/own-models">Own Models</Link>
        {' · '}
        <Link href="/playground">Playground</Link>
        {' · '}
        <Link href="/model-release">Model Release</Link>
      </p>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.85rem',
          fontWeight: 720,
          letterSpacing: '-0.03em',
          margin: '0 0 0.35rem',
        }}
      >
        Model Lab
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.25rem', maxWidth: '46rem' }}>
        Don’t know which model to use? Describe the project, get a stack, then live-compare before you commit.
      </p>

      {error ? <p style={{ color: 'var(--bad)' }}>{error}</p> : null}

      <AnalyticsSection title="1. What are you building?" subtitle="Plain language is fine — or pick a recipe.">
        <div style={{ display: 'grid', gap: '0.75rem', maxWidth: '40rem' }}>
          <label style={{ display: 'grid', gap: '0.3rem' }}>
            <span style={label}>Your project</span>
            <textarea
              className="vl-field"
              rows={3}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Transcribe Yoruba calls and summarize them for supervisors"
            />
          </label>
          <label style={{ display: 'grid', gap: '0.3rem' }}>
            <span style={label}>Budget</span>
            <select className="vl-field" value={budget} onChange={(e) => setBudget(e.target.value as typeof budget)}>
              <option value="frugal">Frugal — cheapest specialist</option>
              <option value="balanced">Balanced — default</option>
              <option value="quality">Quality — allow premium escalate</option>
            </select>
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {recipes.map((r) => (
              <button
                key={r.id}
                type="button"
                className="vl-btn"
                style={{ fontSize: '0.82rem' }}
                onClick={() => {
                  setRecipeId(r.id);
                  setGoal(r.blurb);
                  void recommend(r.id);
                }}
              >
                {r.title}
              </button>
            ))}
          </div>
          <button type="button" className="vl-btn vl-btn-primary" disabled={busy} onClick={() => void recommend()}>
            {busy ? 'Working…' : 'Recommend models'}
          </button>
        </div>
      </AnalyticsSection>

      {reco ? (
        <>
          <section className="vl-stat-grid" style={{ margin: '1.25rem 0' }}>
            <StatsCard label="Intent" value={reco.intent} hint={reco.reason} tone="brand" />
            <StatsCard
              label="Primary"
              value={reco.primary.title}
              hint={`${reco.primary.costTier} · ${reco.primary.id}`}
              tone="ok"
            />
            <StatsCard
              label="Compare with"
              value={reco.compareWith?.title ?? '—'}
              hint={reco.compareWith ? reco.compareWith.costTier : 'same family'}
              tone="warn"
            />
            <StatsCard
              label="Pipeline"
              value={String(reco.pipeline.length)}
              hint={reco.pipeline.map((p) => p.id).join(' → ')}
            />
          </section>

          <p style={{ color: 'var(--muted)', maxWidth: '46rem', fontSize: '0.9rem' }}>
            {reco.primary.marketingLine} {reco.howToTest}
            {reco.recipe ? ` Success looks like: ${reco.recipe.successLooksLike}` : ''}
          </p>

          <AnalyticsSection title="2. Live sample" subtitle="Same input through primary vs alternate.">
            <div style={{ display: 'grid', gap: '0.75rem', maxWidth: '40rem' }}>
              <label style={{ display: 'grid', gap: '0.3rem' }}>
                <span style={label}>Sample text</span>
                <textarea className="vl-field" rows={3} value={text} onChange={(e) => setText(e.target.value)} />
              </label>
              <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                <label style={{ display: 'grid', gap: '0.3rem' }}>
                  <span style={label}>Source</span>
                  <input className="vl-field" value={source} onChange={(e) => setSource(e.target.value)} style={{ width: 90 }} />
                </label>
                <label style={{ display: 'grid', gap: '0.3rem' }}>
                  <span style={label}>Target</span>
                  <input className="vl-field" value={target} onChange={(e) => setTarget(e.target.value)} style={{ width: 90 }} />
                </label>
              </div>
              <button type="button" className="vl-btn vl-btn-primary" disabled={busy || !text.trim()} onClick={() => void compareLive()}>
                {busy ? 'Running…' : 'Live compare'}
              </button>
            </div>
          </AnalyticsSection>
        </>
      ) : null}

      {left && right ? (
        <AnalyticsSection title="3. Which is clearer?" subtitle="Pick a winner — we’ll remember for this org.">
          <div
            style={{
              display: 'grid',
              gap: '1rem',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            }}
          >
            <ResultCard
              result={left}
              audioUrl={leftAudio}
              onPrefer={() => void prefer(left.familyId, right.familyId)}
              busy={busy}
            />
            <ResultCard
              result={right}
              audioUrl={rightAudio}
              onPrefer={() => void prefer(right.familyId, left.familyId)}
              busy={busy}
            />
          </div>
          {pickNote ? <p style={{ marginTop: '0.75rem', color: 'var(--muted)' }}>{pickNote}</p> : null}
          {reco ? (
            <p style={{ marginTop: '0.75rem' }}>
              Open primary console:{' '}
              <Link href={reco.primary.consolePath}>{reco.primary.title}</Link>
              {reco.compareWith ? (
                <>
                  {' · '}
                  <Link href={reco.compareWith.consolePath}>{reco.compareWith.title}</Link>
                </>
              ) : null}
            </p>
          ) : null}
        </AnalyticsSection>
      ) : null}
    </AppShell>
  );
}

function ResultCard({
  result,
  audioUrl,
  onPrefer,
  busy,
}: {
  result: TryResult;
  audioUrl: string | null;
  onPrefer: () => void;
  busy: boolean;
}) {
  const text =
    (result.output.text as string | undefined) ||
    (result.output.translatedText as string | undefined) ||
    (result.output.note as string | undefined) ||
    JSON.stringify(result.output, null, 2);

  return (
    <div className="vl-panel" style={{ padding: '1rem', display: 'grid', gap: '0.65rem' }}>
      <div>
        <strong>{result.title}</strong>
        <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
          {result.familyId} · {result.costTier} · {result.kind} · {result.latencyMs}ms
          {result.costHint?.credits != null ? ` · ~${result.costHint.credits} credits` : ''}
        </div>
      </div>
      <pre
        className="vl-code"
        style={{
          margin: 0,
          padding: '0.75rem',
          background: 'var(--bg-soft)',
          borderRadius: 10,
          maxHeight: '14rem',
          overflow: 'auto',
          whiteSpace: 'pre-wrap',
          fontSize: '0.82rem',
        }}
      >
        {text}
      </pre>
      {audioUrl ? <audio controls src={audioUrl} style={{ width: '100%' }} /> : null}
      <button type="button" className="vl-btn" disabled={busy} onClick={onPrefer}>
        This is clearer
      </button>
    </div>
  );
}

const label: React.CSSProperties = {
  fontSize: '0.8rem',
  fontWeight: 650,
  color: 'var(--muted)',
};
