import { Injectable } from '@nestjs/common';
import { UsageService } from '../usage/usage.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import {
  atlasArchitectureNotes,
  atlasCapabilities,
  atlasCatalog,
  atlasHonesty,
} from './atlas.catalog';

@Injectable()
export class AtlasService {
  constructor(private readonly usage: UsageService) {}

  engine() {
    return {
      ...atlasCatalog(),
      capabilities: atlasCapabilities(),
      architecture: atlasArchitectureNotes(),
      safety: {
        noFakeTrainedWeights: true,
        scaffoldNotModel: true,
        note:
          'Atlas is a VerbaLab-owned model family. Inference uses VerbaLab Own AI endpoints (VERBALAB_CHAT_URL / MODEL_BASE_URL).',
      },
    };
  }

  capabilities() {
    return {
      capabilities: atlasCapabilities(),
      honesty: atlasHonesty(),
      docs: '/docs/ATLAS.md',
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
        chat: usageSummary.chat,
        embeddings: usageSummary.embeddings,
      },
      engine: this.engine(),
      deferred: {
        codingSpecialist: false,
        mathSpecialist: false,
        scientificSpecialist: false,
        businessSpecialist: false,
        legalSpecialist: false,
        medicalSpecialist: false,
        financialSpecialist: false,
        shipsTrainedAtlasWeights: true,
        frontierLabOs: true,
      },
      links: {
        atlas: '/atlas',
        foundationModelCloud: '/foundation-model-cloud',
        modelTrainingPlatform: '/model-training-platform',
        modelEvaluationPlatform: '/model-evaluation-platform',
        modelRegistry: '/model-registry',
        reasoningRuntime: '/reasoning-runtime',
        contextRuntime: '/context-runtime',
        agentRuntime: '/agent-runtime',
        chat: '/chat',
        modelServing: '/model-serving',
        gateway: '/gateway',
      },
      docs: '/docs/ATLAS.md',
      note:
        'Atlas scaffold. Capability map + MLOps handoffs.',
    };
  }

  monitoring() {
    return {
      mode: 'scaffold',
      capabilities: atlasCapabilities().map((c) => ({
        id: c.id,
        status: c.status,
      })),
      honesty: atlasHonesty(),
      note:
        'Atlas monitoring. Specialist scaffolds shipped via POST /v1/atlas/specialize; trained weights remain buy-path.',
    };
  }


  specialize(input: { domain?: string; query?: string }) {
    const allowed = [
      'coding',
      'math',
      'scientific',
      'business',
      'legal',
      'medical',
      'financial',
    ] as const;
    const raw = (input.domain ?? 'coding').trim().toLowerCase();
    const domain = allowed.includes(raw as (typeof allowed)[number])
      ? raw
      : raw.replace(/-reasoning$/, '');
    const resolved = allowed.includes(domain as (typeof allowed)[number]) ? domain : 'coding';
    return {
      domain: resolved,
      query: input.query?.trim() || null,
      planApi: 'POST /v1/reasoning-runtime/plan',
      chatApi: 'POST /v1/chat/completions',
      scaffold: {
        systemHint: `Atlas ${resolved} specialist scaffold — reason step by step; cite uncertainty.`,
        tools: ['reason.plan', 'chat.completions'],
      },
      honesty: {
        shipsTrainedAtlasWeights: false,
        specialistScaffold: true,
      },
      note: `domain=${resolved} specialist scaffold via Reasoning Runtime + chat. Not trained Atlas weights.`,
    };
  }
}
