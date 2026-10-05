import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../common/errors/api-exception';
import { TtsInput, TtsOutput, TtsProvider, TtsVoice } from './tts-provider';

/** Catalog of Own TTS voices — Africa + strategic global underserved (VL-121/228). */
export const OWN_TTS_VOICES: TtsVoice[] = [
  {
    id: 'own:sw-aisha',
    name: 'Aisha (Swahili)',
    gender: 'female',
    languages: ['sw', 'en'],
    provider: 'own_tts',
  },
  {
    id: 'own:yo-tunde',
    name: 'Tunde (Yoruba)',
    gender: 'male',
    languages: ['yo', 'en'],
    provider: 'own_tts',
  },
  {
    id: 'own:am-hanna',
    name: 'Hanna (Amharic)',
    gender: 'female',
    languages: ['am', 'en'],
    provider: 'own_tts',
  },
  {
    id: 'own:en-kofi',
    name: 'Kofi (EN-Africa)',
    gender: 'male',
    languages: ['en'],
    provider: 'own_tts',
  },
  {
    id: 'own:ha-amina',
    name: 'Amina (Hausa)',
    gender: 'female',
    languages: ['ha', 'en'],
    provider: 'own_tts',
  },
  {
    id: 'own:zu-thandi',
    name: 'Thandi (Zulu)',
    gender: 'female',
    languages: ['zu', 'en'],
    provider: 'own_tts',
  },
  {
    id: 'own:ig-chidi',
    name: 'Chidi (Igbo)',
    gender: 'male',
    languages: ['ig', 'en'],
    provider: 'own_tts',
  },
  {
    id: 'own:rw-keza',
    name: 'Keza (Kinyarwanda)',
    gender: 'female',
    languages: ['rw', 'en'],
    provider: 'own_tts',
  },
  {
    id: 'own:xh-luvuyo',
    name: 'Luvuyo (Xhosa)',
    gender: 'male',
    languages: ['xh', 'en'],
    provider: 'own_tts',
  },
  {
    id: 'own:so-hodan',
    name: 'Hodan (Somali)',
    gender: 'female',
    languages: ['so', 'en'],
    provider: 'own_tts',
  },
  {
    id: 'own:fr-aida',
    name: 'Aïda (FR-West Africa)',
    gender: 'female',
    languages: ['fr', 'en'],
    provider: 'own_tts',
  },
  {
    id: 'own:ar-nour',
    name: 'Nour (Arabic-Africa)',
    gender: 'female',
    languages: ['ar', 'en'],
    provider: 'own_tts',
  },
  {
    id: 'own:ti-senait',
    name: 'Senait (Tigrinya)',
    gender: 'female',
    languages: ['ti', 'en'],
    provider: 'own_tts',
  },
  {
    id: 'own:om-lema',
    name: 'Lema (Oromo)',
    gender: 'female',
    languages: ['om', 'en'],
    provider: 'own_tts',
  },

  {
    id: 'own:th-mali',
    name: 'Mali (Thai)',
    gender: 'female',
    languages: ['th', 'en'],
    provider: 'own_tts',
  },
  {
    id: 'own:vi-lan',
    name: 'Lan (Vietnamese)',
    gender: 'female',
    languages: ['vi', 'en'],
    provider: 'own_tts',
  },
  {
    id: 'own:tl-maya',
    name: 'Maya (Tagalog)',
    gender: 'female',
    languages: ['tl', 'en'],
    provider: 'own_tts',
  },
  {
    id: 'own:ms-siti',
    name: 'Siti (Malay)',
    gender: 'female',
    languages: ['ms', 'en'],
    provider: 'own_tts',
  },
  {
    id: 'own:bn-riya',
    name: 'Riya (Bengali)',
    gender: 'female',
    languages: ['bn', 'en'],
    provider: 'own_tts',
  },
  {
    id: 'own:ta-priya',
    name: 'Priya (Tamil)',
    gender: 'female',
    languages: ['ta', 'en'],
    provider: 'own_tts',
  },
  {
    id: 'own:te-arjun',
    name: 'Arjun (Telugu)',
    gender: 'male',
    languages: ['te', 'en'],
    provider: 'own_tts',
  },
  {
    id: 'own:hi-ananya',
    name: 'Ananya (Hindi)',
    gender: 'female',
    languages: ['hi', 'en'],
    provider: 'own_tts',
  },
  {
    id: 'own:ur-zara',
    name: 'Zara (Urdu)',
    gender: 'female',
    languages: ['ur', 'en'],
    provider: 'own_tts',
  },
  {
    id: 'own:ht-marlene',
    name: 'Marlene (Haitian Creole)',
    gender: 'female',
    languages: ['ht', 'fr', 'en'],
    provider: 'own_tts',
  },
  {
    id: 'own:jam-devon',
    name: 'Devon (Jamaican)',
    gender: 'male',
    languages: ['jam', 'en'],
    provider: 'own_tts',
  },
  {
    id: 'own:qu-suma',
    name: 'Suma (Quechua)',
    gender: 'female',
    languages: ['qu', 'es', 'en'],
    provider: 'own_tts',
  },
  {
    id: 'own:gn-kerai',
    name: 'Kerai (Guarani)',
    gender: 'female',
    languages: ['gn', 'es', 'en'],
    provider: 'own_tts',
  },
  {
    id: 'own:es-lucia',
    name: 'Lucia (ES-LatAm)',
    gender: 'female',
    languages: ['es', 'en'],
    provider: 'own_tts',
  },
  {
    id: 'own:pt-bia',
    name: 'Bia (PT-BR)',
    gender: 'female',
    languages: ['pt', 'en'],
    provider: 'own_tts',
  },
  {
    id: 'own:en-arjun',
    name: 'Arjun (EN-India)',
    gender: 'male',
    languages: ['en', 'hi'],
    provider: 'own_tts',
  },
  {
    id: 'own:en-kei',
    name: 'Kei (EN-Philippines)',
    gender: 'female',
    languages: ['en', 'tl'],
    provider: 'own_tts',
  },
  {
    id: 'own:jv-sari',
    name: 'Sari (Javanese)',
    gender: 'female',
    languages: ['jv', 'id', 'en'],
    provider: 'own_tts',
  },
  {
    id: 'own:my-thiri',
    name: 'Thiri (Burmese)',
    gender: 'female',
    languages: ['my', 'en'],
    provider: 'own_tts',
  },
  {
    id: 'own:km-sophea',
    name: 'Sophea (Khmer)',
    gender: 'female',
    languages: ['km', 'en'],
    provider: 'own_tts',
  },
  {
    id: 'own:pa-simran',
    name: 'Simran (Punjabi)',
    gender: 'female',
    languages: ['pa', 'en'],
    provider: 'own_tts',
  },

  {
    id: 'own:lo-dao',
    name: 'Dao (Lao)',
    gender: 'female',
    languages: ['lo', 'en'],
    provider: 'own_tts',
  },

  {
    id: 'own:yue-mei',
    name: 'Mei (Cantonese)',
    gender: 'female',
    languages: ['yue', 'zh', 'en'],
    provider: 'own_tts',
  },

  {
    id: 'own:mr-isha',
    name: 'Isha (Marathi)',
    gender: 'female',
    languages: ['mr', 'en'],
    provider: 'own_tts',
  },

  {
    id: 'own:gu-kira',
    name: 'Kira (Gujarati)',
    gender: 'female',
    languages: ['gu', 'en'],
    provider: 'own_tts',
  },

  {
    id: 'own:kn-ravi',
    name: 'Ravi (Kannada)',
    gender: 'male',
    languages: ['kn', 'en'],
    provider: 'own_tts',
  },

  {
    id: 'own:ml-nisha',
    name: 'Nisha (Malayalam)',
    gender: 'female',
    languages: ['ml', 'en'],
    provider: 'own_tts',
  },

  {
    id: 'own:ne-asmi',
    name: 'Asmi (Nepali)',
    gender: 'female',
    languages: ['ne', 'en'],
    provider: 'own_tts',
  },

  {
    id: 'own:si-nimal',
    name: 'Nimal (Sinhala)',
    gender: 'male',
    languages: ['si', 'en'],
    provider: 'own_tts',
  },

  {
    id: 'own:ay-lari',
    name: 'Lari (Aymara)',
    gender: 'female',
    languages: ['ay', 'es', 'en'],
    provider: 'own_tts',
  },

  {
    id: 'own:pap-rina',
    name: 'Rina (Papiamento)',
    gender: 'female',
    languages: ['pap', 'nl', 'en'],
    provider: 'own_tts',
  },

  {
    id: 'own:gcf-lya',
    name: 'Lya (Guadeloupean Creole)',
    gender: 'female',
    languages: ['gcf', 'fr', 'en'],
    provider: 'own_tts',
  },

  {
    id: 'own:ceb-jon',
    name: 'Jon (Cebuano)',
    gender: 'male',
    languages: ['ceb', 'tl', 'en'],
    provider: 'own_tts',
  },

  {
    id: 'own:as-pori',
    name: 'Pori (Assamese)',
    gender: 'female',
    languages: ['as', 'en'],
    provider: 'own_tts',
  },

  {
    id: 'own:or-mina',
    name: 'Mina (Odia)',
    gender: 'female',
    languages: ['or', 'en'],
    provider: 'own_tts',
  },

  {
    id: 'own:bho-raju',
    name: 'Raju (Bhojpuri)',
    gender: 'male',
    languages: ['bho', 'hi', 'en'],
    provider: 'own_tts',
  },

  {
    id: 'own:nhe-xitl',
    name: 'Xitlali (Nahuatl)',
    gender: 'female',
    languages: ['nhe', 'es', 'en'],
    provider: 'own_tts',
  },

  {
    id: 'own:yua-itzel',
    name: 'Itzel (Yucatec Maya)',
    gender: 'female',
    languages: ['yua', 'es', 'en'],
    provider: 'own_tts',
  },

  {
    id: 'own:war-lena',
    name: 'Lena (Waray)',
    gender: 'female',
    languages: ['war', 'tl', 'en'],
    provider: 'own_tts',
  },

  {
    id: 'own:hil-gina',
    name: 'Gina (Hiligaynon)',
    gender: 'female',
    languages: ['hil', 'tl', 'en'],
    provider: 'own_tts',
  },

  {
    id: 'own:su-dewi',
    name: 'Dewi (Sundanese)',
    gender: 'female',
    languages: ['su', 'id', 'en'],
    provider: 'own_tts',
  },
];

