/**
 * VerbaLab Own AI — primary inference path.
 *
 * Product posture: VerbaLab owns its models (VerbaLab-Own-AI).
 * Live inference hits VerbaLab-hosted endpoints (credentials later).
 * Vendors (OpenAI/Google/external vendor) are optional legacy fallback only when
 * VERBALAB_ALLOW_VENDOR_FALLBACK=1.
 *
 * Env:
 *   VERBALAB_MODEL_BASE_URL  — common base (…/v1)
 *   VERBALAB_MT_URL / STT_URL / TTS_URL / CHAT_URL / EMBED_URL / OCR_URL / CLONE_URL
 *   VERBALAB_MODEL_API_KEY
 *   VERBALAB_OWN_AI_FIXTURE=1 — deterministic local/CI fixtures
 */
import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../common/errors/api-exception';
import { TranslateInput, TranslateOutput, TranslationProvider } from './translation-provider';
import { SttInput, SttOutput, SttProvider } from './stt-provider';
import { TtsInput, TtsOutput, TtsProvider, TtsVoice } from './tts-provider';
import { ChatInput, ChatOutput, ChatProvider } from './chat-provider';
import { EmbedInput, EmbedOutput, EmbeddingProvider } from './embedding-provider';
import { OcrInput, OcrOutput, OcrProvider } from './ocr-provider';
import { DetectInput, DetectOutput, LanguageDetectProvider } from './detect-provider';
import { OWN_TTS_VOICES } from './own-tts.adapter';
import { LocalRuntimeMtAdapter, localModelRuntimeEnabled } from '../model-runtime/local-runtime';

export const VERBALAB_OWN_PROVIDER = 'verbalab_own_ai';

export function ownAiFixtureEnabled(): boolean {
  return process.env.VERBALAB_OWN_AI_FIXTURE === '1';
}

export function allowVendorFallback(): boolean {
  return process.env.VERBALAB_ALLOW_VENDOR_FALLBACK === '1';
}

function baseUrl(): string {
  return (process.env.VERBALAB_MODEL_BASE_URL ?? '').replace(/\/$/, '');
}

function resolveUrl(specific: string | undefined, path: string): string {
  const s = specific?.trim();
  if (s) return s;
  const b = baseUrl();
  if (b) return `${b}${path}`;
  return '';
}

function apiKey(): string {
  return process.env.VERBALAB_MODEL_API_KEY?.trim() ?? '';
}

function authHeaders(json = true): Record<string, string> {
  const h: Record<string, string> = {};
  if (json) h['Content-Type'] = 'application/json';
  const key = apiKey();
  if (key) h.Authorization = `Bearer ${key}`;
  return h;
}

function notConfigured(modality: string): never {
  throw new ApiException(
    'provider_not_configured',
    `VerbaLab ${modality} model endpoint is not configured. Set VERBALAB_MODEL_BASE_URL or VERBALAB_${modality.toUpperCase()}_URL (and VERBALAB_MODEL_API_KEY), or VERBALAB_OWN_AI_FIXTURE=1 for local/CI.`,
    HttpStatus.SERVICE_UNAVAILABLE,
  );
}

function tinyWav(seed: string): Buffer {
  // ~0.35s mono PCM16 @ 16kHz — long enough for browsers to decode/play.
  const sampleRate = 16_000;
  const samples = Math.floor(sampleRate * 0.35);
  const dataSize = samples * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  let acc = 0;
  for (let i = 0; i < seed.length; i++) acc = (acc + seed.charCodeAt(i) * (i + 1)) % 997;
  const freq = 220 + (acc % 280);
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const envelope = Math.min(1, i / 800) * Math.min(1, (samples - i) / 1200);
    const sample = Math.sin(2 * Math.PI * freq * t) * 0.35 * envelope;
    buffer.writeInt16LE(Math.max(-32767, Math.min(32767, Math.floor(sample * 32767))), 44 + i * 2);
  }
  return buffer;
}

/** Deterministic African-language MT — local Own AI runtime (not a rented translator). */
export class FixtureVerbalabMtAdapter implements TranslationProvider {
  readonly name = VERBALAB_OWN_PROVIDER;
  private readonly local = new LocalRuntimeMtAdapter();

  async translate(input: TranslateInput): Promise<TranslateOutput> {
    return this.local.translate(input);
  }
}

export class HttpVerbalabMtAdapter implements TranslationProvider {
  readonly name = VERBALAB_OWN_PROVIDER;

