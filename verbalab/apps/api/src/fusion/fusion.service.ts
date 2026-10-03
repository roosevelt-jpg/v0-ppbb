import { Injectable } from '@nestjs/common';
import { UsageService } from '../usage/usage.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { ownAiStackSummary } from '../gateway/verbalab-own-ai';
import { fusionCapabilities, fusionCatalog, fusionHonesty } from './fusion.catalog';

@Injectable()
export class FusionService {
  constructor(private readonly usage: UsageService) {}

  engine() {
    return {
      ...fusionCatalog(),
      capabilities: fusionCapabilities(),
      ownAi: ownAiStackSummary(),
      safety: {
        ownedModels: true,
        vendorRentalDefault: false,
        note:
          'Fusion is a VerbaLab-owned foundation model product. Inference uses VerbaLab model endpoints (credentials configured separately). Repo does not embed weight binaries.',
      },
    };
  }

  capabilities() {
    return {
      capabilities: fusionCapabilities(),
      honesty: fusionHonesty(),
      docs: '/docs/FUSION.md',
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
        self: '/fusion',
        foundationModelCloud: '/foundation-model-cloud',
        modelServing: '/model-serving',
        atlas: '/atlas',
        gateway: '/gateway',
      },
      docs: '/docs/FUSION.md',
      note: 'Fusion — VerbaLab-owned model family wired to own-AI gateway.',
    };
  }

  monitoring() {
    return {
      status: 'ready',
      honesty: fusionHonesty(),
      ownAi: ownAiStackSummary(),
    };
  }
}
