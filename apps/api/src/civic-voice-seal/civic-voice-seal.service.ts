import { HttpStatus, Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import {
  civicVoiceSealCatalog,
  civicVoiceSealHonesty,
} from './civic-voice-seal.catalog';
import { SessionContext } from '../common/guards/clerk-auth.guard';

type Seal = {
  id: string;
  organizationId: string;
  subjectName: string;
  role: string;
  country: string;
  publicKeyHint: string;
  status: 'active' | 'revoked' | 'synthetic_flagged';
  issuedAt: string;
  challengeNonce?: string;
  challengeExpiresAt?: string;
};

@Injectable()
export class CivicVoiceSealService {
  private readonly seals = new Map<string, Seal>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  engine() {
    return {
      ...civicVoiceSealCatalog(),
      safety: civicVoiceSealHonesty(),
      seals: this.seals.size,
      verifyBudgetMs: 800,
    };
  }

  directory() {
    return {
      seals: [...this.seals.values()].map((s) => ({
        id: s.id,
        subjectName: s.subjectName,
        role: s.role,
        country: s.country,
        status: s.status,
        publicKeyHint: s.publicKeyHint,
      })),
      count: this.seals.size,
    };
  }

  async activity(organizationId: string) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const rows = await this.prisma.auditEvent.findMany({
      where: { organizationId, createdAt: { gte: since }, action: { contains: 'civic-voice' } },
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
      directory: this.directory(),
      activity: await this.activity(session.organizationId),
      links: { self: '/civic-voice-seal', docs: '/docs/CIVIC_VOICE_SEAL.md' },
    };
  }

  monitoring() {
    return { status: 'ready', honesty: civicVoiceSealHonesty() };
  }

  async issue(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const subjectName = String(body.subjectName ?? body.name ?? '').trim();
    if (!subjectName) {
      throw new ApiException('validation_error', 'subjectName is required', HttpStatus.BAD_REQUEST);
    }
    const material = `${session.organizationId}:${subjectName}:${Date.now()}`;
    const seal: Seal = {
      id: randomUUID(),
      organizationId: session.organizationId,
      subjectName,
      role: String(body.role ?? 'public_figure'),
      country: String(body.country ?? 'KE'),
      publicKeyHint: createHash('sha256').update(material).digest('hex').slice(0, 16),
      status: 'active',
      issuedAt: new Date().toISOString(),
    };
    this.seals.set(seal.id, seal);
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'civic-voice-seal.issue',
      route: 'POST /v1/civic-voice-seal/issue',
      ip,
      metadata: { sealId: seal.id, subjectName } as never,
    });
    return {
      seal,
      token: `vseal.${seal.id}.${seal.publicKeyHint}`,
      note: 'Embed token in broadcast watermark / companion QR for listener verify.',
    };
  }

  async verify(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const started = Date.now();
    const token = String(body.token ?? body.sealId ?? '');
    const sealId = (token.includes('.') ? token.split('.')[1] : token) || '';
    const seal = sealId ? this.seals.get(sealId) : undefined;
    const result = !seal
      ? { authentic: false, status: 'unknown', message: 'No seal found' }
      : seal.status === 'active'
        ? { authentic: true, status: 'active', message: 'Authentic as of now', subjectName: seal.subjectName }
        : seal.status === 'revoked'
          ? { authentic: false, status: 'revoked', message: 'Seal revoked — treat as untrusted' }
          : { authentic: false, status: seal.status, message: 'Synthetic / flagged' };
    const elapsedMs = Date.now() - started;
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'civic-voice-seal.verify',
      route: 'POST /v1/civic-voice-seal/verify',
      ip,
      metadata: { sealId, authentic: result.authentic, elapsedMs } as never,
    });
    return { ...result, sealId, elapsedMs, underBudget: elapsedMs < 800 };
  }

  async challenge(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const sealId = String(body.sealId ?? '');
    const seal = this.seals.get(sealId);
    if (!seal || seal.organizationId !== session.organizationId) {
      throw new ApiException('not_found', 'seal not found', HttpStatus.NOT_FOUND);
    }
    if (seal.status !== 'active') {
      throw new ApiException('conflict', 'seal is not active', HttpStatus.CONFLICT);
    }
    seal.challengeNonce = randomUUID().slice(0, 8);
    seal.challengeExpiresAt = new Date(Date.now() + 60_000).toISOString();
    this.seals.set(sealId, seal);
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'civic-voice-seal.challenge',
      route: 'POST /v1/civic-voice-seal/challenge',
      ip,
      metadata: { sealId, nonce: seal.challengeNonce } as never,
    });
    return {
      sealId,
      nonce: seal.challengeNonce,
      expiresAt: seal.challengeExpiresAt,
      instruction: 'Speaker must utter or sign the nonce within 60s for continuous authenticity.',
    };
  }

  async revoke(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const sealId = String(body.sealId ?? '');
    const seal = this.seals.get(sealId);
    if (!seal || seal.organizationId !== session.organizationId) {
      throw new ApiException('not_found', 'seal not found', HttpStatus.NOT_FOUND);
    }
    seal.status = 'revoked';
    this.seals.set(sealId, seal);
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'civic-voice-seal.revoke',
      route: 'POST /v1/civic-voice-seal/revoke',
      ip,
      metadata: { sealId, reason: String(body.reason ?? 'revoked') } as never,
    });
    return { seal };
  }
}