  async translate(input: TranslateInput): Promise<TranslateOutput> {
    const url = resolveUrl(process.env.VERBALAB_MT_URL, '/translate');
    if (!url) notConfigured('mt');
    const started = Date.now();
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          text: input.text,
          source: input.source,
          target: input.target,
          model: process.env.VERBALAB_MT_MODEL ?? 'translate-fm',
        }),
        signal: AbortSignal.timeout(Number(process.env.MT_TIMEOUT_MS ?? 60_000)),
      });
    } catch (error) {
      throw new ApiException(
        'provider_error',
        error instanceof Error ? error.message : 'VerbaLab MT request failed',
        HttpStatus.BAD_GATEWAY,
      );
    }
    const json = (await response.json().catch(() => ({}))) as {
      text?: string;
      translatedText?: string;
      error?: string;
    };
    if (!response.ok) {
      throw new ApiException(
        'provider_error',
        json.error ?? `VerbaLab MT HTTP ${response.status}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
    const text = json.text ?? json.translatedText;
    if (!text) {
      throw new ApiException('provider_error', 'VerbaLab MT response missing text', HttpStatus.BAD_GATEWAY);
    }
    return {
      text,
      source: input.source,
      target: input.target,
      provider: this.name,
      characters: [...input.text].length,
      latencyMs: Date.now() - started,
    };
  }
}

export class UnconfiguredVerbalabMtAdapter implements TranslationProvider {
  readonly name = VERBALAB_OWN_PROVIDER;
  async translate(): Promise<TranslateOutput> {
    notConfigured('mt');
  }
}

export class FixtureVerbalabSttAdapter implements SttProvider {
  readonly name = VERBALAB_OWN_PROVIDER;

  async transcribe(input: SttInput): Promise<SttOutput> {
    const started = Date.now();
    const lang = input.language ?? 'sw';
    // Honest local/CI stub — never pretends the filename is a real transcript.
    // Chat UI rejects this marker so users are guided to configure real STT.
    const text =
      `[vl-stt-fixture:${lang}] Local STT is in demo mode. ` +
      `Set VERBALAB_STT_URL (Own AI speech pods) or VERBALAB_ALLOW_VENDOR_FALLBACK=1 with OPENAI_API_KEY for real transcription.`;
    return {
      text,
      language: lang,
      durationSeconds: Math.max(1, Math.ceil(input.buffer.length / 16_000)),
      provider: this.name,
      latencyMs: Date.now() - started,
      confidence: 0,
      segments: [
        {
          id: 0,
          start: 0,
          end: 1,
          text,
          confidence: 0,
        },
      ],
    };
  }
}

export class HttpVerbalabSttAdapter implements SttProvider {
  readonly name = VERBALAB_OWN_PROVIDER;

  async transcribe(input: SttInput): Promise<SttOutput> {
    const url = resolveUrl(process.env.VERBALAB_STT_URL, '/audio/transcriptions');
    if (!url) notConfigured('stt');
    const started = Date.now();
    const form = new FormData();
    form.append('file', new Blob([input.buffer], { type: input.mimeType }), input.filename);
    if (input.language) form.append('language', input.language);
    if (input.prompt) form.append('prompt', input.prompt);
    form.append('model', process.env.VERBALAB_STT_MODEL ?? 'echo');
    const headers: Record<string, string> = {};
    const key = apiKey();
    if (key) headers.Authorization = `Bearer ${key}`;
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers,
        body: form,
        signal: AbortSignal.timeout(Number(process.env.STT_TIMEOUT_MS ?? 120_000)),
      });
    } catch (error) {
      throw new ApiException(
        'provider_error',
        error instanceof Error ? error.message : 'VerbaLab STT request failed',
        HttpStatus.BAD_GATEWAY,
      );
    }
    const json = (await response.json().catch(() => ({}))) as {
      text?: string;
      language?: string;
      duration?: number;
      durationSeconds?: number;
      confidence?: number;
      segments?: SttOutput['segments'];
      error?: string;
    };
    if (!response.ok || !json.text) {
      throw new ApiException(
        'provider_error',
        json.error ?? `VerbaLab STT HTTP ${response.status}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
    return {
      text: json.text,
      language: json.language ?? input.language,
      durationSeconds: json.durationSeconds ?? json.duration ?? 1,
      provider: this.name,
      latencyMs: Date.now() - started,
      confidence: json.confidence,
      segments: json.segments,
    };
  }
}

