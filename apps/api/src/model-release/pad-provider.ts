/**
 * Pluggable presentation-attack / deepfake PAD provider for Voice Law.
 * Default = heuristic anti-spoof. Optional HTTP model at VERBALAB_PAD_URL.
 */
import { assessAntiSpoof, type AntiSpoofResult } from '../voice-biometrics/anti-spoof';

export type PadAssessment = {
  riskScore: number;
  decision: 'pass' | 'review' | 'fail';
  provider: 'heuristic_v1' | 'http_pad';
  certifiedPad: false;
  telephonyCodecHints: string[];
  africanLanguageHint?: string;
  signals: AntiSpoofResult['signals'] & Record<string, unknown>;
  flags: string[];
  note: string;
  raw?: Record<string, unknown>;
};

export function padProviderStatus() {
  const url = process.env.VERBALAB_PAD_URL?.trim() || null;
  return {
    active: url ? ('http_pad' as const) : ('heuristic_v1' as const),
    padUrl: url,
    certifiedPad: false as const,
    upgradePath:
      'Train ASVspoof-/ADD-style PAD on African languages + telephony codecs; serve behind VERBALAB_PAD_URL without changing Voice Law API.',
  };
}

export async function assessPad(input: {
  buffer: Buffer;
  mimeType?: string;
  filename?: string;
  africanLanguageHint?: string;
  telephonyCodec?: string;
}): Promise<PadAssessment> {
  const heuristic = assessAntiSpoof(input.buffer);
  const telephonyCodecHints = [
    'Prefer original uncompressed or high-bitrate capture when possible',
    'Telephony (AMR/G.711/8kHz) inflates false “synthetic” cues — flag for human review',
    input.telephonyCodec
      ? `Declared codec: ${input.telephonyCodec}`
      : 'Codec undeclared — infer from container only',
  ];

  const url = process.env.VERBALAB_PAD_URL?.trim();
  if (!url) {
    return {
      riskScore: heuristic.riskScore,
      decision: heuristic.decision,
      provider: 'heuristic_v1',
      certifiedPad: false,
      telephonyCodecHints,
      africanLanguageHint: input.africanLanguageHint,
      signals: heuristic.signals,
      flags: heuristic.flags,
      note: heuristic.note,
    };
  }

  try {
    const form = new FormData();
    form.append(
      'file',
      new Blob([input.buffer], { type: input.mimeType || 'application/octet-stream' }),
      input.filename || 'evidence.wav',
    );
    if (input.africanLanguageHint) form.append('language', input.africanLanguageHint);
    if (input.telephonyCodec) form.append('codec', input.telephonyCodec);
    const headers: Record<string, string> = {};
    const key = process.env.VERBALAB_MODEL_API_KEY?.trim();
    if (key) headers.Authorization = `Bearer ${key}`;
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: form,
      signal: AbortSignal.timeout(Number(process.env.PAD_TIMEOUT_MS ?? 60_000)),
    });
    const json = (await res.json().catch(() => ({}))) as {
      riskScore?: number;
      decision?: 'pass' | 'review' | 'fail';
      flags?: string[];
      note?: string;
      error?: string;
    };
    if (!res.ok) {
      return {
        ...fromHeuristic(heuristic, telephonyCodecHints, input.africanLanguageHint),
        flags: [...heuristic.flags, 'pad_http_fallback'],
        note: `PAD HTTP failed (${res.status}); fell back to heuristics. ${json.error ?? ''}`.trim(),
        raw: json as Record<string, unknown>,
      };
    }
    const risk =
      typeof json.riskScore === 'number' && Number.isFinite(json.riskScore)
        ? Math.min(1, Math.max(0, json.riskScore))
        : heuristic.riskScore;
    const decision =
      json.decision ?? (risk >= 0.65 ? 'fail' : risk >= 0.35 ? 'review' : 'pass');
    return {
      riskScore: risk,
      decision,
      provider: 'http_pad',
      certifiedPad: false,
      telephonyCodecHints,
      africanLanguageHint: input.africanLanguageHint,
      signals: heuristic.signals,
      flags: Array.isArray(json.flags) ? json.flags : heuristic.flags,
      note:
        json.note ??
        'HTTP PAD model score — still not NIST-certified; assistive only.',
      raw: json as Record<string, unknown>,
    };
  } catch (err) {
    return {
      ...fromHeuristic(heuristic, telephonyCodecHints, input.africanLanguageHint),
      flags: [...heuristic.flags, 'pad_http_error'],
      note: `PAD HTTP error; heuristics used. ${err instanceof Error ? err.message : ''}`.trim(),
    };
  }
}

function fromHeuristic(
  heuristic: AntiSpoofResult,
  telephonyCodecHints: string[],
  africanLanguageHint?: string,
): PadAssessment {
  return {
    riskScore: heuristic.riskScore,
    decision: heuristic.decision,
    provider: 'heuristic_v1',
    certifiedPad: false,
    telephonyCodecHints,
    africanLanguageHint,
    signals: heuristic.signals,
    flags: heuristic.flags,
    note: heuristic.note,
  };
}
