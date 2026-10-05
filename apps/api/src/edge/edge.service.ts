import { Injectable } from '@nestjs/common';
import { UsageService } from '../usage/usage.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { ownAiStackSummary } from '../gateway/verbalab-own-ai';
import { developOwnModelEngine } from '../own-models/own-models.catalog';
import { edgeCapabilities, edgeCatalog, edgeHonesty } from './edge.catalog';

@Injectable()
export class EdgeService {
  constructor(private readonly usage: UsageService) {}

  engine() {
    return developOwnModelEngine('edge', {
      ...edgeCatalog(),
      capabilities: edgeCapabilities(),
      ownAi: ownAiStackSummary(),
      safety: {
        ownedModels: true,
        vendorRentalDefault: false,
        note:
          'Edge is a VerbaLab-owned foundation model product. Inference uses VerbaLab model endpoints (credentials configured separately). Repo does not embed weight binaries.',
      },
    });
  }

  capabilities() {
    return {
      capabilities: edgeCapabilities(),
      honesty: edgeHonesty(),
      docs: '/docs/EDGE.md',
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
        self: '/edge',
        foundationModelCloud: '/foundation-model-cloud',
        modelServing: '/model-serving',
        atlas: '/atlas',
        gateway: '/gateway',
      },
      docs: '/docs/EDGE.md',
      note: 'Edge — VerbaLab-owned model family wired to own-AI gateway.',
    };
  }

  monitoring() {
    return {
      status: 'ready',
      honesty: edgeHonesty(),
      ownAi: ownAiStackSummary(),
    };
  }
}
