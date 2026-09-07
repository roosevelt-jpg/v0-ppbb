import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../common/errors/api-exception';
import { SttInput, SttOutput, SttProvider } from './stt-provider';

const OPENAI_URL = 'https://api.openai.com/v1/audio/transcriptions';

export class OpenAiWhisperAdapter implements SttProvider {
  readonly name = 'openai_whisper';

  constructor(private readonly apiKey: string) {}

  async transcribe(input: SttInput): Promise<SttOutput> {
    if (!this.apiKey) {
      throw new ApiException(
        'provider_not_configured',
        'OPENAI_API_KEY is not set',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const started = Date.now();
    const form = new FormData();
    const blob = new Blob([new Uint8Array(input.buffer)], {
      type: input.mimeType || 'application/octet-stream',
    });
    form.append('file', blob, input.filename);
    form.append('model', process.env.OPENAI_WHISPER_MODEL ?? 'whisper-1');
    form.append('response_format', 'verbose_json');
    if (input.language) {
      form.append('language', input.language);
    }

    let response: Response;
    try {
      response = await fetch(OPENAI_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: form,
        signal: AbortSignal.timeout(Number(process.env.STT_TIMEOUT_MS ?? 120_000)),
      });
    } catch (error) {
      throw new ApiException(
        'provider_error',
        error instanceof Error ? error.message : 'STT request failed',
        HttpStatus.BAD_GATEWAY,
      );
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new ApiException(
        'provider_error',
        `OpenAI Whisper HTTP ${response.status}${detail ? `: ${detail.slice(0, 200)}` : ''}`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    const body = (await response.json()) as {
      text?: string;
      language?: string;
      duration?: number;
    };

    const text = typeof body.text === 'string' ? body.text : '';
    const durationSeconds =
      typeof body.duration === 'number' && Number.isFinite(body.duration)
        ? Math.max(0, body.duration)
        : estimateDurationFromBytes(input.buffer.length);

    return {
      text,
      language: body.language ?? input.language,
      durationSeconds,
      provider: this.name,
      latencyMs: Date.now() - started,
    };
  }
}

/** Last-resort estimate (~16 kbps speech) when vendor omits duration. */
function estimateDurationFromBytes(bytes: number): number {
  return Math.max(1, Math.round(bytes / 2000));
}
