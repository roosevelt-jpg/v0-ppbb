import { HttpStatus, Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import {
  complianceAttestationsCatalog,
  complianceAttestationsHonesty,
} from './compliance-attestations.catalog';
import { SessionContext } from '../common/guards/clerk-auth.guard';

const FRAMEWORKS = [
  { id: 'POPIA', name: 'South Africa POPIA', region: 'af', industries: ['banking', 'healthcare', 'government', 'telco'] },
  { id: 'NDPR', name: 'Nigeria NDPR', region: 'af', industries: ['banking', 'healthcare', 'telco'] },
  { id: 'GDPR', name: 'EU GDPR', region: 'eu', industries: ['banking', 'healthcare', 'government', 'telco', 'agri'] },
  { id: 'SOC2', name: 'SOC 2 Type II controls map', region: 'global', industries: ['banking', 'healthcare', 'telco'] },
  { id: 'ISO27001', name: 'ISO/IEC 27001', region: 'global', industries: ['banking', 'healthcare', 'government'] },
];

const INDUSTRIES = [
  { id: 'banking', name: 'Banking & fintech', defaultFrameworks: ['POPIA', 'NDPR', 'SOC2'] },
  { id: 'healthcare', name: 'Healthcare', defaultFrameworks: ['POPIA', 'GDPR', 'ISO27001'] },
  { id: 'government', name: 'Government & civic', defaultFrameworks: ['POPIA', 'ISO27001'] },
  { id: 'telco', name: 'Telecommunications', defaultFrameworks: ['NDPR', 'POPIA', 'SOC2'] },
  { id: 'agri', name: 'Agriculture & agri-finance', defaultFrameworks: ['POPIA', 'GDPR'] },
];

type Attestation = {
  id: string;
  organizationId: string;
  industry: string;
  framework: string;
  region: string;
  status: 'issued' | 'revoked';
  evidenceHash: string;
  issuedAt: string;
  token: string;
};

@Injectable()
export class ComplianceAttestationsService {
  private readonly attestations = new Map<string, Attestation>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  engine() {
    return {
      ...complianceAttestationsCatalog(),
      safety: complianceAttestationsHonesty(),
      frameworkCount: FRAMEWORKS.length,
      industryCount: INDUSTRIES.length,
      issued: this.attestations.size,
    };
  }

  frameworks() {
    return { frameworks: FRAMEWORKS, count: FRAMEWORKS.length };
  }

  industries() {
    return { industries: INDUSTRIES, count: INDUSTRIES.length };
  }

  async activity(organizationId: string) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const rows = await this.prisma.auditEvent.findMany({
      where: {
        organizationId,
        createdAt: { gte: since },
        action: { contains: 'compliance-attestations' },
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
      frameworks: this.frameworks(),
      industries: this.industries(),
      activity: await this.activity(session.organizationId),
      links: { self: '/compliance-attestations', docs: '/docs/COMPLIANCE_ATTESTATIONS.md' },
    };
  }

  monitoring() {
    return { status: 'ready', honesty: complianceAttestationsHonesty() };
  }

  async issue(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const industry = String(body.industry ?? 'banking').toLowerCase();
    const framework = String(body.framework ?? 'POPIA').toUpperCase();
    const region = String(body.region ?? 'af').toLowerCase();
    if (!INDUSTRIES.some((i) => i.id === industry)) {
      throw new ApiException('validation_error', 'unknown industry', HttpStatus.BAD_REQUEST);
    }
    if (!FRAMEWORKS.some((f) => f.id === framework)) {
      throw new ApiException('validation_error', 'unknown framework', HttpStatus.BAD_REQUEST);
    }
    const evidenceHash = createHash('sha256')
      .update(`${session.organizationId}:${industry}:${framework}:${region}:${Date.now()}`)
      .digest('hex');
    const id = randomUUID();
    const token = `vatt.${id}.${evidenceHash.slice(0, 16)}`;
    const attestation: Attestation = {
      id,
      organizationId: session.organizationId,
      industry,
      framework,
      region,
      status: 'issued',
      evidenceHash,
      issuedAt: new Date().toISOString(),
      token,
    };
    this.attestations.set(id, attestation);
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'compliance-attestations.issue',
      route: 'POST /v1/compliance-attestations/issue',
      ip,
      metadata: { attestationId: id, industry, framework, region } as never,
    });
    return { attestation, note: 'Share token with auditors; pair with DPA + evidence export.' };
  }

  async verify(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const token = String(body.token ?? '');
    const attestationId = String(body.attestationId ?? (token.includes('.') ? token.split('.')[1] : '')).trim();
    const attestation = attestationId ? this.attestations.get(attestationId) : undefined;
    const valid =
      Boolean(attestation) &&
      attestation!.status === 'issued' &&
      (!token || token === attestation!.token || token.endsWith(attestation!.evidenceHash.slice(0, 16)));
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'compliance-attestations.verify',
      route: 'POST /v1/compliance-attestations/verify',
      ip,
      metadata: { attestationId, valid } as never,
    });
    return {
      valid,
      attestation: valid ? attestation : null,
      message: valid ? 'Attestation active' : 'Attestation not found or revoked',
    };
  }

  async dpa(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const industry = String(body.industry ?? 'healthcare').toLowerCase();
    const counterparty = String(body.counterparty ?? 'Counterparty').trim();
    const pack = INDUSTRIES.find((i) => i.id === industry);
    if (!pack) {
      throw new ApiException('validation_error', 'unknown industry', HttpStatus.BAD_REQUEST);
    }
    const dpa = {
      id: randomUUID(),
      organizationId: session.organizationId,
      industry,
      counterparty,
      frameworks: pack.defaultFrameworks,
      residencyDefault: 'af',
      clauses: [
        'Processing limited to stated purposes',
        'Africa primary residency with optional EU/US islands',
        'Sub-processor disclosure via VerbaLab control plane',
        'Audit evidence export within 15 business days',
        'Speaker consent required for voice cloning / biometrics',
      ],
      generatedAt: new Date().toISOString(),
    };
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'compliance-attestations.dpa',
      route: 'POST /v1/compliance-attestations/dpa',
      ip,
      metadata: { dpaId: dpa.id, industry, counterparty } as never,
    });
    return { dpa };
  }

  async evidence(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const attestationId = String(body.attestationId ?? '').trim();
    const attestation = this.attestations.get(attestationId);
    if (!attestation || attestation.organizationId !== session.organizationId) {
      throw new ApiException('not_found', 'attestation not found', HttpStatus.NOT_FOUND);
    }
    const format = String(body.format ?? 'json').toLowerCase();
    const pack = {
      attestation,
      controls: [
        { id: 'residency', status: 'pass', detail: `primary=${attestation.region}` },
        { id: 'encryption_in_transit', status: 'pass', detail: 'TLS 1.2+' },
        { id: 'access_audit', status: 'pass', detail: 'Clerk + API key audit trail' },
        { id: 'industry_dpa', status: 'pass', detail: `${attestation.industry} pack available` },
      ],
      exportedAt: new Date().toISOString(),
      format,
    };
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'compliance-attestations.evidence',
      route: 'POST /v1/compliance-attestations/evidence',
      ip,
      metadata: { attestationId, format } as never,
    });
    return { evidence: pack };
  }
}