export class UnconfiguredVerbalabSttAdapter implements SttProvider {
  readonly name = VERBALAB_OWN_PROVIDER;
  async transcribe(): Promise<SttOutput> {
    notConfigured('stt');
  }
}

export class FixtureVerbalabTtsAdapter implements TtsProvider {
  readonly name = VERBALAB_OWN_PROVIDER;

  listVoices(): TtsVoice[] {
    return OWN_TTS_VOICES.map((v) => ({ ...v, provider: this.name }));
  }

  async synthesize(input: TtsInput): Promise<TtsOutput> {
    const started = Date.now();
    // Fixture audio is always a real WAV. Never claim mp3 — browsers reject WAV bytes
    // served as audio/mpeg, which broke African Voice "Speak reply".
    return {
      audio: tinyWav(`${input.voice}:${input.text}`),
      mimeType: 'audio/wav',
      format: 'wav',
      voice: input.voice,
      characters: [...input.text].length,
      provider: this.name,
      latencyMs: Date.now() - started,
    };
  }
}

export class HttpVerbalabTtsAdapter implements TtsProvider {
  readonly name = VERBALAB_OWN_PROVIDER;

  listVoices(): TtsVoice[] {
    return OWN_TTS_VOICES.map((v) => ({ ...v, provider: this.name }));
  }

