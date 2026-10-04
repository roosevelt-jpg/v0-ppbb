/**
 * African quality eval harness — Own AI vs English-centric vendor baseline stub.
 * Honest metrics: exact match + domain coverage. Not MMLU/SOTA claims.
 */

import { allEvalCases, translateAfrican } from './african-linguistic-engine';

export type EvalCaseResult = {
  source: string;
  target: string;
  text: string;
  expected: string;
  domain: string;
  ownAi: string;
  baseline: string;
  ownMatch: boolean;
  baselineMatch: boolean;
  ownWins: boolean;
};

export type EvalReport = {
  suite: 'african-linguistic-quality';
  ranAt: string;
  total: number;
  ownExactMatch: number;
  baselineExactMatch: number;
  ownWinRate: number;
  baselineWinRate: number;
  byPair: Record<string, { total: number; own: number; baseline: number }>;
  byDomain: Record<string, { total: number; own: number; baseline: number }>;
  honesty: {
    sotaClaimsForbidden: true;
    vendorBaselineIsStub: true;
    neuralLiveEvalRequired: boolean;
    note: string;
  };
  sample: EvalCaseResult[];
};

/** English-centric vendor stub: echoes source, fails African targets. */
export function vendorBaselineTranslate(input: {
  text: string;
  source: string;
  target: string;
}): string {
  // Pretend a generic rented MT that barely covers African pairs.
  if (input.target === 'en') return input.text;
  if (input.text.trim().toLowerCase() === 'hello' && input.target === 'sw') return 'jambo'; // weak/partial
  return input.text; // fail-closed echo
}

export function runAfricanQualityEval(limitSample = 12): EvalReport {
  const cases = allEvalCases();
  const results: EvalCaseResult[] = [];
  const byPair: EvalReport['byPair'] = {};
  const byDomain: EvalReport['byDomain'] = {};

  for (const c of cases) {
    const own = translateAfrican({ text: c.text, source: c.source, target: c.target });
    const baseline = vendorBaselineTranslate({
      text: c.text,
      source: c.source,
      target: c.target,
    });
    const ownMatch = own.text === c.expected;
    const baselineMatch = baseline === c.expected;
    const pair = `${c.source}-${c.target}`;
    byPair[pair] ??= { total: 0, own: 0, baseline: 0 };
    byPair[pair]!.total += 1;
    if (ownMatch) byPair[pair]!.own += 1;
    if (baselineMatch) byPair[pair]!.baseline += 1;
    byDomain[c.domain] ??= { total: 0, own: 0, baseline: 0 };
    byDomain[c.domain]!.total += 1;
    if (ownMatch) byDomain[c.domain]!.own += 1;
    if (baselineMatch) byDomain[c.domain]!.baseline += 1;
    results.push({
      source: c.source,
      target: c.target,
      text: c.text,
      expected: c.expected,
      domain: c.domain,
      ownAi: own.text,
      baseline,
      ownMatch,
      baselineMatch,
      ownWins: ownMatch && !baselineMatch,
    });
  }

  const ownExactMatch = results.filter((r) => r.ownMatch).length;
  const baselineExactMatch = results.filter((r) => r.baselineMatch).length;
  const total = results.length || 1;

  return {
    suite: 'african-linguistic-quality',
    ranAt: new Date().toISOString(),
    total: results.length,
    ownExactMatch,
    baselineExactMatch,
    ownWinRate: Number((ownExactMatch / total).toFixed(4)),
    baselineWinRate: Number((baselineExactMatch / total).toFixed(4)),
    byPair,
    byDomain,
    honesty: {
      sotaClaimsForbidden: true,
      vendorBaselineIsStub: true,
      neuralLiveEvalRequired: !process.env.VERBALAB_WEIGHTS_URL?.trim(),
      note:
        'Scores are exact-match on owned African lexicon packs vs a weak English-centric vendor stub. Live neural weights still need separate eval when VERBALAB_WEIGHTS_URL is set.',
    },
    sample: results.filter((r) => r.ownWins).slice(0, limitSample),
  };
}
