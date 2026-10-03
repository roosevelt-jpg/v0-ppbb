import { Injectable } from '@nestjs/common';
import { UsageService } from '../usage/usage.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { ownAiStackSummary } from '../gateway/verbalab-own-ai';
import { visionfmCapabilities, visionfmCatalog, visionfmHonesty } from './vision-fm.catalog';

@Injectable()
export class VisionFmService {
  constructor(private readonly usage: UsageService) {}

  engine() {
    return {
      ...visionfmCatalog(),
      capabilities: visionfmCapabilities(),
      ownAi: ownAiStackSummary(),
      safety: {
        ownedModels: true,
        vendorRentalDefault: false,
        note:
          'Vision FM is a VerbaLab-owned foundation model product. Inference uses VerbaLab model endpoints (credentials configured separately). Repo does not embed weight binaries.',
      },
    };
  }

  capabilities() {
    return {
      capabilities: visionfmCapabilities(),
      honesty: visionfmHonesty(),
      docs: '/docs/VISION_FM.md',
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
        self: '/vision-fm',
        foundationModelCloud: '/foundation-model-cloud',
        modelServing: '/model-serving',
        atlas: '/atlas',
        gateway: '/gateway',
      },
      docs: '/docs/VISION_FM.md',
      note: 'Vision FM — VerbaLab-owned model family wired to own-AI gateway.',
    };
  }

  monitoring() {
    return {
      status: 'ready',
      honesty: visionfmHonesty(),
      ownAi: ownAiStackSummary(),
    };
  }
}