  async synthesize(input: TtsInput): Promise<TtsOutput> {
    const url = resolveUrl(process.env.VERBALAB_TTS_URL, '/audio/speech');
    if (!url) notConfigured('tts');
    const format = input.format ?? 'mp3';
    const started = Date.now();
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          text: input.text,
          voice: input.voice.replace(/^own:/, ''),
          language: input.language,
          format,
          model: process.env.VERBALAB_TTS_MODEL ?? 'voice-fm',
        }),
        signal: AbortSignal.timeout(Number(process.env.TTS_TIMEOUT_MS ?? 60_000)),
      });
    } catch (error) {
      throw new ApiException(
        'provider_error',
        error instanceof Error ? error.message : 'VerbaLab TTS request failed',
        HttpStatus.BAD_GATEWAY,
      );
    }
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new ApiException(
        'provider_error',
        `VerbaLab TTS HTTP ${response.status}${detail ? `: ${detail.slice(0, 200)}` : ''}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const body = (await response.json()) as { audioBase64?: string; mimeType?: string };
      if (!body.audioBase64) {
        throw new ApiException(
          'provider_error',
          'VerbaLab TTS JSON missing audioBase64',
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
    const arrayBuffer = await response.arrayBuffer();
    return {
      audio: Buffer.from(arrayBuffer),
      mimeType: contentType.split(';')[0]?.trim() || 'audio/mpeg',
      format,
      voice: input.voice,
      characters: [...input.text].length,
      provider: this.name,
      latencyMs: Date.now() - started,
    };
  }
}

export class UnconfiguredVerbalabTtsAdapter implements TtsProvider {
  readonly name = VERBALAB_OWN_PROVIDER;
  listVoices(): TtsVoice[] {
    return OWN_TTS_VOICES.map((v) => ({ ...v, provider: this.name }));
  }
  async synthesize(): Promise<TtsOutput> {
    notConfigured('tts');
  }
}

export class FixtureVerbalabChatAdapter implements ChatProvider {
  readonly name = VERBALAB_OWN_PROVIDER;

  async complete(input: ChatInput): Promise<ChatOutput> {
    const started = Date.now();
    const last = [...input.messages].reverse().find((m) => m.role === 'user');
    const userText = (last?.content ?? '').trim();
    let reply: string;
    if (/^\[vl-stt/i.test(userText)) {
      reply =
        'I could not hear real speech yet — speech-to-text is still in local demo mode. Type your message, or configure VERBALAB_STT_URL / Whisper to talk with your voice.';
    } else if (!userText) {
      reply = 'Karibu — I am VerbaLab African Voice. Speak or type in your language.';
    } else {
      reply =
        `Asante — I heard you. (Local Atlas demo.) You said: “${userText.slice(0, 500)}”. ` +
        `Ask me to translate, explain, or reply in another African language.`;
    }
    return {
      message: { role: 'assistant', content: reply },
      model: process.env.VERBALAB_CHAT_MODEL ?? 'atlas',
      provider: this.name,
      promptTokens: Math.ceil(userText.length / 4),
      completionTokens: Math.ceil(reply.length / 4),
      totalTokens: Math.ceil((userText.length + reply.length) / 4),
      latencyMs: Date.now() - started,
    };
  }
}

export class HttpVerbalabChatAdapter implements ChatProvider {
  readonly name = VERBALAB_OWN_PROVIDER;

  async complete(input: ChatInput): Promise<ChatOutput> {
    const url = resolveUrl(process.env.VERBALAB_CHAT_URL, '/chat/completions');
    if (!url) notConfigured('chat');
    const model = input.model ?? process.env.VERBALAB_CHAT_MODEL ?? 'atlas';
    const started = Date.now();
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          model,
          messages: input.messages.map((m) => ({ role: m.role, content: m.content })),
          temperature: 0.4,
        }),
        signal: AbortSignal.timeout(Number(process.env.CHAT_TIMEOUT_MS ?? 60_000)),
      });
    } catch (error) {
      throw new ApiException(
        'provider_error',
        error instanceof Error ? error.message : 'VerbaLab chat request failed',
        HttpStatus.BAD_GATEWAY,
      );
    }
    const json = (await response.json().catch(() => ({}))) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
      model?: string;
      error?: { message?: string } | string;
    };
    const content = json.choices?.[0]?.message?.content;
    if (!response.ok || !content) {
      const err =
        typeof json.error === 'string' ? json.error : json.error?.message ?? `HTTP ${response.status}`;
      throw new ApiException('provider_error', err, HttpStatus.BAD_GATEWAY);
    }
    return {
      message: { role: 'assistant', content },
      model: json.model ?? model,
      provider: this.name,
      promptTokens: json.usage?.prompt_tokens ?? 0,
      completionTokens: json.usage?.completion_tokens ?? 0,
      totalTokens: json.usage?.total_tokens ?? 0,
      latencyMs: Date.now() - started,
    };
  }
}

export class UnconfiguredVerbalabChatAdapter implements ChatProvider {
  readonly name = VERBALAB_OWN_PROVIDER;
  async complete(): Promise<ChatOutput> {
    notConfigured('chat');
  }
}

export class FixtureVerbalabEmbedAdapter implements EmbeddingProvider {
  readonly name = VERBALAB_OWN_PROVIDER;

  async embed(input: EmbedInput): Promise<EmbedOutput> {
    const started = Date.now();
    const dim = Number(process.env.VERBALAB_EMBED_DIM ?? 384);
    const texts = Array.isArray(input.input) ? input.input : [input.input];
    const data = texts.map((text, i) => {
      const vec = new Array(dim).fill(0).map((_, j) => ((text.charCodeAt(j % Math.max(1, text.length)) + i + j) % 100) / 100);
      return { index: i, embedding: vec };
    });
    const promptTokens = texts.reduce((n, t) => n + Math.ceil(t.length / 4), 0);
    return {
      data,
      model: process.env.VERBALAB_EMBED_MODEL ?? 'vector-fm',
      provider: this.name,
      promptTokens,
      totalTokens: promptTokens,
      latencyMs: Date.now() - started,
    };
  }
}

export class HttpVerbalabEmbedAdapter implements EmbeddingProvider {
  readonly name = VERBALAB_OWN_PROVIDER;

  async embed(input: EmbedInput): Promise<EmbedOutput> {
    const url = resolveUrl(process.env.VERBALAB_EMBED_URL, '/embeddings');
    if (!url) notConfigured('embed');
    const model = process.env.VERBALAB_EMBED_MODEL ?? 'vector-fm';
    const started = Date.now();
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ model, input: input.input }),
        signal: AbortSignal.timeout(Number(process.env.EMBED_TIMEOUT_MS ?? 60_000)),
      });
    } catch (error) {
      throw new ApiException(
        'provider_error',
        error instanceof Error ? error.message : 'VerbaLab embed request failed',
        HttpStatus.BAD_GATEWAY,
      );
    }
    const json = (await response.json().catch(() => ({}))) as {
      data?: Array<{ index?: number; embedding?: number[] }>;
      usage?: { prompt_tokens?: number };
      model?: string;
      error?: string;
    };
    if (!response.ok || !json.data?.length) {
      throw new ApiException(
        'provider_error',
        json.error ?? `VerbaLab embed HTTP ${response.status}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
    const promptTokens = json.usage?.prompt_tokens ?? 0;
    return {
      data: json.data.map((d, i) => ({ index: d.index ?? i, embedding: d.embedding ?? [] })),
      model: json.model ?? model,
      provider: this.name,
      promptTokens,
      totalTokens: promptTokens,
      latencyMs: Date.now() - started,
    };
  }
}

