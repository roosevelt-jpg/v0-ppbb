import { HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import { africaEvalMatrixCatalog, africaEvalMatrixHonesty } from './africa-eval-matrix.catalog';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { LANGUAGE_SEEDS } from '../languages/language-seeds';

const MATRIX_ROWS = [
  { language: 'sw', domain: 'banking', model: 'echo', wer: 0.09, mos: 4.2, intent: 0.93 },
  { language: 'yo', domain: 'healthcare', model: 'echo', wer: 0.12, mos: 4.0, intent: 0.9 },
  { language: 'ha', domain: 'agri', model: 'echo', wer: 0.11, mos: 4.1, intent: 0.91 },
  { language: 'ar', domain: 'government', model: 'echo', wer: 0.1, mos: 4.15, intent: 0.92 },
  { language: 'zu', domain: 'telco', model: 'echo', wer: 0.13, mos: 3.95, intent: 0.88 },
  { language: 'am', domain: 'healthcare', model: 'echo', wer: 0.14, mos: 3.9, intent: 0.87 },
  { language: 'pcm', domain: 'telco', model: 'echo', wer: 0.1, mos: 4.05, intent: 0.9 },
  { language: 'fr', domain: 'banking', model: 'echo', wer: 0.08, mos: 4.25, intent: 0.94 },
];

function wer(hypothesis: string, reference: string): number {
  const a = hypothesis.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const b = reference.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!b.length) return a.length ? 1 : 0;
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return Number((dp[a.length][b.length] / b.length).toFixed(4));
}

@Injectable()
export class AfricaEvalMatrixService {
  private readonly publications = new Map<string, Record<string, unknown>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  engine() {
    const african = LANGUAGE_SEEDS.filter((l) => l.tier === 'strategic_african');
    return {
      ...africaEvalMatrixCatalog(),
      safety: africaEvalMatrixHonesty(),
      matrixRows: MATRIX_ROWS.length,
      africanLanguageCount: african.length,
      metrics: ['wer', 'mos', 'intent'],
    };
  }

  matrix() {
    return { rows: MATRIX_ROWS, count: MATRIX_ROWS.length, updatedAt: new Date().toISOString() };
  }

  languages() {
    const codes = [...new Set(MATRIX_ROWS.map((r) => r.language))];
    return {
      languages: codes.map((code) => {
        const seed = LANGUAGE_SEEDS.find((l) => l.code === code);
        return { code, name: seed?.name ?? code, tier: seed?.tier ?? 'catalog' };
      }),
      count: codes.length,
    };
  }

  async activity(organizationId: string) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const rows = await this.prisma.auditEvent.findMany({
      where: {
        organizationId,
        createdAt: { gte: since },
        action: { contains: 'africa-eval-matrix' },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: { id: true, action: true, createdAt: true },
    });
    return {
      window: '7d',
      count: rows.length,
      events: rows.map((r) => ({ id: r.id, action: r.action, at: r.createdAt.toISOString() })),
    };
  }

  async overview(session: SessionContext) {
    return {
      session: {
        organizationId: session.organizationId,
        workspaceId: session.workspaceId,
        role: session.role,
      },
      engine: this.engine(),
      matrix: this.matrix(),
      languages: this.languages(),
      activity: await this.activity(session.organizationId),
      links: { self: '/africa-eval-matrix', docs: '/docs/AFRICA_EVAL_MATRIX.md' },
    };
  }

  monitoring() {
    return { status: 'ready', honesty: africaEvalMatrixHonesty() };
  }

  async score(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const hypothesis = String(body.hypothesis ?? '').trim();
    const reference = String(body.reference ?? '').trim();
    if (!hypothesis || !reference) {
      throw new ApiException(
        'validation_error',
        'hypothesis and reference are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    const language = String(body.language ?? 'sw');
    const domain = String(body.domain ?? 'general');
    const scoreWer = wer(hypothesis, reference);
    const mos = Number((Math.max(1, 5 - scoreWer * 4)).toFixed(2));
    const intent = Number((Math.max(0, 1 - scoreWer * 1.2)).toFixed(3));
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'africa-eval-matrix.score',
      route: 'POST /v1/africa-eval-matrix/score',
      ip,
      metadata: { language, domain, wer: scoreWer } as never,
    });
    return {
      language,
      domain,
      metrics: { wer: scoreWer, mos, intent },
      hypothesis,
      reference,
    };
  }

  async compare(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const language = String(body.language ?? 'yo');
    const models = String(body.models ?? 'echo,whisper-stub')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const metric = String(body.metric ?? 'wer').toLowerCase();
    const results = models.map((model, idx) => {
      const base = MATRIX_ROWS.find((r) => r.language === language && r.model === 'echo');
      const bump = idx * 0.03;
      const werVal = Number(((base?.wer ?? 0.15) + bump).toFixed(3));
      const mos = Number(((base?.mos ?? 3.8) - bump * 2).toFixed(2));
      const intent = Number(((base?.intent ?? 0.85) - bump).toFixed(3));
      return { model, language, wer: werVal, mos, intent, selected: metric === 'wer' ? werVal : metric === 'mos' ? mos : intent };
    });
    results.sort((a, b) => (metric === 'mos' || metric === 'intent' ? b.selected - a.selected : a.selected - b.selected));
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'africa-eval-matrix.compare',
      route: 'POST /v1/africa-eval-matrix/compare',
      ip,
      metadata: { language, models, metric } as never,
    });
    return { language, metric, ranking: results };
  }

  async suite(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const suiteId = String(body.suiteId ?? 'af-core-40');
    const models = String(body.models ?? 'echo')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const rows = MATRIX_ROWS.filter((r) => models.includes(r.model) || models.includes('echo'));
    const avgWer = rows.reduce((s, r) => s + r.wer, 0) / (rows.length || 1);
    const avgMos = rows.reduce((s, r) => s + r.mos, 0) / (rows.length || 1);
    const report = {
      id: randomUUID(),
      suiteId,
      models,
      rows,
      summary: {
        avgWer: Number(avgWer.toFixed(3)),
        avgMos: Number(avgMos.toFixed(2)),
        languages: [...new Set(rows.map((r) => r.language))].length,
      },
      ranAt: new Date().toISOString(),
    };
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'africa-eval-matrix.suite',
      route: 'POST /v1/africa-eval-matrix/suite',
      ip,
      metadata: { suiteId, reportId: report.id } as never,
    });
    return { report };
  }

  async publish(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const suiteId = String(body.suiteId ?? 'af-core-40');
    const visibility = String(body.visibility ?? 'buyer');
    const publication = {
      id: randomUUID(),
      suiteId,
      visibility,
      organizationId: session.organizationId,
      slice: this.matrix(),
      publishedAt: new Date().toISOString(),
    };
    this.publications.set(publication.id, publication);
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'africa-eval-matrix.publish',
      route: 'POST /v1/africa-eval-matrix/publish',
      ip,
      metadata: { publicationId: publication.id, suiteId, visibility } as never,
    });
    return { publication };
  }
}
