import { Injectable } from '@nestjs/common';
import { UsageService } from '../usage/usage.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { ownAiStackSummary } from '../gateway/verbalab-own-ai';
import { developOwnModelEngine } from '../own-models/own-models.catalog';
import { voicefmCapabilities, voicefmCatalog, voicefmHonesty } from './voice-fm.catalog';

@Injectable()
export class VoiceFmService {
  constructor(private readonly usage: UsageService) {}

  engine() {
    return developOwnModelEngine('voice-fm', {
      ...voicefmCatalog(),
      capabilities: voicefmCapabilities(),
      ownAi: ownAiStackSummary(),
      safety: {
        ownedModels: true,
        vendorRentalDefault: false,
        note:
          'Voice FM is a VerbaLab-owned foundation model product. Inference uses VerbaLab model endpoints (credentials configured separately). Repo does not embed weight binaries.',
      },
    });
  }

  capabilities() {
    return {
      capabilities: voicefmCapabilities(),
      honesty: voicefmHonesty(),
      docs: '/docs/VOICE_FM.md',
    };
  }

  async overview(session: SessionContext) {
    const usageSummary = await this.usage.summary(session.organizationId);
    return {
      session: {
        organizationId: session.organizationId,
        workspaceId: session.workspaceId,
        role: session.role,
      },
      usage: {
        periodStart: usageSummary.periodStart,
      },
      engine: this.engine(),
      links: {
        self: '/voice-fm',
        foundationModelCloud: '/foundation-model-cloud',
        modelServing: '/model-serving',
        atlas: '/atlas',
        gateway: '/gateway',
      },
      docs: '/docs/VOICE_FM.md',
      note: 'Voice FM — VerbaLab-owned model family wired to own-AI gateway.',
    };
  }

  monitoring() {
    return {
      status: 'ready',
      honesty: voicefmHonesty(),
      ownAi: ownAiStackSummary(),
    };
  }
}
