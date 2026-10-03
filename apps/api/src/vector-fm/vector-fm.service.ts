import { Injectable } from '@nestjs/common';
import { UsageService } from '../usage/usage.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { ownAiStackSummary } from '../gateway/verbalab-own-ai';
import { vectorfmCapabilities, vectorfmCatalog, vectorfmHonesty } from './vector-fm.catalog';

@Injectable()
export class VectorFmService {
  constructor(private readonly usage: UsageService) {}

  engine() {
    return {
      ...vectorfmCatalog(),
      capabilities: vectorfmCapabilities(),
      ownAi: ownAiStackSummary(),
      safety: {
        ownedModels: true,
        vendorRentalDefault: false,
        note:
          'Vector FM is a VerbaLab-owned foundation model product. Inference uses VerbaLab model endpoints (credentials configured separately). Repo does not embed weight binaries.',
      },
    };
  }

  capabilities() {
    return {
      capabilities: vectorfmCapabilities(),
      honesty: vectorfmHonesty(),
      docs: '/docs/VECTOR_FM.md',
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
        self: '/vector-fm',
        foundationModelCloud: '/foundation-model-cloud',
        modelServing: '/model-serving',
        atlas: '/atlas',
        gateway: '/gateway',
      },
      docs: '/docs/VECTOR_FM.md',
      note: 'Vector FM — VerbaLab-owned model family wired to own-AI gateway.',
    };
  }

  monitoring() {
    return {
      status: 'ready',
      honesty: vectorfmHonesty(),
      ownAi: ownAiStackSummary(),
    };
  }
}
