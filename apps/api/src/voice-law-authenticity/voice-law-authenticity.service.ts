import { HttpStatus, Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { CivicVoiceSealService } from '../civic-voice-seal/civic-voice-seal.service';
import { CivicVoiceEvidenceService } from '../civic-voice-evidence/civic-voice-evidence.service';
import { SpeakerIntelligenceService } from '../speaker-intelligence/speaker-intelligence.service';
import { assessPad, padProviderStatus, type PadAssessment } from '../model-release/pad-provider';
import {
  voiceLawAuthenticityCatalog,
  voiceLawAuthenticityHonesty,
} from './voice-law-authenticity.catalog';

export type LawAuth = {
  organizationId: string;
  workspaceId: string;
  userId?: string;
  apiKeyId?: string;
  ip?: string;
};

type ExpertReview = {
  id: string;
  reportId: string;
  organizationId: string;
  status: 'requested' | 'assigned' | 'in_review' | 'completed' | 'declined';
  labName?: string;
  reviewerName?: string;
  notes: string;
  findings?: string;
  requestedAt: string;
  updatedAt: string;
  completedAt?: string;
};

type AuthenticityReport = {
  id: string;
  organizationId: string;
  createdAt: string;
  caseRef?: string;
  claimedSpeaker?: string;
  file: { name: string; bytes: number; sha256: string; mime?: string };
  pad: PadAssessment;
  /** @deprecated alias of pad for console/API compatibility */
  antiSpoof: {
    riskScore: number;
    decision: PadAssessment['decision'];
    flags: string[];
    note: string;
    provider: PadAssessment['provider'];
    certifiedPad: false;
  };
  speakerMatch: null | {
    profileId: string;
    matched: boolean;
    score: number | null;
    threshold: number;
    note: string;
  };
  seal: null | Record<string, unknown>;
  evidenceAppend: null | { recordId: string; chainHash: string };
  authenticity: {
    riskScore: number;
    label: 'likely_genuine' | 'needs_review' | 'likely_synthetic_or_spoof';
    confidence: 'low' | 'medium';
  };
  legal: {
    assistiveOnly: true;
    courtSoleEvidence: false;
    nistPadCertified: false;
    disclaimer: string;
    recommendedNextSteps: string[];
  };
  expertReviewIds: string[];
  model: { id: string; version: string; padProvider: PadAssessment['provider'] };
};

@Injectable()
export class VoiceLawAuthenticityService {
  private readonly reports = new Map<string, AuthenticityReport[]>();
  private readonly expertReviews = new Map<string, ExpertReview[]>();

  constructor(
    private readonly audit: AuditService,
    private readonly seals: CivicVoiceSealService,
    private readonly evidence: CivicVoiceEvidenceService,
    private readonly speakers: SpeakerIntelligenceService,
  ) {}

  engine() {
    return {
      ...voiceLawAuthenticityCatalog(),
      safety: voiceLawAuthenticityHonesty(),
      pad: padProviderStatus(),
      orgsWithReports: this.reports.size,
    };
  }

  monitoring() {
    return {
      status: 'ready',
      honesty: voiceLawAuthenticityHonesty(),
      pad: padProviderStatus(),
    };
  }

  private orgReports(organizationId: string) {
    if (!this.reports.has(organizationId)) this.reports.set(organizationId, []);
    return this.reports.get(organizationId)!;
  }

  private orgReviews(organizationId: string) {
    if (!this.expertReviews.has(organizationId)) this.expertReviews.set(organizationId, []);
    return this.expertReviews.get(organizationId)!;
  }

  async overview(session: SessionContext) {
    const rows = this.orgReports(session.organizationId);
    const reviews = this.orgReviews(session.organizationId);
    return {
      session: {
        organizationId: session.organizationId,
        role: session.role,
      },
      engine: this.engine(),
      recent: rows.slice(-8).reverse(),
      expertReviewsPending: reviews.filter((r) => r.status !== 'completed' && r.status !== 'declined')
        .length,
      links: {
        self: '/voice-law-authenticity',
        docs: '/docs/VOICE_LAW_AUTHENTICITY.md',
        biometrics: '/voice-biometrics',
        evidence: '/civic-voice-evidence',
        seal: '/civic-voice-seal',
        modelRelease: '/model-release',
      },
    };
  }

  listReports(organizationId: string) {
    const rows = this.orgReports(organizationId);
    return {
      count: rows.length,
      reports: rows
        .slice()
        .reverse()
        .slice(0, 40)
        .map((r) => ({
          id: r.id,
          createdAt: r.createdAt,
          caseRef: r.caseRef,
          label: r.authenticity.label,
          riskScore: r.authenticity.riskScore,
          fileSha256: r.file.sha256,
          padProvider: r.pad.provider,
          expertReviewCount: r.expertReviewIds.length,
        })),
    };
  }

  getReport(organizationId: string, id: string) {
    const row = this.orgReports(organizationId).find((r) => r.id === id);
    if (!row) {
      throw new ApiException('not_found', 'Authenticity report not found', HttpStatus.NOT_FOUND);
    }
    return row;
  }

  listExpertReviews(organizationId: string, reportId?: string) {
    let rows = this.orgReviews(organizationId);
    if (reportId) rows = rows.filter((r) => r.reportId === reportId);
    return {
      count: rows.length,
      reviews: [...rows].reverse().slice(0, 40),
      honesty:
        'Expert review is a workflow handoff to accredited forensic labs — the model never becomes sole evidence.',
    };
  }

  async requestExpertReview(
    session: SessionContext,
    reportId: string,
    body: Record<string, unknown>,
    ip?: string,
  ) {
    const report = this.getReport(session.organizationId, reportId);
    const row: ExpertReview = {
      id: `vxr_${randomUUID().replace(/-/g, '').slice(0, 14)}`,
      reportId: report.id,
      organizationId: session.organizationId,
      status: 'requested',
      labName: body.labName ? String(body.labName).trim() : undefined,
      reviewerName: body.reviewerName ? String(body.reviewerName).trim() : undefined,
      notes: String(body.notes ?? 'Please review contested segments with chain-of-custody preserved.'),
      requestedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.orgReviews(session.organizationId).push(row);
    report.expertReviewIds.push(row.id);

    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'voice-law-authenticity.expert-review.request',
      ip,
      metadata: { reviewId: row.id, reportId: report.id, labName: row.labName ?? null },
    });

    return {
      review: row,
      reportId: report.id,
      next:
        'Route the original media + this report ID to an accredited forensic audio lab. Model scores remain assistive only.',
    };
  }

  async updateExpertReview(
    session: SessionContext,
    reviewId: string,
    body: Record<string, unknown>,
    ip?: string,
  ) {
    const row = this.orgReviews(session.organizationId).find((r) => r.id === reviewId);
    if (!row) {
      throw new ApiException('not_found', 'Expert review not found', HttpStatus.NOT_FOUND);
    }
    const allowed: ExpertReview['status'][] = [
      'requested',
      'assigned',
      'in_review',
      'completed',
      'declined',
    ];
    if (body.status) {
      const status = String(body.status) as ExpertReview['status'];
      if (!allowed.includes(status)) {
        throw new ApiException('validation_error', 'Invalid review status', HttpStatus.BAD_REQUEST);
      }
      row.status = status;
      if (status === 'completed') row.completedAt = new Date().toISOString();
    }
    if (body.labName != null) row.labName = String(body.labName).trim() || undefined;
    if (body.reviewerName != null) row.reviewerName = String(body.reviewerName).trim() || undefined;
    if (body.notes != null) row.notes = String(body.notes);
    if (body.findings != null) row.findings = String(body.findings);
    row.updatedAt = new Date().toISOString();

    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'voice-law-authenticity.expert-review.update',
      ip,
      metadata: { reviewId: row.id, status: row.status },
    });
    return row;
  }

  async analyze(
    auth: LawAuth,
    opts: {
      file: Express.Multer.File;
      caseRef?: string;
      claimedSpeaker?: string;
      profileId?: string;
      sealToken?: string;
      appendEvidence?: boolean;
      threshold?: number;
      africanLanguageHint?: string;
      telephonyCodec?: string;
    },
  ) {
    if (!opts.file?.buffer?.length) {
      throw new ApiException('validation_error', 'audio file is required', HttpStatus.BAD_REQUEST);
    }

    const sha256 = createHash('sha256').update(opts.file.buffer).digest('hex');
    const pad = await assessPad({
      buffer: opts.file.buffer,
      mimeType: opts.file.mimetype,
      filename: opts.file.originalname,
      africanLanguageHint: opts.africanLanguageHint,
      telephonyCodec: opts.telephonyCodec,
    });

    let speakerMatch: AuthenticityReport['speakerMatch'] = null;
    if (opts.profileId) {
      try {
        const verify = await this.speakers.verify({
          organizationId: auth.organizationId,
          workspaceId: auth.workspaceId,
          profileId: opts.profileId,
          file: opts.file,
          threshold: opts.threshold,
          userId: auth.userId,
          ip: auth.ip,
        });
        speakerMatch = {
          profileId: opts.profileId,
          matched: Boolean(verify.match) || verify.decision === 'accept',
          score: typeof verify.score === 'number' ? verify.score : null,
          threshold: typeof verify.threshold === 'number' ? verify.threshold : opts.threshold ?? 0.75,
          note: String(verify.note ?? `Speaker verify decision=${verify.decision}`),
        };
      } catch (err) {
        speakerMatch = {
          profileId: opts.profileId,
          matched: false,
          score: null,
          threshold: typeof opts.threshold === 'number' ? opts.threshold : 0.75,
          note: err instanceof Error ? err.message : 'Speaker verify failed',
        };
      }
    }

    let seal: AuthenticityReport['seal'] = null;
    if (opts.sealToken) {
      seal = (await this.seals.verify(
        {
          organizationId: auth.organizationId,
          workspaceId: auth.workspaceId,
          userId: auth.userId ?? 'api',
          role: 'member',
        } as SessionContext,
        { token: opts.sealToken },
        auth.ip,
      )) as Record<string, unknown>;
    }

    let risk = pad.riskScore;
    if (speakerMatch && !speakerMatch.matched) risk = Math.min(1, risk + 0.25);
    if (seal && seal.authentic === false) risk = Math.min(1, risk + 0.3);
    if (seal && seal.authentic === true) risk = Math.max(0, risk - 0.15);
    risk = Number(risk.toFixed(3));

    const label: AuthenticityReport['authenticity']['label'] =
      risk >= 0.65 ? 'likely_synthetic_or_spoof' : risk >= 0.35 ? 'needs_review' : 'likely_genuine';

    let evidenceAppend: AuthenticityReport['evidenceAppend'] = null;
    if (opts.appendEvidence) {
      const appended = await this.evidence.append(
        {
          organizationId: auth.organizationId,
          workspaceId: auth.workspaceId,
          userId: auth.userId ?? 'api',
          role: 'member',
        } as SessionContext,
        {
          utterance: `voice-law-auth sha256=${sha256} label=${label} risk=${risk} pad=${pad.provider}`,
          actor: opts.claimedSpeaker ?? 'forensic_upload',
          watermarkTip: opts.sealToken ? `seal:${opts.sealToken.slice(0, 12)}` : undefined,
        },
        auth.ip,
      );
      evidenceAppend = {
        recordId: appended.record.id,
        chainHash: appended.record.chainHash,
      };
    }

    const report: AuthenticityReport = {
      id: `vla_${randomUUID().replace(/-/g, '').slice(0, 20)}`,
      organizationId: auth.organizationId,
      createdAt: new Date().toISOString(),
      caseRef: opts.caseRef,
      claimedSpeaker: opts.claimedSpeaker,
      file: {
        name: opts.file.originalname || 'recording',
        bytes: opts.file.buffer.length,
        sha256,
        mime: opts.file.mimetype,
      },
      pad,
      antiSpoof: {
        riskScore: pad.riskScore,
        decision: pad.decision,
        flags: pad.flags,
        note: pad.note,
        provider: pad.provider,
        certifiedPad: false,
      },
      speakerMatch,
      seal,
      evidenceAppend,
      authenticity: {
        riskScore: risk,
        label,
        confidence: pad.provider === 'http_pad' ? 'medium' : 'low',
      },
      legal: {
        assistiveOnly: true,
        courtSoleEvidence: false,
        nistPadCertified: false,
        disclaimer:
          'This report is investigative assistance only. It must not be used as the sole basis for guilt, admission of evidence, or denial of liberty. Human forensic experts and jurisdictional rules remain authoritative.',
        recommendedNextSteps: [
          'Preserve original media with write-blocked chain-of-custody',
          'Request expert review via Voice Law and route to an accredited forensic audio lab',
          'Have a qualified forensic audio examiner review contested segments',
          'Cross-check civic voice seals / voice passport if an attributed public speaker',
          'If cloning is alleged, request consent + watermark lineage from the generating platform',
          'Do not present model scores alone as courtroom proof of authenticity',
          ...pad.telephonyCodecHints.slice(0, 2),
        ],
      },
      expertReviewIds: [],
      model: { id: 'vl-law-voice-auth', version: 'v1', padProvider: pad.provider },
    };

    this.orgReports(auth.organizationId).push(report);

    await this.audit.record({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'voice-law-authenticity.analyze',
      ip: auth.ip,
      metadata: {
        reportId: report.id,
        label,
        riskScore: risk,
        sha256,
        caseRef: opts.caseRef ?? null,
        padProvider: pad.provider,
      },
    });

    return report;
  }
}
