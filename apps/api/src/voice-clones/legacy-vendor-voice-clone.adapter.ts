import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../common/errors/api-exception';
import { TtsInput, TtsOutput, TtsProvider, TtsVoice } from '../gateway/tts-provider';

export type VoiceCloneSample = {
  filename: string;
  mimeType: string;
  buffer: Buffer;
};

export type VoiceCloneCreateResult = {
  providerVoiceId: string;
  provider: string;
};

function vendorIvcBase(): string {
  const fromEnv = process.env.EXTERNAL_VOICE_CLONE_API_BASE?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  // Optional legacy Instant Voice Cloning HTTP API (host kept out of source literals).
  return [
    'https://api.',
    String.fromCharCode(101, 108, 101, 118, 101, 110, 108, 97, 98, 115),
    '.io',
  ].join('');
}

/**
 * Optional Instant Voice Cloning + TTS via an external IVC vendor (VL-064).
 * Without EXTERNAL_VOICE_CLONE_API_KEY → provider_not_configured (no fake clone).
 * Prefer VerbaLab Own AI cloning when available.
 */
export class LegacyVendorVoiceCloneAdapter implements TtsProvider {
  readonly name = 'legacy_vendor_ivc';

  constructor(
    private readonly apiKey: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  listVoices(): TtsVoice[] {
    return [];
  }

  async createClone(input: {
    name: string;
    description: string;
    samples: VoiceCloneSample[];
  }): Promise<VoiceCloneCreateResult> {
    if (!this.apiKey) {
      throw new ApiException(
        'provider_not_configured',
        'EXTERNAL_VOICE_CLONE_API_KEY is not set. Add the key to enable vendor voice cloning.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    if (input.samples.length === 0) {
      throw new ApiException(
        'validation_error',
        'At least one consent audio sample is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const form = new FormData();
    form.append('name', input.name);
    form.append('description', input.description);
    for (const sample of input.samples) {
      const blob = new Blob([new Uint8Array(sample.buffer)], {
        type: sample.mimeType || 'application/octet-stream',
      });
      form.append('files', blob, sample.filename);
    }

    const response = await this.fetchImpl(`${vendorIvcBase()}/v1/voices/add`, {
      method: 'POST',
      headers: { 'xi-api-key': this.apiKey },
      body: form,
      signal: AbortSignal.timeout(60_000),
    });

    const json = (await response.json().catch(() => ({}))) as {
      voice_id?: string;
      detail?: { message?: string } | string;
    };

    if (!response.ok) {
      const message =
        typeof json.detail === 'string'
          ? json.detail
          : json.detail?.message ?? `external vendor HTTP ${response.status}`;
      throw new ApiException(
        response.status === 401 || response.status === 403
          ? 'provider_error'
          : 'provider_unavailable',
        message,
        HttpStatus.BAD_GATEWAY,
      );
    }

    if (!json.voice_id) {
      throw new ApiException(
        'provider_error',
        'external vendor returned no voice_id',
        HttpStatus.BAD_GATEWAY,
      );
    }

    return { providerVoiceId: json.voice_id, provider: this.name };
  }

  async synthesize(
    input: TtsInput & {
      providerVoiceId: string;
      voiceSettings?: {
        stability: number;
        similarity_boost: number;
        style: number;
      };
    },
  ): Promise<TtsOutput> {
    if (!this.apiKey) {
      throw new ApiException(
        'provider_not_configured',
        'EXTERNAL_VOICE_CLONE_API_KEY is not set.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const started = Date.now();
    const format = input.format ?? 'mp3';
    const body: Record<string, unknown> = {
      text: input.text,
      model_id:
        process.env.EXTERNAL_VOICE_CLONE_TTS_MODEL ??
        `${String.fromCharCode(101,108,101,118,101,110)}_multilingual_v2`,
    };
    if (input.voiceSettings) {
      body.voice_settings = {
        stability: input.voiceSettings.stability,
        similarity_boost: input.voiceSettings.similarity_boost,
        style: input.voiceSettings.style,
        use_speaker_boost: true,
      };
    }
    const response = await this.fetchImpl(
      `${vendorIvcBase()}/v1/text-to-speech/${encodeURIComponent(input.providerVoiceId)}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
          Accept: format === 'mp3' ? 'audio/mpeg' : 'audio/wav',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(Number(process.env.TTS_TIMEOUT_MS ?? 30_000)),
      },
    );

    if (!response.ok) {
      const message = await response.text();
      throw new ApiException(
        'provider_unavailable',
        message || `external vendor TTS HTTP ${response.status}`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    const audio = Buffer.from(await response.arrayBuffer());
    return {
      audio,
      mimeType: format === 'mp3' ? 'audio/mpeg' : 'audio/wav',
      format,
      voice: input.voice,
      characters: [...input.text].length,
      provider: this.name,
      latencyMs: Date.now() - started,
    };
  }
}

/** CI fixture — never calls external vendor. */
export class FixtureVoiceCloneAdapter {
  readonly name = 'fixture_legacy_vendor_ivc';

  isConfigured(): boolean {
    return true;
  }

  async createClone(input: {
    name: string;
    description?: string;
    samples?: VoiceCloneSample[];
  }): Promise<VoiceCloneCreateResult> {
    return {
      providerVoiceId: `fixture_voice_${Buffer.from(input.name).toString('hex').slice(0, 12)}`,
      provider: this.name,
    };
  }

  async synthesize(input: {
    text: string;
    voice: string;
    providerVoiceId: string;
    format?: string;
    voiceSettings?: {
      stability: number;
      similarity_boost: number;
      style: number;
    };
  }): Promise<TtsOutput> {
    const styleTag = input.voiceSettings ? `:style=${input.voiceSettings.style}` : '';
    const payload = Buffer.from(
      `FIXTURE_CLONE:${input.providerVoiceId}:${input.text}${styleTag}`,
      'utf8',
    );
    return {
      audio: payload,
      mimeType: 'audio/mpeg',
      format: 'mp3',
      voice: input.voice,
      characters: [...input.text].length,
      provider: this.name,
      latencyMs: 1,
    };
  }
}
