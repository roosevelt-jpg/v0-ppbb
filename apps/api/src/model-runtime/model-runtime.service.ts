import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { ownAiStackSummary } from '../gateway/verbalab-own-ai';
import { engineManifest, listPacks, translateAfrican } from './african-linguistic-engine';
import { runAfricanQualityEval } from './african-quality-eval';
import {
  assertEnterpriseUnlock,
  evaluateAllEnterpriseUnlocks,
  evaluateSectorUnlock,
  type EnterpriseSector,
} from './enterprise-unlocks';
import { deployShape, modelRuntimeCatalog, modelRuntimeHonesty } from './model-runtime.catalog';
import { localRuntimeStatus } from './local-runtime';

@Injectable()
export class ModelRuntimeService {
  engine() {
    return {
      ...modelRuntimeCatalog(),
      ownAi: ownAiStackSummary(),
      local: localRuntimeStatus(),
      deploy: deployShape(),
      africanEngine: engineManifest(),
      packs: listPacks(),
      safety: {
        ...modelRuntimeHonesty(),
        note:
          'Honest claim: local Own AI runtime + African eval harness + enterprise unlock gates ship in-product. Neural weight binaries remain deploy artifacts.',
      },
    };
  }

  deploy() {
    return {
      ...deployShape(),
      honesty: modelRuntimeHonesty(),
      docs: '/docs/MODEL_RUNTIME.md',
    };
  }

  packs() {
    return { packs: listPacks(), engine: engineManifest(), honesty: modelRuntimeHonesty() };
  }

  translate(body: { text: string; source: string; target: string; accent?: string }) {
    const out = translateAfrican(body);
    return { ...out, honesty: modelRuntimeHonesty() };
  }

  eval() {
    return runAfricanQualityEval();
  }

  unlocks() {
    return evaluateAllEnterpriseUnlocks();
  }

  unlockSector(sector: EnterpriseSector) {
    return evaluateSectorUnlock(sector);
  }

  assertUnlock(sector: EnterpriseSector, metIds: string[]) {
    return assertEnterpriseUnlock(sector, metIds);
  }

  async overview(session: SessionContext) {
    const evalReport = runAfricanQualityEval(6);
    const unlocks = evaluateAllEnterpriseUnlocks();
    return {
      session: {
        organizationId: session.organizationId,
        workspaceId: session.workspaceId,
        role: session.role,
      },
      engine: this.engine(),
      eval: {
        ownWinRate: evalReport.ownWinRate,
        baselineWinRate: evalReport.baselineWinRate,
        total: evalReport.total,
        honesty: evalReport.honesty,
      },
      unlocks,
      links: {
        self: '/model-runtime',
        modelKeys: '/model-keys',
        translateFm: '/translate-fm',
        credentials: '/credentials-readiness',
        enterpriseNation: '/enterprise-nation-platform',
      },
      honestToSayOutLoud: [
        'VerbaLab Own AI runs locally in-process (African linguistic runtime) without rented OpenAI/ElevenLabs/Google.',
        `African quality eval: Own AI exact-match ${(evalReport.ownWinRate * 100).toFixed(1)}% vs vendor baseline stub ${(evalReport.baselineWinRate * 100).toFixed(1)}% on ${evalReport.total} lexicon cases.`,
        'Gov / bank / hospital production unlocks are explicit checklist gates (default locked until residency, DPA, and sector safety flags are set).',
        'Neural weight binaries are deploy artifacts via VERBALAB_WEIGHTS_URL / model pods — not claimed as git-shipped SOTA weights.',
      ],
      docs: '/docs/MODEL_RUNTIME.md',
    };
  }

  monitoring() {
    return {
      status: 'ready',
      local: localRuntimeStatus(),
      unlocks: evaluateAllEnterpriseUnlocks(),
      honesty: modelRuntimeHonesty(),
    };
  }
}
