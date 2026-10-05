import { Injectable } from '@nestjs/common';
import { UsageService } from '../usage/usage.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { ownAiStackSummary } from '../gateway/verbalab-own-ai';
import { developOwnModelEngine } from '../own-models/own-models.catalog';
import { baobabCapabilities, baobabCatalog, baobabHonesty } from './baobab.catalog';

@Injectable()
export class BaobabService {
  constructor(private readonly usage: UsageService) {}

  engine() {
    return developOwnModelEngine('baobab', {
      ...baobabCatalog(),
      capabilities: baobabCapabilities(),
      ownAi: ownAiStackSummary(),
      safety: {
        ownedModels: true,
        vendorRentalDefault: false,
        note:
          'Baobab is a VerbaLab-owned foundation model product. Inference uses VerbaLab model endpoints (credentials configured separately). Repo does not embed weight binaries.',
      },
    });
  }

  capabilities() {
    return {
      capabilities: baobabCapabilities(),
      honesty: baobabHonesty(),
      docs: '/docs/BAOBAB.md',
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
        self: '/baobab',
        foundationModelCloud: '/foundation-model-cloud',
        modelServing: '/model-serving',
        atlas: '/atlas',
        gateway: '/gateway',
      },
      docs: '/docs/BAOBAB.md',
      note: 'Baobab — VerbaLab-owned model family wired to own-AI gateway.',
    };
  }

  monitoring() {
    return {
      status: 'ready',
      honesty: baobabHonesty(),
      ownAi: ownAiStackSummary(),
    };
  }
}
