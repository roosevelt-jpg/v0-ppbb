/**
 * Shared credit costs — mirrored from ElevenLabs Creative Platform product rates.
 * All products draw from one monthly credit pool (Organization.characterQuota).
 *
 * Approximate public rates (elevenlabs.io/pricing):
 * - TTS Multilingual: 1 credit / character
 * - TTS Flash/Turbo API: 0.5 credit / character
 * - STT: 330 credits / minute
 * - Music: 900 credits / minute
 * - Sound Effects: 200 credits / generation
 * - Voice Changer / Isolator: 1,000 credits / minute
 * - Dubbing: 2,000–10,000 credits / minute by mode
 */

export type CreditProduct =
  | 'tts'
  | 'tts_flash'
  | 'stt'
  | 'stt_realtime'
  | 'translate'
  | 'music'
  | 'sfx'
  | 'voice_changer'
  | 'voice_isolator'
  | 'dubbing_auto_watermark'
  | 'dubbing_auto'
  | 'dubbing_studio_watermark'
  | 'dubbing_studio'
  | 'chat'
  | 'embeddings'
  | 'ocr';

/** Credits charged per unit for each product. */
export const CREDIT_RATES: Record<
  CreditProduct,
  { creditsPerUnit: number; unit: string; note: string }
> = {
  tts: { creditsPerUnit: 1, unit: 'character', note: 'Multilingual TTS — 1 credit per character' },
  tts_flash: {
    creditsPerUnit: 0.5,
    unit: 'character',
    note: 'Flash/Turbo API TTS — 0.5 credit per character',
  },
  stt: { creditsPerUnit: 330, unit: 'minute', note: 'Speech to Text — 330 credits per audio minute' },
  stt_realtime: {
    creditsPerUnit: 585,
    unit: 'minute',
    note: 'Realtime STT — ~1.77× batch (mirrors Scribe realtime premium)',
  },
  translate: {
    creditsPerUnit: 1,
    unit: 'character',
    note: 'Translation metered as characters in the shared credit pool',
  },
  music: { creditsPerUnit: 900, unit: 'minute', note: 'AI Music — 900 credits per minute' },
  sfx: { creditsPerUnit: 200, unit: 'generation', note: 'Sound Effects — 200 credits per generation' },
  voice_changer: {
    creditsPerUnit: 1000,
    unit: 'minute',
    note: 'Voice Changer — 1,000 credits per minute',
  },
  voice_isolator: {
    creditsPerUnit: 1000,
    unit: 'minute',
    note: 'Voice Isolator — 1,000 credits per minute',
  },
  dubbing_auto_watermark: {
    creditsPerUnit: 2000,
    unit: 'minute',
    note: 'Automatic dubbing with watermark',
  },
  dubbing_auto: { creditsPerUnit: 3000, unit: 'minute', note: 'Automatic dubbing without watermark' },
  dubbing_studio_watermark: {
    creditsPerUnit: 5000,
    unit: 'minute',
    note: 'Dubbing Studio with watermark',
  },
  dubbing_studio: {
    creditsPerUnit: 10000,
    unit: 'minute',
    note: 'Dubbing Studio without watermark',
  },
  chat: {
    creditsPerUnit: 0.25,
    unit: 'token',
    note: 'Voice LLM chat — ~0.25 credit per token (VerbaLab extension)',
  },
  embeddings: {
    creditsPerUnit: 0.001,
    unit: 'token',
    note: 'Embeddings — 1 credit per 1k tokens',
  },
  ocr: { creditsPerUnit: 50, unit: 'page', note: 'OCR — 50 credits per page' },
};

/** API USD rates (pay-as-you-go style) — ElevenLabs API pricing page. */
export const API_USD_RATES = {
  ttsFlashPer1kChars: 0.05,
  ttsMultilingualPer1kChars: 0.1,
  sttPerHour: 0.22,
  sttRealtimePerHour: 0.39,
  musicPerMinute: 0.15,
  voiceChangerPerMinute: 0.12,
  voiceIsolatorPerMinute: 0.12,
  sfxPerMinute: 0.12,
  dubbingAutoWatermarkPerMinute: 0.33,
  dubbingAutoPerMinute: 0.5,
  dubbingStudioPerMinute: 0.5,
} as const;

export function creditsFor(product: CreditProduct, units: number): number {
  const rate = CREDIT_RATES[product];
  if (!rate || !Number.isFinite(units) || units <= 0) return 0;
  return Math.ceil(units * rate.creditsPerUnit);
}

export function creditsForSttSeconds(seconds: number, realtime = false): number {
  const minutes = Math.max(0, seconds) / 60;
  return creditsFor(realtime ? 'stt_realtime' : 'stt', minutes);
}

export function creditsForTtsCharacters(characters: number, flash = false): number {
  return creditsFor(flash ? 'tts_flash' : 'tts', characters);
}

export function creditRateCatalog() {
  return {
    model: 'elevenlabs-mirrored-shared-credits',
    note: 'One monthly credit pool across products. TTS chars, STT minutes, music, SFX, dubbing, and VerbaLab extras all debit the same quota.',
    rates: CREDIT_RATES,
    apiUsd: API_USD_RATES,
    rollover: 'Up to two months of unused subscription credits may roll over (policy parity).',
  };
}
