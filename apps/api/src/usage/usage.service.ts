import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  creditsFor,
  creditsForSttSeconds,
  creditsForTtsCharacters,
} from '../billing/credits';

@Injectable()
export class UsageService {
  constructor(private readonly prisma: PrismaService) {}

  recordTranslation(input: {
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
    characters: number;
    provider: string;
    sourceLang: string;
    targetLang: string;
    latencyMs: number;
  }) {
    return this.prisma.$transaction([
      this.prisma.translationRequest.create({
        data: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          apiKeyId: input.apiKeyId,
          sourceLang: input.sourceLang,
          targetLang: input.targetLang,
          characters: input.characters,
          provider: input.provider,
          latencyMs: input.latencyMs,
        },
      }),
      this.prisma.usageEvent.create({
        data: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          apiKeyId: input.apiKeyId,
          feature: 'translate',
          unitType: 'characters',
          units: input.characters,
          provider: input.provider,
        },
      }),
    ]);
  }

  recordStt(input: {
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
    seconds: number;
    provider: string;
  }) {
    return this.prisma.usageEvent.create({
      data: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
        feature: 'stt',
        unitType: 'seconds',
        units: input.seconds,
        provider: input.provider,
      },
    });
  }

  recordTts(input: {
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
    characters: number;
    provider: string;
  }) {
    return this.prisma.usageEvent.create({
      data: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
        feature: 'tts',
        unitType: 'characters',
        units: input.characters,
        provider: input.provider,
      },
    });
  }

  recordOcr(input: {
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
    pages: number;
    provider: string;
  }) {
    return this.prisma.usageEvent.create({
      data: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
        feature: 'ocr',
        unitType: 'pages',
        units: input.pages,
        provider: input.provider,
      },
    });
  }

  recordChat(input: {
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
    tokens: number;
    provider: string;
  }) {
    return this.prisma.usageEvent.create({
      data: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
        feature: 'chat',
        unitType: 'tokens',
        units: input.tokens,
        provider: input.provider,
      },
    });
  }

  recordEmbeddings(input: {
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
    tokens: number;
    provider: string;
  }) {
    return this.prisma.usageEvent.create({
      data: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
        feature: 'embeddings',
        unitType: 'tokens',
        units: input.tokens,
        provider: input.provider,
      },
    });
  }

  /** Creative / dubbing meters — units match CREDIT_RATES unit semantics. */
  recordCreative(input: {
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
    feature:
      | 'music'
      | 'sfx'
      | 'voice_changer'
      | 'voice_isolator'
      | 'dubbing'
      | 'voice_design'
      | 'image'
      | 'video'
      | 'ads';
    unitType: 'seconds' | 'minutes' | 'generation' | 'credits' | 'pages';
    units: number;
    provider?: string;
  }) {
    return this.prisma.usageEvent.create({
      data: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
        feature: input.feature,
        unitType: input.unitType,
        units: input.units,
        provider: input.provider ?? 'verbalab',
      },
    });
  }

  async summary(organizationId: string) {
    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);

    const events = await this.prisma.usageEvent.findMany({
      where: {
        organizationId,
        createdAt: { gte: start },
      },
    });

    const translateEvents = events.filter((e) => e.feature === 'translate');
    const sttEvents = events.filter((e) => e.feature === 'stt');
    const ttsEvents = events.filter((e) => e.feature === 'tts');
    const ocrEvents = events.filter((e) => e.feature === 'ocr');
    const chatEvents = events.filter((e) => e.feature === 'chat');
    const embeddingEvents = events.filter((e) => e.feature === 'embeddings');
    const musicEvents = events.filter((e) => e.feature === 'music');
    const sfxEvents = events.filter((e) => e.feature === 'sfx');
    const changerEvents = events.filter((e) => e.feature === 'voice_changer');
    const isolatorEvents = events.filter((e) => e.feature === 'voice_isolator');
    const dubbingEvents = events.filter((e) => e.feature === 'dubbing');
    const characters = translateEvents.reduce((sum, event) => sum + event.units, 0);
    const sttSeconds = sttEvents.reduce((sum, event) => sum + event.units, 0);
    const ttsCharacters = ttsEvents.reduce((sum, event) => sum + event.units, 0);
    const ocrPages = ocrEvents.reduce((sum, event) => sum + event.units, 0);
    const chatTokens = chatEvents.reduce((sum, event) => sum + event.units, 0);
    const embeddingTokens = embeddingEvents.reduce((sum, event) => sum + event.units, 0);
    const musicMinutes = musicEvents.reduce((sum, e) => sum + e.units, 0);
    const sfxGens = sfxEvents.reduce((sum, e) => sum + e.units, 0);
    const changerMinutes = changerEvents.reduce((sum, e) => sum + e.units, 0);
    const isolatorMinutes = isolatorEvents.reduce((sum, e) => sum + e.units, 0);
    const dubbingMinutes = dubbingEvents.reduce((sum, e) => sum + e.units, 0);

    const creditsBreakdown = {
      translate: creditsFor('translate', characters),
      tts: creditsForTtsCharacters(ttsCharacters, false),
      stt: creditsForSttSeconds(sttSeconds, false),
      ocr: creditsFor('ocr', ocrPages),
      chat: creditsFor('chat', chatTokens),
      embeddings: creditsFor('embeddings', embeddingTokens),
      music: creditsFor('music', musicMinutes),
      sfx: creditsFor('sfx', sfxGens),
      voice_changer: creditsFor('voice_changer', changerMinutes),
      voice_isolator: creditsFor('voice_isolator', isolatorMinutes),
      dubbing: creditsFor('dubbing_auto_watermark', dubbingMinutes),
    };
    const creditsUsed = Object.values(creditsBreakdown).reduce((a, b) => a + b, 0);

    return {
      periodStart: start.toISOString(),
      requests: translateEvents.length + sttEvents.length + ttsEvents.length,
      characters,
      /** Shared ElevenLabs-style credit consumption across products. */
      creditsUsed,
      creditsBreakdown,
      translate: {
        requests: translateEvents.length,
        characters,
        credits: creditsBreakdown.translate,
      },
      stt: {
        requests: sttEvents.length,
        seconds: sttSeconds,
        minutes: Math.round((sttSeconds / 60) * 1000) / 1000,
        credits: creditsBreakdown.stt,
      },
      tts: {
        requests: ttsEvents.length,
        characters: ttsCharacters,
        credits: creditsBreakdown.tts,
      },
      ocr: {
        requests: ocrEvents.length,
        pages: ocrPages,
        credits: creditsBreakdown.ocr,
      },
      chat: {
        requests: chatEvents.length,
        tokens: chatTokens,
        credits: creditsBreakdown.chat,
      },
      embeddings: {
        requests: embeddingEvents.length,
        tokens: embeddingTokens,
        credits: creditsBreakdown.embeddings,
      },
      music: { requests: musicEvents.length, minutes: musicMinutes, credits: creditsBreakdown.music },
      sfx: { requests: sfxEvents.length, generations: sfxGens, credits: creditsBreakdown.sfx },
      voice_changer: {
        requests: changerEvents.length,
        minutes: changerMinutes,
        credits: creditsBreakdown.voice_changer,
      },
      voice_isolator: {
        requests: isolatorEvents.length,
        minutes: isolatorMinutes,
        credits: creditsBreakdown.voice_isolator,
      },
      dubbing: {
        requests: dubbingEvents.length,
        minutes: dubbingMinutes,
        credits: creditsBreakdown.dubbing,
      },
    };
  }
}
