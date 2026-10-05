import { Injectable } from '@nestjs/common';
import { UsageService } from '../usage/usage.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { ownAiStackSummary } from '../gateway/verbalab-own-ai';
import { developOwnModelEngine } from '../own-models/own-models.catalog';
import { reasonfmCapabilities, reasonfmCatalog, reasonfmHonesty } from './reason-fm.catalog';

@Injectable()
export class ReasonFmService {
  constructor(private readonly usage: UsageService) {}

  engine() {
    return developOwnModelEngine('reason-fm', {
      ...reasonfmCatalog(),
      capabilities: reasonfmCapabilities(),
      ownAi: ownAiStackSummary(),
      safety: {
        ownedModels: true,
        vendorRentalDefault: false,
        note:
          'Reason FM is a VerbaLab-owned foundation model product. Inference uses VerbaLab model endpoints (credentials configured separately). Repo does not embed weight binaries.',
      },
    });
  }

  capabilities() {
    return {
      capabilities: reasonfmCapabilities(),
      honesty: reasonfmHonesty(),
      docs: '/docs/REASON_FM.md',
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
        self: '/reason-fm',
        foundationModelCloud: '/foundation-model-cloud',
        modelServing: '/model-serving',
        atlas: '/atlas',
        gateway: '/gateway',
      },
      docs: '/docs/REASON_FM.md',
      note: 'Reason FM — VerbaLab-owned model family wired to own-AI gateway.',
    };
  }

  monitoring() {
    return {
      status: 'ready',
      honesty: reasonfmHonesty(),
      ownAi: ownAiStackSummary(),
    };
  }
}