export class UnconfiguredVerbalabEmbedAdapter implements EmbeddingProvider {
  readonly name = VERBALAB_OWN_PROVIDER;
  async embed(): Promise<EmbedOutput> {
    notConfigured('embed');
  }
}

export class FixtureVerbalabOcrAdapter implements OcrProvider {
  readonly name = VERBALAB_OWN_PROVIDER;

  async extract(input: OcrInput): Promise<OcrOutput> {
    const started = Date.now();
    const text = `[vl-ocr] ${input.filename}`;
    return {
      text,
      pages: 1,
      provider: this.name,
      latencyMs: Date.now() - started,
      confidence: 0.9,
    };
  }
}

export class HttpVerbalabOcrAdapter implements OcrProvider {
  readonly name = VERBALAB_OWN_PROVIDER;

  async extract(input: OcrInput): Promise<OcrOutput> {
    const url = resolveUrl(process.env.VERBALAB_OCR_URL, '/ocr');
    if (!url) notConfigured('ocr');
    const started = Date.now();
    const form = new FormData();
    form.append('file', new Blob([input.buffer], { type: input.mimeType }), input.filename);
    const headers: Record<string, string> = {};
    const key = apiKey();
    if (key) headers.Authorization = `Bearer ${key}`;
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers,
        body: form,
        signal: AbortSignal.timeout(Number(process.env.OCR_TIMEOUT_MS ?? 60_000)),
      });
    } catch (error) {
      throw new ApiException(
        'provider_error',
        error instanceof Error ? error.message : 'VerbaLab OCR request failed',
        HttpStatus.BAD_GATEWAY,
      );
    }
    const json = (await response.json().catch(() => ({}))) as {
      text?: string;
      pages?: number;
      confidence?: number;
      error?: string;
    };
    if (!response.ok || typeof json.text !== 'string') {
      throw new ApiException(
        'provider_error',
        json.error ?? `VerbaLab OCR HTTP ${response.status}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
    return {
      text: json.text,
      pages: json.pages ?? 1,
      provider: this.name,
      latencyMs: Date.now() - started,
      confidence: json.confidence,
    };
  }
}

export class UnconfiguredVerbalabOcrAdapter implements OcrProvider {
  readonly name = VERBALAB_OWN_PROVIDER;
  async extract(): Promise<OcrOutput> {
    notConfigured('ocr');
  }
}

export class FixtureVerbalabDetectAdapter implements LanguageDetectProvider {
  readonly name = VERBALAB_OWN_PROVIDER;

  async detect(input: DetectInput): Promise<DetectOutput> {
    const sample = input.text.trim().toLowerCase();
    let language = 'en';
    if (/[\u1200-\u137F]/.test(sample)) language = 'am';
    else if (/[\u0600-\u06FF]/.test(sample)) language = 'ar';
    else if (/\b(habari|asante|karibu|tafadhali|sannu|sawubona|ngiyabonga)\b/.test(sample)) {
      if (/\bsawubona|ngiyabonga\b/.test(sample)) language = 'zu';
      else if (/\bsannu\b/.test(sample)) language = 'ha';
      else language = 'sw';
    } else if (/\b(na|ya|wa|ni|kwa)\b/.test(sample)) language = 'sw';
    else if (/\b(ati|fun|won|báwo|bawo)\b/.test(sample)) language = 'yo';
    return { language, confidence: 0.82, provider: this.name };
  }
}

export class HttpVerbalabDetectAdapter implements LanguageDetectProvider {
  readonly name = VERBALAB_OWN_PROVIDER;

  async detect(input: DetectInput): Promise<DetectOutput> {
    const url = resolveUrl(process.env.VERBALAB_DETECT_URL, '/detect');
    if (!url) {
      return new FixtureVerbalabDetectAdapter().detect(input);
    }
    const response = await fetch(url, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ text: input.text }),
      signal: AbortSignal.timeout(Number(process.env.DETECT_TIMEOUT_MS ?? 15_000)),
    });
    const json = (await response.json().catch(() => ({}))) as {
      language?: string;
      confidence?: number;
      error?: string;
    };
    if (!response.ok || !json.language) {
      throw new ApiException(
        'provider_error',
        json.error ?? `VerbaLab detect HTTP ${response.status}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
    return {
      language: json.language,
      confidence: json.confidence ?? 0.5,
      provider: this.name,
    };
  }
}

