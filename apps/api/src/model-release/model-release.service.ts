import { HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { UsageService } from '../usage/usage.service';
import { GpuPlatformService } from '../gpu-platform/gpu-platform.service';
import { runAfricanQualityEval } from '../model-runtime/african-quality-eval';
import { probeWeightsDeploy, HERO_WEIGHT_LANGUAGES } from '../model-runtime/weights-deploy';
import {
  modelReleaseCatalog,
  modelReleaseHonesty,
  seedModelSkus,
  type ModelSku,
  type ReleaseStage,
} from './model-release.catalog';
import { padProviderStatus } from './pad-provider';

type ReleaseRecord = {
  id: string;
  organizationId: string;
  skuId: string;
  stage: ReleaseStage;
  gatePassed: boolean | null;
  gateReportId: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
  changelog: string;
};

@Injectable()
export class ModelReleaseService {
  private readonly skus = new Map<string, ModelSku>();
  private readonly releases = new Map<string, ReleaseRecord[]>();
  private readonly gates = new Map<string, ReturnType<typeof runAfricanQualityEval>>();

  constructor(
    private readonly audit: AuditService,
    private readonly usage: UsageService,
    private readonly gpu: GpuPlatformService,
  ) {
    for (const sku of seedModelSkus()) this.skus.set(sku.id, sku);
  }

  engine() {
    return {
      ...modelReleaseCatalog(),
      safety: modelReleaseHonesty(),
      skuCount: this.skus.size,
      pad: padProviderStatus(),
      weights: null as null,
    };
  }

  async overview(session: SessionContext) {
    const weights = await probeWeightsDeploy();
    return {
      session: { organizationId: session.organizationId, role: session.role },
      engine: { ...this.engine(), weights },
      skus: this.listSkus().skus.slice(0, 12),
      recentReleases: this.listReleases(session.organizationId).releases.slice(0, 8),
      links: modelReleaseCatalog().related,
    };
  }

  listSkus() {
    return {
      count: this.skus.size,
      heroLanguages: [...HERO_WEIGHT_LANGUAGES],
      skus: [...this.skus.values()],
    };
  }

  getSku(id: string) {
    const sku = this.skus.get(id);
    if (!sku) throw new ApiException('not_found', 'SKU not found', HttpStatus.NOT_FOUND);
    return sku;
  }

  async priority(organizationId: string) {
    const summary = await this.usage.summary(organizationId);
    const breakdown = summary.creditsBreakdown ?? {};
    const ranked = Object.entries(breakdown)
      .map(([feature, credits]) => ({ feature, credits: Number(credits) || 0 }))
      .sort((a, b) => b.credits - a.credits);

    const nextSkus: Array<{ skuId: string; reason: string }> = [];
    if ((breakdown.stt ?? 0) >= (breakdown.tts ?? 0)) {
      nextSkus.push({ skuId: 'vl-stt-sw-v1', reason: 'STT credit burn — prioritize Swahili Echo STT eval' });
      nextSkus.push({ skuId: 'vl-stt-yo-v1', reason: 'Hero language STT coverage' });
    } else {
      nextSkus.push({ skuId: 'vl-tts-sw-v1', reason: 'TTS credit burn — prioritize Swahili Voice FM' });
      nextSkus.push({ skuId: 'vl-tts-yo-v1', reason: 'Hero language TTS coverage' });
    }
    if ((breakdown.translate ?? 0) > 0) {
      nextSkus.push({ skuId: 'vl-mt-af-v1', reason: 'Translate usage — run African quality GA gate' });
    }
    nextSkus.push({
      skuId: 'vl-law-voice-auth-v1',
      reason: 'Trust moat — keep Voice Law PAD upgrade path funded',
    });

    return {
      periodStart: summary.periodStart,
      creditsUsed: summary.creditsUsed,
      rankedFeatures: ranked,
      recommendedNextModels: nextSkus,
      note: 'Priority is usage-driven — ship where credits already prove demand.',
    };
  }

  async gpuBudget() {
    const engine = await this.gpu.engine();
    return {
      ceilingsRequired: true,
      tiers: modelReleaseCatalog().infrastructureTiers,
      platform: {
        product: engine.product ?? 'GPU Platform',
        honesty: engine.honesty ?? engine.spendSafety ?? null,
      },
      note: 'Use Volume 7 GPU pools/quotas — never unbounded spend for model releases.',
    };
  }

  async runGate(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const skuId = body.skuId ? String(body.skuId) : 'vl-mt-af-v1';
    const sku = this.getSku(skuId);
    const report = runAfricanQualityEval(12);
    const minWinRate = Number(body.minOwnWinRate ?? 0.5);
    const passed = report.ownWinRate >= minWinRate && report.total > 0;
    const gateId = `gate_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
    this.gates.set(gateId, report);

    sku.qualityCard = {
      ...sku.qualityCard,
      metrics: {
        ...sku.qualityCard.metrics,
        ownWinRate: report.ownWinRate,
        baselineWinRate: report.baselineWinRate,
        total: report.total,
      },
      lastEvalAt: report.ranAt,
    };
    if (passed && sku.status === 'eval') sku.status = 'canary';
    if (passed && sku.family === 'mt') sku.status = 'canary';
    this.skus.set(sku.id, sku);

    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'model-release.gate',
      ip,
      metadata: { gateId, skuId, passed, ownWinRate: report.ownWinRate },
    });

    return {
      gateId,
      skuId,
      passed,
      minOwnWinRate: minWinRate,
      report,
      sku,
      gaRule:
        'Do not mark GA until african-quality-eval gate passes and human native-panel review is logged for speech SKUs.',
    };
  }

  listReleases(organizationId: string) {
    const rows = this.releases.get(organizationId) ?? [];
    return { count: rows.length, releases: [...rows].reverse() };
  }

  async createRelease(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const skuId = String(body.skuId ?? '').trim();
    if (!skuId) throw new ApiException('validation_error', 'skuId is required', HttpStatus.BAD_REQUEST);
    this.getSku(skuId);
    const row: ReleaseRecord = {
      id: `rel_${randomUUID().replace(/-/g, '').slice(0, 14)}`,
      organizationId: session.organizationId,
      skuId,
      stage: 'data',
      gatePassed: null,
      gateReportId: null,
      notes: String(body.notes ?? ''),
      changelog: String(body.changelog ?? `Started release for ${skuId}`),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const list = this.releases.get(session.organizationId) ?? [];
    list.push(row);
    this.releases.set(session.organizationId, list);
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'model-release.create',
      ip,
      metadata: { releaseId: row.id, skuId },
    });
    return row;
  }

  async promote(session: SessionContext, id: string, body: Record<string, unknown>, ip?: string) {
    const list = this.releases.get(session.organizationId) ?? [];
    const row = list.find((r) => r.id === id);
    if (!row) throw new ApiException('not_found', 'Release not found', HttpStatus.NOT_FOUND);

    const order: ReleaseStage[] = ['data', 'train', 'eval', 'serve', 'announce', 'ga'];
    const idx = order.indexOf(row.stage);
    const requested = body.stage != null ? String(body.stage) : null;
    const next: ReleaseStage =
      requested && order.includes(requested as ReleaseStage)
        ? (requested as ReleaseStage)
        : order[Math.min(Math.max(idx + 1, 0), order.length - 1)]!;
    if (!order.includes(next)) {
      throw new ApiException('validation_error', 'Invalid stage', HttpStatus.BAD_REQUEST);
    }

    if (next === 'ga' || next === 'announce' || next === 'serve') {
      if (row.gatePassed !== true) {
        const gate = await this.runGate(session, { skuId: row.skuId }, ip);
        row.gatePassed = gate.passed;
        row.gateReportId = gate.gateId;
        if (!gate.passed && next === 'ga') {
          throw new ApiException(
            'validation_error',
            `GA blocked — African quality gate failed (ownWinRate=${gate.report.ownWinRate})`,
            HttpStatus.BAD_REQUEST,
          );
        }
      }
    }

    row.stage = next;
    row.updatedAt = new Date().toISOString();
    if (body.changelog) row.changelog = String(body.changelog);
    if (next === 'ga') {
      const sku = this.getSku(row.skuId);
      sku.status = 'ga';
      this.skus.set(sku.id, sku);
    }

    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'model-release.promote',
      ip,
      metadata: { releaseId: row.id, stage: row.stage, gatePassed: row.gatePassed },
    });
    return row;
  }
}
