import { HttpStatus, Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CivicVoiceSealService } from '../civic-voice-seal/civic-voice-seal.service';
import { ApiException } from '../common/errors/api-exception';
import {
  civicTruthGuardCatalog,
  civicTruthGuardHonesty,
} from './civic-truth-guard.catalog';
import { SessionContext } from '../common/guards/clerk-auth.guard';

const SIGNALS = [
  { id: 'seal_missing', weight: 0.25, description: 'No civic voice seal attached to attributed speaker' },
  { id: 'seal_revoked', weight: 0.35, description: 'Seal revoked or synthetic-flagged' },
  { id: 'urgency_clickbait', weight: 0.15, description: 'Urgency / share-now framing without source' },
  { id: 'identity_mismatch', weight: 0.2, description: 'Claimed speaker name does not match seal subject' },
  { id: 'unverified_repost', weight: 0.1, description: 'Repost chain without primary source' },
  { id: 'deepfake_lexicon', weight: 0.2, description: 'Language cues associated with synthetic voice scams' },
];

type Assessment = {
  id: string;
  organizationId: string;
  claim: string;
  speakerName?: string;
  url?: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  signals: Array<{ id: string; hit: boolean; detail: string }>;
  seal?: Record<string, unknown>;
  createdAt: string;
};

@Injectable()
export class CivicTruthGuardService {
  private readonly assessments = new Map<string, Assessment>();
  private readonly reports = new Map<string, Record<string, unknown>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly seals: CivicVoiceSealService,
  ) {}

  engine() {
    return {
      ...civicTruthGuardCatalog(),
      safety: civicTruthGuardHonesty(),
      signalCount: SIGNALS.length,
      assessments: this.assessments.size,
      related: {
        civicVoiceSeal: '/civic-voice-seal',
        voicePassport: '/voice-passport',
      },
    };
  }

  signals() {
    return { signals: SIGNALS, count: SIGNALS.length };
  }

  monitoring() {
    return { status: 'ready', honesty: civicTruthGuardHonesty() };
  }

  async activity(organizationId: string) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const rows = await this.prisma.auditEvent.findMany({
      where: {
        organizationId,
        createdAt: { gte: since },
        action: { contains: 'civic-truth' },
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
      signals: this.signals(),
      activity: await this.activity(session.organizationId),
      links: {
        self: '/civic-truth-guard',
        docs: '/docs/CIVIC_TRUTH_GUARD.md',
        institutions: '/africa-institutions',
      },
    };
  }

  async assess(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const claim = String(body.claim ?? body.text ?? '').trim();
    if (!claim) {
      throw new ApiException('validation_error', 'claim is required', HttpStatus.BAD_REQUEST);
    }
    const speakerName = body.speakerName ? String(body.speakerName) : undefined;
    const url = body.url ? String(body.url) : undefined;
    const token = body.sealToken ? String(body.sealToken) : undefined;
    const lower = claim.toLowerCase();

    const hits: Assessment['signals'] = [];
    const push = (id: string, hit: boolean, detail: string) => {
      hits.push({ id, hit, detail });
    };

    push(
      'urgency_clickbait',
      /(breaking|share before|deleted soon|forward this|must watch)/i.test(claim),
      'Urgency framing detected in claim text',
    );
    push(
      'deepfake_lexicon',
      /(cloned voice|ai voice|this is not me|deepfake|voice scam)/i.test(lower),
      'Synthetic / scam lexicon present',
    );
    push('unverified_repost', Boolean(url && /wa\.me|bit\.ly|t\.co|forwarded/i.test(url)), 'Weak provenance URL');

    let sealResult: Record<string, unknown> | undefined;
    if (token) {
      sealResult = (await this.seals.verify(session, { token }, ip)) as Record<string, unknown>;
      const authentic = Boolean(sealResult.authentic);
      push('seal_missing', false, 'Seal token provided');
      push('seal_revoked', !authentic, String(sealResult.message ?? 'seal check'));
      if (speakerName && sealResult.subjectName && String(sealResult.subjectName) !== speakerName) {
        push('identity_mismatch', true, 'Speaker name does not match seal subject');
      } else {
        push('identity_mismatch', false, 'Speaker name consistent or not supplied');
      }
    } else {
      push('seal_missing', true, 'No civic voice seal supplied for attributed speaker');
      push('seal_revoked', false, 'N/A');
      push('identity_mismatch', Boolean(speakerName), speakerName ? 'Unsealed attribution' : 'No speaker claimed');
    }

    let riskScore = 0;
    for (const signal of SIGNALS) {
      const hit = hits.find((h) => h.id === signal.id)?.hit;
      if (hit) riskScore += signal.weight;
    }
    riskScore = Number(Math.min(1, riskScore).toFixed(3));
    const riskLevel: Assessment['riskLevel'] =
      riskScore >= 0.55 ? 'high' : riskScore >= 0.3 ? 'medium' : 'low';

    const assessment: Assessment = {
      id: randomUUID(),
      organizationId: session.organizationId,
      claim,
      speakerName,
      url,
      riskScore,
      riskLevel,
      signals: hits,
      seal: sealResult,
      createdAt: new Date().toISOString(),
    };
    this.assessments.set(assessment.id, assessment);

    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'civic-truth-guard.assess',
      route: 'POST /v1/civic-truth-guard/assess',
      ip,
      metadata: { assessmentId: assessment.id, riskLevel, riskScore } as never,
    });

    return {
      assessment,
      guidance:
        riskLevel === 'high'
          ? 'Do not amplify. Request seal verification or primary source before sharing.'
          : riskLevel === 'medium'
            ? 'Treat as unverified. Ask for civic seal or original broadcast.'
            : 'Low synthetic risk signals — still confirm primary source for civic decisions.',
    };
  }

  async verifySeal(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const token = String(body.token ?? body.sealToken ?? '').trim();
    if (!token) {
      throw new ApiException('validation_error', 'token is required', HttpStatus.BAD_REQUEST);
    }
    const verified = await this.seals.verify(session, { token }, ip);
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'civic-truth-guard.verify-seal',
      route: 'POST /v1/civic-truth-guard/verify-seal',
      ip,
      metadata: { authentic: verified.authentic } as never,
    });
    return { verified, civicSealConsole: '/civic-voice-seal' };
  }

  async report(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const assessmentId = String(body.assessmentId ?? '').trim();
    const assessment = this.assessments.get(assessmentId);
    if (!assessment || assessment.organizationId !== session.organizationId) {
      throw new ApiException('not_found', 'assessment not found', HttpStatus.NOT_FOUND);
    }
    const reportId = randomUUID();
    const fingerprint = createHash('sha256')
      .update(`${assessment.id}:${assessment.riskScore}:${assessment.createdAt}`)
      .digest('hex')
      .slice(0, 16);
    const report = {
      id: reportId,
      assessmentId,
      riskLevel: assessment.riskLevel,
      riskScore: assessment.riskScore,
      claimPreview: assessment.claim.slice(0, 180),
      speakerName: assessment.speakerName ?? null,
      signals: assessment.signals.filter((s) => s.hit),
      fingerprint: `vctg.${reportId}.${fingerprint}`,
      publishedAt: new Date().toISOString(),
      shareHint: 'Attach fingerprint when debunking viral clips; pair with Civic Voice Seal verify.',
    };
    this.reports.set(reportId, report);
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'civic-truth-guard.report',
      route: 'POST /v1/civic-truth-guard/report',
      ip,
      metadata: { reportId, assessmentId, riskLevel: assessment.riskLevel } as never,
    });
    return { report };
  }
}