export function createVerbalabMt(): TranslationProvider {
  // Remote pods when configured; otherwise in-process Own AI local runtime.
  if (resolveUrl(process.env.VERBALAB_MT_URL, '/translate') && !ownAiFixtureEnabled()) {
    return new HttpVerbalabMtAdapter();
  }
  if (ownAiFixtureEnabled() || localModelRuntimeEnabled()) {
    return new FixtureVerbalabMtAdapter();
  }
  return new UnconfiguredVerbalabMtAdapter();
}

export function createVerbalabStt(): SttProvider {
  if (resolveUrl(process.env.VERBALAB_STT_URL, '/audio/transcriptions') && !ownAiFixtureEnabled()) {
    return new HttpVerbalabSttAdapter();
  }
  if (ownAiFixtureEnabled() || localModelRuntimeEnabled()) {
    return new FixtureVerbalabSttAdapter();
  }
  return new UnconfiguredVerbalabSttAdapter();
}

export function createVerbalabTts(): TtsProvider {
  if (resolveUrl(process.env.VERBALAB_TTS_URL, '/audio/speech') && !ownAiFixtureEnabled()) {
    return new HttpVerbalabTtsAdapter();
  }
  if (ownAiFixtureEnabled() || localModelRuntimeEnabled()) {
    return new FixtureVerbalabTtsAdapter();
  }
  return new UnconfiguredVerbalabTtsAdapter();
}

export function createVerbalabChat(): ChatProvider {
  if (resolveUrl(process.env.VERBALAB_CHAT_URL, '/chat/completions') && !ownAiFixtureEnabled()) {
    return new HttpVerbalabChatAdapter();
  }
  if (ownAiFixtureEnabled() || localModelRuntimeEnabled()) {
    return new FixtureVerbalabChatAdapter();
  }
  return new UnconfiguredVerbalabChatAdapter();
}

export function createVerbalabEmbed(): EmbeddingProvider {
  if (resolveUrl(process.env.VERBALAB_EMBED_URL, '/embeddings') && !ownAiFixtureEnabled()) {
    return new HttpVerbalabEmbedAdapter();
  }
  if (ownAiFixtureEnabled() || localModelRuntimeEnabled()) {
    return new FixtureVerbalabEmbedAdapter();
  }
  return new UnconfiguredVerbalabEmbedAdapter();
}

export function createVerbalabOcr(): OcrProvider {
  if (resolveUrl(process.env.VERBALAB_OCR_URL, '/ocr') && !ownAiFixtureEnabled()) {
    return new HttpVerbalabOcrAdapter();
  }
  if (ownAiFixtureEnabled() || localModelRuntimeEnabled()) {
    return new FixtureVerbalabOcrAdapter();
  }
  return new UnconfiguredVerbalabOcrAdapter();
}

export function createVerbalabDetect(): LanguageDetectProvider {
  if (ownAiFixtureEnabled() || localModelRuntimeEnabled()) {
    return new FixtureVerbalabDetectAdapter();
  }
  return new HttpVerbalabDetectAdapter();
}

export function ownAiStackSummary() {
  const local = localModelRuntimeEnabled() || ownAiFixtureEnabled();
  return {
    provider: VERBALAB_OWN_PROVIDER,
    ownedModels: true,
    vendorRentalDefault: false,
    allowVendorFallback: allowVendorFallback(),
    fixture: ownAiFixtureEnabled(),
    localModelRuntime: localModelRuntimeEnabled(),
    baseUrl: baseUrl() || null,
    weightsUrl: process.env.VERBALAB_WEIGHTS_URL?.trim() || null,
    modalities: {
      mt: Boolean(resolveUrl(process.env.VERBALAB_MT_URL, '/translate')) || local,
      stt: Boolean(resolveUrl(process.env.VERBALAB_STT_URL, '/audio/transcriptions')) || local,
      tts: Boolean(resolveUrl(process.env.VERBALAB_TTS_URL, '/audio/speech')) || local,
      chat: Boolean(resolveUrl(process.env.VERBALAB_CHAT_URL, '/chat/completions')) || local,
      embed: Boolean(resolveUrl(process.env.VERBALAB_EMBED_URL, '/embeddings')) || local,
      ocr: Boolean(resolveUrl(process.env.VERBALAB_OCR_URL, '/ocr')) || local,
      detect: local,
      clone: Boolean(resolveUrl(process.env.VERBALAB_CLONE_URL, '/voice-clones')) || local,
    },
    families: [
      'atlas',
      'baobab',
      'echo',
      'voice-fm',
      'vision-fm',
      'vector-fm',
      'reason-fm',
      'edge',
      'fusion',
      'translate-fm',
    ],
  };
}
