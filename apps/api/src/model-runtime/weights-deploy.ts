/**
 * Neural weight deploy probe — VERBALAB_WEIGHTS_URL is a real upgrade path.
 * Binaries stay off-repo; runtime falls back to local lexicon when unreachable.
 */

export type WeightsDeployStatus = {
  status: 'absent' | 'ready' | 'unreachable' | 'invalid';
  mode: 'local_lexicon' | 'neural_remote' | 'http_model_pods';
  weightsUrl: string | null;
  manifestUrl: string | null;
  manifest: Record<string, unknown> | null;
  families: string[];
  honesty: {
    weightBinariesInRepo: false;
    sotaClaimsForbidden: true;
    note: string;
  };
};

function familiesFromManifest(manifest: Record<string, unknown> | null): string[] {
  if (!manifest) return [];
  const f = manifest.families ?? manifest.models;
  if (Array.isArray(f)) return f.map(String);
  return ['translate-fm', 'echo', 'voice-fm', 'atlas', 'vector-fm', 'vision-fm'];
}

export async function probeWeightsDeploy(): Promise<WeightsDeployStatus> {
  const weightsUrl = process.env.VERBALAB_WEIGHTS_URL?.trim() || null;
  const basePods = process.env.VERBALAB_MODEL_BASE_URL?.trim() || null;
  const honesty = {
    weightBinariesInRepo: false as const,
    sotaClaimsForbidden: true as const,
    note:
      'Weight binaries are deploy artifacts. Absent/unreachable URL keeps local African lexicon runtime active.',
  };

  if (!weightsUrl) {
    return {
      status: 'absent',
      mode: basePods ? 'http_model_pods' : 'local_lexicon',
      weightsUrl: null,
      manifestUrl: null,
      manifest: null,
      families: [],
      honesty,
    };
  }

  const manifestUrl = weightsUrl.endsWith('.json')
    ? weightsUrl
    : `${weightsUrl.replace(/\/$/, '')}/manifest.json`;

  try {
    const response = await fetch(manifestUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...(process.env.VERBALAB_MODEL_API_KEY?.trim()
          ? { Authorization: `Bearer ${process.env.VERBALAB_MODEL_API_KEY.trim()}` }
          : {}),
      },
      signal: AbortSignal.timeout(Number(process.env.VERBALAB_WEIGHTS_PROBE_MS ?? 5_000)),
    });
    if (!response.ok) {
      return {
        status: 'unreachable',
        mode: 'local_lexicon',
        weightsUrl,
        manifestUrl,
        manifest: null,
        families: [],
        honesty,
      };
    }
    const manifest = (await response.json().catch(() => null)) as Record<string, unknown> | null;
    if (!manifest || typeof manifest !== 'object') {
      return {
        status: 'invalid',
        mode: 'local_lexicon',
        weightsUrl,
        manifestUrl,
        manifest: null,
        families: [],
        honesty,
      };
    }
    return {
      status: 'ready',
      mode: 'neural_remote',
      weightsUrl,
      manifestUrl,
      manifest,
      families: familiesFromManifest(manifest),
      honesty,
    };
  } catch {
    return {
      status: 'unreachable',
      mode: 'local_lexicon',
      weightsUrl,
      manifestUrl,
      manifest: null,
      families: [],
      honesty,
    };
  }
}

/** Optional neural MT call; returns null to fall back to lexicon. */
export async function neuralTranslate(input: {
  text: string;
  source: string;
  target: string;
}): Promise<string | null> {
  const weightsUrl = process.env.VERBALAB_WEIGHTS_URL?.trim();
  if (!weightsUrl) return null;
  const url = weightsUrl.endsWith('.json')
    ? weightsUrl.replace(/\/manifest\.json$/i, '/translate')
    : `${weightsUrl.replace(/\/$/, '')}/translate`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.VERBALAB_MODEL_API_KEY?.trim()
          ? { Authorization: `Bearer ${process.env.VERBALAB_MODEL_API_KEY.trim()}` }
          : {}),
      },
      body: JSON.stringify({
        text: input.text,
        source: input.source,
        target: input.target,
        model: 'translate-fm-african',
      }),
      signal: AbortSignal.timeout(Number(process.env.MT_TIMEOUT_MS ?? 60_000)),
    });
    const json = (await response.json().catch(() => ({}))) as {
      text?: string;
      translatedText?: string;
    };
    if (!response.ok) return null;
    return json.text ?? json.translatedText ?? null;
  } catch {
    return null;
  }
}