const MIME: Record<string, string> = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  opus: 'audio/opus',
  aac: 'audio/aac',
  flac: 'audio/flac',
};

export function isOwnTtsVoice(voice: string): boolean {
  return voice.startsWith('own:');
}

export function ownTtsConfigured(): boolean {
  return (
    Boolean(process.env.OWN_TTS_URL?.trim()) ||
    Boolean(process.env.VERBALAB_TTS_URL?.trim()) ||
    Boolean(process.env.VERBALAB_MODEL_BASE_URL?.trim()) ||
    process.env.OWN_TTS_FIXTURE === '1' ||
    process.env.VERBALAB_OWN_AI_FIXTURE === '1'
  );
}

/** Minimal RIFF/WAV for fixture playback without claiming a real GPU run. */
function tinyWav(seed: string): Buffer {
  const dataSize = 64;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(8000, 24);
  buffer.writeUInt32LE(8000, 28);
  buffer.writeUInt16LE(1, 32);
  buffer.writeUInt16LE(8, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < dataSize; i++) {
    buffer[44 + i] = (seed.charCodeAt(i % seed.length) + i) % 256;
  }
  return buffer;
}

export class FixtureOwnTtsAdapter implements TtsProvider {
  readonly name = 'own_tts_fixture';

  listVoices(): TtsVoice[] {
    return OWN_TTS_VOICES.map((v) => ({ ...v, provider: this.name }));
  }

