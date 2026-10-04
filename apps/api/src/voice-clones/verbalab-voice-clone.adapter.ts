import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../common/errors/api-exception';
import { TtsOutput } from '../gateway/tts-provider';
import type { VoiceCloneCreateResult, VoiceCloneSample } from './legacy-vendor-voice-clone.adapter';

function cloneUrl(): string {
  const specific = process.env.VERBALAB_CLONE_URL?.trim();
  if (specific) return specific;
  const base = (process.env.VERBALAB_MODEL_BASE_URL ?? '').replace(/\/$/, '');
  return base ? `${base}/voice-clones` : '';
}

function apiKey(): string {
  return process.env.VERBALAB_MODEL_API_KEY?.trim() ?? '';
}

/**
 * VerbaLab-owned voice cloning (video dubbing / creator cloning).
 * Primary path — not a third-party voice OS rental.
 */
export class VerbalabVoiceCloneAdapter {
  readonly name = 'verbalab_own_clone';

  isConfigured(): boolean {
    return (
      Boolean(cloneUrl()) ||
      process.env.VERBALAB_OWN_AI_FIXTURE === '1' ||
      process.env.VERBALAB_LOCAL_MODEL_RUNTIME !== '0'
    );
  }

  async createClone(input: {
    name: string;
    description: string;
    samples: VoiceCloneSample[];
  }): Promise<VoiceCloneCreateResult> {
    if (
      process.env.VERBALAB_OWN_AI_FIXTURE === '1' ||
      process.env.VOICE_CLONE_FIXTURE === '1' ||
      (!cloneUrl() && process.env.VERBALAB_LOCAL_MODEL_RUNTIME !== '0')
    ) {
      return {
        providerVoiceId: `vl_clone_${Buffer.from(input.name).toString('hex').slice(0, 12)}`,
        provider: this.name,
      };
    }
    const url = cloneUrl();
    if (!url) {
      throw new ApiException(
        'provider_not_configured',
        'VERBALAB_CLONE_URL / VERBALAB_MODEL_BASE_URL is not set for VerbaLab voice cloning.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    if (!input.samples.length) {
      throw new ApiException(
        'validation_error',
        'At least one consent audio sample is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    const form = new FormData();
    form.append('name', input.name);
    form.append('description', input.description);
    form.append('useCase', 'video_dubbing');
    for (const sample of input.samples) {
      form.append(
        'files',
        new Blob([new Uint8Array(sample.buffer)], {
          type: sample.mimeType || 'application/octet-stream',
        }),
        sample.filename,
      );
    }
    const headers: Record<string, string> = {};
    const key = apiKey();
    if (key) headers.Authorization = `Bearer ${key}`;
    const response = await fetch(url, { method: 'POST', headers, body: form });
    const json = (await response.json().catch(() => ({}))) as {
      voice_id?: string;
      providerVoiceId?: string;
      id?: string;
      error?: string;
    };
    const id = json.providerVoiceId ?? json.voice_id ?? json.id;
    if (!response.ok || !id) {
      throw new ApiException(
        'provider_error',
        json.error ?? `VerbaLab clone HTTP ${response.status}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
    return { providerVoiceId: id, provider: this.name };
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
    const url = cloneUrl();
    if (
      process.env.VERBALAB_OWN_AI_FIXTURE === '1' ||
      process.env.VOICE_CLONE_FIXTURE === '1' ||
      (!url && process.env.VERBALAB_LOCAL_MODEL_RUNTIME !== '0')
    ) {
      const styleTag = input.voiceSettings ? `:style=${input.voiceSettings.style}` : '';
      return {
        audio: Buffer.from(`VL_CLONE:${input.providerVoiceId}:${input.text}${styleTag}`, 'utf8'),
        mimeType: 'audio/mpeg',
        format: 'mp3',
        voice: input.voice,
        characters: [...input.text].length,
        provider: this.name,
        latencyMs: 1,
      };
    }
    if (!url) {
      throw new ApiException(
        'provider_not_configured',
        'VERBALAB_CLONE_URL / VERBALAB_MODEL_BASE_URL is not set for VerbaLab voice cloning.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    const started = Date.now();
    const format = input.format ?? 'mp3';
    const response = await fetch(`${url.replace(/\/$/, '')}/${encodeURIComponent(input.providerVoiceId)}/speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey() ? { Authorization: `Bearer ${apiKey()}` } : {}),
      },
      body: JSON.stringify({
        text: input.text,
        format,
        model: process.env.VERBALAB_CLONE_MODEL ?? 'voice-fm',
        useCase: 'video_dubbing',
        voice_settings: input.voiceSettings,
      }),
      signal: AbortSignal.timeout(Number(process.env.TTS_TIMEOUT_MS ?? 60_000)),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new ApiException(
        'provider_error',
        `VerbaLab clone speak HTTP ${response.status}${detail ? `: ${detail.slice(0, 200)}` : ''}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const body = (await response.json()) as { audioBase64?: string; mimeType?: string };
      if (!body.audioBase64) {
        throw new ApiException(
          'provider_error',
          'VerbaLab clone JSON missing audioBase64',
          HttpStatus.BAD_GATEWAY,
        );
      }
      return {
        audio: Buffer.from(body.audioBase64, 'base64'),
        mimeType: body.mimeType ?? 'audio/mpeg',
        format,
        voice: input.voice,
        characters: [...input.text].length,
        provider: this.name,
        latencyMs: Date.now() - started,
      };
    }
    return {
      audio: Buffer.from(await response.arrayBuffer()),
      mimeType: contentType.split(';')[0]?.trim() || 'audio/mpeg',
      format,
      voice: input.voice,
      characters: [...input.text].length,
      provider: this.name,
      latencyMs: Date.now() - started,
    };
  }
}

export function createVerbalabVoiceCloneAdapter(): VerbalabVoiceCloneAdapter {
  return new VerbalabVoiceCloneAdapter();
}
