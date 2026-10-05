import { HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { ApiException } from '../common/errors/api-exception';
import { GatewayService } from '../gateway/gateway.service';
import { LanguagesService } from '../languages/languages.service';
import { BillingService } from '../billing/billing.service';
import { UsageService } from '../usage/usage.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreditProduct, creditsFor } from '../billing/credits';
import { ownAiStackSummary } from '../gateway/verbalab-own-ai';
import { developOwnModelEngine } from '../own-models/own-models.catalog';
import { videoVoiceCatalog } from './video-voice.catalog';

export type DubMode =
  | 'auto_watermark'
  | 'auto'
  | 'studio_watermark'
  | 'studio';

type OrgMeta = {
  organizationId: string;
  workspaceId: string;
  apiKeyId?: string;
  userId?: string;
  ip?: string;
};

const MODE_CREDIT: Record<DubMode, CreditProduct> = {
  auto_watermark: 'dubbing_auto_watermark',
  auto: 'dubbing_auto',
  studio_watermark: 'dubbing_studio_watermark',
  studio: 'dubbing_studio',
};

@Injectable()
export class VideoVoiceService {
  constructor(
    private readonly gateway: GatewayService,
    private readonly languages: LanguagesService,
    private readonly billing: BillingService,
    private readonly usage: UsageService,
    private readonly prisma: PrismaService,
  ) {}

  engine() {
    return developOwnModelEngine('video-voice', {
      ...videoVoiceCatalog(),
      ownAi: ownAiStackSummary(),
      pipeline: [
        'provide_script_or_source_audio',
        'optional_stt_on_source_audio',
        'translate_fm_localization',
        'voice_fm_tts_render',
        'watermark_or_commercial_export',
      ],
      modes: Object.keys(MODE_CREDIT),
      creditRates: MODE_CREDIT,
      apis: {
        dub: 'POST /v1/video-voice/dub',
        clones: '/v1/voice-clones',
        speech: '/v1/audio/speech',
        translate: '/v1/translate',
        voiceFm: '/v1/voice-fm/engine',
      },
    });
  }

  overview(session: SessionContext) {
    return {
      session: {
        organizationId: session.organizationId,
        workspaceId: session.workspaceId,
      },
      engine: this.engine(),
      links: {
        voiceCloning: '/voice-cloning',
        voiceStudio: '/voice-studio',
        audio: '/audio',
        voiceFm: '/voice-fm',
        translateFm: '/translate-fm',
        intentPreservingDub: '/intent-preserving-dub',
      },
      note: 'Video Voice — end-to-end dubbing on VerbaLab-owned Voice FM + Translate FM. POST /v1/video-voice/dub meters shared credits.',
    };
  }

  /**
   * End-to-end dubbing job: optional STT → translate → TTS.
   * Metered as dubbing minutes (shared-credit package), not separate STT/TTS debits.
   */
  async dub(
    input: {
      text?: string;
      sourceAudio?: { buffer: Buffer; filename: string; mimeType: string };
      sourceLanguage?: string;
      targetLanguage: string;
      voice?: string;
      mode?: DubMode;
      format?: 'mp3' | 'wav';
      commercial?: boolean;
      durationSecondsHint?: number;
    },
    meta: OrgMeta,
  ) {
    const mode: DubMode = input.mode ?? 'auto_watermark';
    if (!(mode in MODE_CREDIT)) {
      throw new ApiException(
        'validation_error',
        `mode must be one of: ${Object.keys(MODE_CREDIT).join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const watermark = mode === 'auto_watermark' || mode === 'studio_watermark';
    if (!watermark || input.commercial) {
      await this.billing.assertCommercial(meta.organizationId);
    }

    let sourceText = (input.text ?? '').trim();
    let sourceLanguage = (input.sourceLanguage ?? 'auto').trim() || 'auto';
    let audioDurationSeconds = Math.max(0, Number(input.durationSecondsHint) || 0);
    let sttProvider: string | undefined;

    if (input.sourceAudio?.buffer?.length) {
      const stt = await this.gateway.transcribe({
        buffer: input.sourceAudio.buffer,
        filename: input.sourceAudio.filename,
        mimeType: input.sourceAudio.mimeType || 'application/octet-stream',
        language: sourceLanguage === 'auto' ? undefined : sourceLanguage,
      });
      sourceText = stt.text?.trim() || sourceText;
      audioDurationSeconds = Math.max(audioDurationSeconds, Math.ceil(stt.durationSeconds || 0));
      sourceLanguage = stt.language ?? sourceLanguage;
      sttProvider = stt.provider;
    }

    if (!sourceText) {
      throw new ApiException(
        'validation_error',
        'text or source audio with speech is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (sourceLanguage === 'auto') {
      const detection = await this.gateway.detect({ text: sourceText });
      sourceLanguage = detection.language;
    }

    await this.languages.assertSupported(sourceLanguage);
    await this.languages.assertSupported(input.targetLanguage);

    const minutes = estimateDubMinutes(sourceText, audioDurationSeconds);
    const creditProduct = MODE_CREDIT[mode];
    const credits = creditsFor(creditProduct, minutes);
    await this.billing.assertWithinCredits(meta.organizationId, credits);

    const translated = await this.gateway.translate({
      text: sourceText,
      source: sourceLanguage,
      target: input.targetLanguage,
    });

    const voice = (input.voice ?? 'alloy').trim() || 'alloy';
    const format = input.format ?? 'mp3';
    const speech = await this.gateway.synthesize({
      text: translated.text,
      voice,
      language: input.targetLanguage,
      format,
    });

    await this.usage.recordCreative({
      organizationId: meta.organizationId,
      workspaceId: meta.workspaceId,
      apiKeyId: meta.apiKeyId,
      feature: 'dubbing',
      unitType: 'minutes',
      units: minutes,
      provider: speech.provider,
    });

    try {
      await this.prisma.auditEvent.create({
        data: {
          organizationId: meta.organizationId,
          action: 'video_voice.dub',
          metadata: {
            mode,
            sourceLanguage,
            targetLanguage: input.targetLanguage,
            minutes,
            credits,
            watermark,
            characters: [...translated.text].length,
            voice,
            sttProvider,
          },
        },
      });
    } catch {
      /* audit best-effort */
    }

    return {
      id: randomUUID(),
      mode,
      sourceLanguage,
      targetLanguage: input.targetLanguage,
      sourceText,
      dubbedText: translated.text,
      voice,
      format: speech.format ?? format,
      mimeType: format === 'wav' ? 'audio/wav' : 'audio/mpeg',
      audioBase64: speech.audio.toString('base64'),
      minutesBilled: Math.round(minutes * 1000) / 1000,
      creditsCharged: credits,
      creditProduct,
      watermarkApplied: watermark,
      providers: {
        stt: sttProvider ?? null,
        translate: translated.provider,
        tts: speech.provider,
      },
      honesty: {
        packageMeter: 'dubbing_minutes',
        note: 'Dubbing is billed as a package (STT/translate/TTS included in dubbing credits). Video timeline mux is not included — returns localized dubbed audio track.',
        videoMux: false,
      },
    };
  }
}

function estimateDubMinutes(text: string, audioSeconds: number): number {
  if (audioSeconds > 0) return Math.max(1 / 60, audioSeconds / 60);
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  // ~150 words/minute speech rate fallback when no source audio duration.
  return Math.max(1 / 60, words / 150);
}