  async synthesize(input: TtsInput): Promise<TtsOutput> {
    const voice = OWN_TTS_VOICES.find((v) => v.id === input.voice);
    if (!voice) {
      throw new ApiException(
        'validation_error',
        `Unknown own TTS voice "${input.voice}"`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const format = input.format === 'wav' ? 'wav' : 'wav';
    const started = Date.now();
    return {
      audio: tinyWav(`${input.voice}:${input.text}`),
      mimeType: 'audio/wav',
      format,
      voice: input.voice,
      characters: [...input.text].length,
      provider: this.name,
      latencyMs: Date.now() - started,
    };
  }
}

/**
 * HTTP client for VerbaLab-owned Voice FM TTS endpoint.
 * Contract: POST JSON { text, voice, language?, format? } → audio bytes or { audioBase64, mimeType? }.
 */
export class HttpOwnTtsAdapter implements TtsProvider {
  readonly name = 'own_tts';

  constructor(
    private readonly baseUrl: string,
    private readonly apiKey?: string,
  ) {}

  listVoices(): TtsVoice[] {
    return OWN_TTS_VOICES;
  }

  async synthesize(input: TtsInput): Promise<TtsOutput> {
    if (!this.baseUrl) {
      throw new ApiException(
        'provider_not_configured',
        'OWN_TTS_URL is not set. Deploy an open-weight TTS endpoint (e.g. Modal) or set OWN_TTS_FIXTURE=1 for tests.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const voice = OWN_TTS_VOICES.find((v) => v.id === input.voice);
    if (!voice) {
      throw new ApiException(
        'validation_error',
        `Unknown own TTS voice "${input.voice}"`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const format = input.format ?? 'mp3';
    if (!MIME[format]) {
      throw new ApiException('validation_error', `Unsupported format: ${format}`, HttpStatus.BAD_REQUEST);
    }

    const started = Date.now();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'audio/*, application/json',
    };
    if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`;

    let response: Response;
    try {
      response = await fetch(this.baseUrl.replace(/\/$/, ''), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          text: input.text,
          voice: input.voice.replace(/^own:/, ''),
          language: input.language,
          format,
        }),
        signal: AbortSignal.timeout(Number(process.env.TTS_TIMEOUT_MS ?? 60_000)),
      });
    } catch (error) {
      throw new ApiException(
        'provider_error',
        error instanceof Error ? error.message : 'Own TTS request failed',
        HttpStatus.BAD_GATEWAY,
      );
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new ApiException(
        'provider_error',
        `Own TTS HTTP ${response.status}${detail ? `: ${detail.slice(0, 200)}` : ''}`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const body = (await response.json()) as { audioBase64?: string; mimeType?: string };
      if (!body.audioBase64) {
        throw new ApiException(
          'provider_error',
          'Own TTS JSON response missing audioBase64',
          HttpStatus.BAD_GATEWAY,
        );
      }
      return {
        audio: Buffer.from(body.audioBase64, 'base64'),
        mimeType: body.mimeType ?? MIME[format]!,
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
      mimeType: contentType.split(';')[0]?.trim() || MIME[format]!,
      format,
      voice: input.voice,
      characters: [...input.text].length,
      provider: this.name,
      latencyMs: Date.now() - started,
    };
  }
}

/** Lists catalog but refuses synthesis until OWN_TTS_URL or fixture is set. */
export class UnconfiguredOwnTtsAdapter implements TtsProvider {
  readonly name = 'own_tts';

  listVoices(): TtsVoice[] {
    return OWN_TTS_VOICES;
  }

  async synthesize(_input: TtsInput): Promise<TtsOutput> {
    throw new ApiException(
      'provider_not_configured',
      'OWN_TTS_URL is not set. Deploy an open-weight TTS endpoint (e.g. on Modal), or set OWN_TTS_FIXTURE=1 for local/CI fixtures.',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

export function createOwnTtsAdapter(): TtsProvider {
  if (process.env.OWN_TTS_FIXTURE === '1' || process.env.VERBALAB_OWN_AI_FIXTURE === '1') {
    return new FixtureOwnTtsAdapter();
  }
  const url =
    process.env.OWN_TTS_URL?.trim() ||
    process.env.VERBALAB_TTS_URL?.trim() ||
    (process.env.VERBALAB_MODEL_BASE_URL?.trim()
      ? `${process.env.VERBALAB_MODEL_BASE_URL.replace(/\/$/, '')}/audio/speech`
      : '');
  if (url) {
    return new HttpOwnTtsAdapter(
      url,
      process.env.OWN_TTS_API_KEY?.trim() || process.env.VERBALAB_MODEL_API_KEY?.trim() || undefined,
    );
  }
  return new UnconfiguredOwnTtsAdapter();
}
