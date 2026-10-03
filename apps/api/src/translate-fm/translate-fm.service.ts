import { Injectable } from '@nestjs/common';
import { UsageService } from '../usage/usage.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { ownAiStackSummary } from '../gateway/verbalab-own-ai';
import { translatefmCapabilities, translatefmCatalog, translatefmHonesty } from './translate-fm.catalog';

@Injectable()
export class TranslateFmService {
  constructor(private readonly usage: UsageService) {}

  engine() {
    return {
      ...translatefmCatalog(),
      capabilities: translatefmCapabilities(),
      ownAi: ownAiStackSummary(),
      safety: {
        ownedModels: true,
        vendorRentalDefault: false,
        note:
          'Translate FM is a VerbaLab-owned foundation model product. Inference uses VerbaLab model endpoints (credentials configured separately). Repo does not embed weight binaries.',
      },
    };
  }

  capabilities() {
    return {
      capabilities: translatefmCapabilities(),
      honesty: translatefmHonesty(),
      docs: '/docs/TRANSLATE_FM.md',
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
        self: '/translate-fm',
        foundationModelCloud: '/foundation-model-cloud',
        modelServing: '/model-serving',
        atlas: '/atlas',
        gateway: '/gateway',
      },
      docs: '/docs/TRANSLATE_FM.md',
      note: 'Translate FM — VerbaLab-owned model family wired to own-AI gateway.',
    };
  }

  monitoring() {
    return {
      status: 'ready',
      honesty: translatefmHonesty(),
      ownAi: ownAiStackSummary(),
    };
  }
}
