import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsageService } from '../usage/usage.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import {
  voiceArchitectureNotes,
  voiceProductCatalog,
} from './voice-products.catalog';

@Injectable()
export class VoiceCloudService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usage: UsageService,
  ) {}

  products() {
    return {
      products: voiceProductCatalog(),
      architecture: voiceArchitectureNotes(),
      docs: '/docs/VOICE_CLOUD.md',
    };
  }

  async overview(session: SessionContext) {
    const [usageSummary, voiceCloneCount, speakerProfileCount] = await Promise.all([
      this.usage.summary(session.organizationId),
      this.prisma.voiceClone.count({
        where: { organizationId: session.organizationId },
      }),
      this.prisma.speakerProfile.count({
        where: { organizationId: session.organizationId },
      }),
    ]);

    return {
      session: {
        organizationId: session.organizationId,
        workspaceId: session.workspaceId,
        role: session.role,
      },
      usage: {
        periodStart: usageSummary.periodStart,
        tts: usageSummary.tts,
      },
      workspace: {
        voiceClones: voiceCloneCount,
        speakerProfiles: speakerProfileCount,
      },
      products: voiceProductCatalog(),
      architecture: voiceArchitectureNotes(),
      deferred: {
        neuralTtsProductization: true,
        streamingTts: true,
        professionalVoiceCloning: true,
        emotionVoiceSynthesis: true,
        voiceConversion: true,
        voiceRestoration: true,
        audioMastering: true,
        spectralEnhancement: true,
        nistVoiceBiometrics: true,
        antiSpoofLiveness: true,
        voiceMarketplace: true,
        voiceAnalyticsProduct: true,
        ssmlTimelineStudio: true,
      },
      links: {
        voiceCloud: '/voice-cloud',
        audio: '/audio',
        voiceClones: '/audio',
        speakers: '/speaker-intelligence',
        audioIntelligence: '/audio-intelligence',
        voiceFaq: '/voice',
        interpret: '/interpret',
        speech: '/speech',
        marketplace: '/marketplace',
        usage: '/usage',
        billing: '/billing',
        analytics: '/analytics',
        graphql: '/graphql',
        playground: '/playground',
      },
      docs: '/docs/VOICE_CLOUD.md',
    };
  }
}
