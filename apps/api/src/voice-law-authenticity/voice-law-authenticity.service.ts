import { HttpStatus, Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { assessAntiSpoof } from '../voice-biometrics/anti-spoof';
import { CivicVoiceSealService } from '../civic-voice-seal/civic-voice-seal.service';
import { CivicVoiceEvidenceService } from '../civic-voice-evidence/civic-voice-evidence.service';
import { SpeakerIntelligenceService } from '../speaker-intelligence/speaker-intelligence.service';
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

type AuthenticityReport = {
  id: string;
  organizationId: string;
  createdAt: string;
  caseRef?: string;
  claimedSpeaker?: string;
  file: { name: string; bytes: number; sha256: string; mime?: string };
  antiSpoof: ReturnType<typeof assessAntiSpoof>;
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
  model: { id: string; version: string };
};

@Injectable()
export class VoiceLawAuthenticityService {
  private readonly reports = new Map<string, AuthenticityReport[]>();

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
      orgsWithReports: this.reports.size,
    };
  }

  monitoring() {
    return { status: 'ready', honesty: voiceLawAuthenticityHonesty() };
  }

  private orgReports(organizationId: string) {
    if (!this.reports.has(organizationId)) this.reports.set(organizationId, []);
    return this.reports.get(organizationId)!;
  }

  async overview(session: SessionContext) {
    const rows = this.orgReports(session.organizationId);
    return {
      session: {
        organizationId: session.organizationId,
        role: session.role,
      },
      engine: this.engine(),
      recent: rows.slice(-8).reverse(),
      links: {
        self: '/voice-law-authenticity',
        docs: '/docs/VOICE_LAW_AUTHENTICITY.md',
        biometrics: '/voice-biometrics',
        evidence: '/civic-voice-evidence',
        seal: '/civic-voice-seal',
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
    },
  ) {
    if (!opts.file?.buffer?.length) {
      throw new ApiException('validation_error', 'audio file is required', HttpStatus.BAD_REQUEST);
    }

    const sha256 = createHash('sha256').update(opts.file.buffer).digest('hex');
    const antiSpoof = assessAntiSpoof(opts.file.buffer);

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

    let risk = antiSpoof.riskScore;
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
          utterance: `voice-law-auth sha256=${sha256} label=${label} risk=${risk}`,
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
      antiSpoof,
      speakerMatch,
      seal,
      evidenceAppend,
      authenticity: {
        riskScore: risk,
        label,
        confidence: 'low',
      },
      legal: {
        assistiveOnly: true,
        courtSoleEvidence: false,
        nistPadCertified: false,
        disclaimer:
          'This report is investigative assistance only. It must not be used as the sole basis for guilt, admission of evidence, or denial of liberty. Human forensic experts and jurisdictional rules remain authoritative.',
        recommendedNextSteps: [
          'Preserve original media with write-blocked chain-of-custody',
          'Have a qualified forensic audio examiner review contested segments',
          'Cross-check civic voice seals / voice passport if an attributed public speaker',
          'If cloning is alleged, request consent + watermark lineage from the generating platform',
          'Do not present model scores alone as courtroom proof of authenticity',
        ],
      },
      model: { id: 'vl-law-voice-auth', version: 'v1' },
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
      },
    });

    return report;
  }
}
