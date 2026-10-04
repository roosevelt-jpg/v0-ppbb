import { HttpStatus, Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import { voicePassportCatalog, voicePassportHonesty } from './voice-passport.catalog';
import { SessionContext } from '../common/guards/clerk-auth.guard';

type Passport = {
  id: string;
  organizationId: string;
  holderName: string;
  country: string;
  scopes: string[];
  status: 'active' | 'revoked';
  endorsements: Array<{ id: string; endorser: string; at: string }>;
  publicKeyHint: string;
  issuedAt: string;
};

@Injectable()
export class VoicePassportService {
  private readonly passports = new Map<string, Passport>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  engine() {
    return {
      ...voicePassportCatalog(),
      safety: voicePassportHonesty(),
      passports: this.passports.size,
      trustLayers: ['holder_consent', 'endorsement', 'purpose_scope', 'cross_border'],
    };
  }

  directory() {
    return {
      passports: [...this.passports.values()].map((p) => ({
        id: p.id,
        holderName: p.holderName,
        country: p.country,
        scopes: p.scopes,
        status: p.status,
        endorsements: p.endorsements.length,
        publicKeyHint: p.publicKeyHint,
      })),
      count: this.passports.size,
    };
  }

  async activity(organizationId: string) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const rows = await this.prisma.auditEvent.findMany({
      where: { organizationId, createdAt: { gte: since }, action: { contains: 'voice-passport' } },
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
      links: { self: '/voice-passport', docs: '/docs/VOICE_PASSPORT.md' },
    };
  }

  monitoring() {
    return { status: 'ready', honesty: voicePassportHonesty() };
  }

  async issue(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const holderName = String(body.holderName ?? body.name ?? '').trim();
    if (!holderName) {
      throw new ApiException('validation_error', 'holderName is required', HttpStatus.BAD_REQUEST);
    }
    const scopes = String(body.scopes ?? 'tts')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const material = `${session.organizationId}:${holderName}:${Date.now()}`;
    const passport: Passport = {
      id: randomUUID(),
      organizationId: session.organizationId,
      holderName,
      country: String(body.country ?? 'SN').toUpperCase(),
      scopes,
      status: 'active',
      endorsements: [],
      publicKeyHint: createHash('sha256').update(material).digest('hex').slice(0, 16),
      issuedAt: new Date().toISOString(),
    };
    this.passports.set(passport.id, passport);
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'voice-passport.issue',
      route: 'POST /v1/voice-passport/issue',
      ip,
      metadata: { passportId: passport.id, scopes } as never,
    });
    return {
      passport,
      credential: `vpass.${passport.id}.${passport.publicKeyHint}`,
      note: 'Present credential with purpose scope when cloning or redistributing voice.',
    };
  }

  async endorse(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const passportId = String(body.passportId ?? '').trim();
    const passport = this.passports.get(passportId);
    if (!passport || passport.organizationId !== session.organizationId) {
      throw new ApiException('not_found', 'passport not found', HttpStatus.NOT_FOUND);
    }
    if (passport.status !== 'active') {
      throw new ApiException('conflict', 'passport is not active', HttpStatus.CONFLICT);
    }
    const endorser = String(body.endorser ?? 'witness').trim();
    passport.endorsements.push({
      id: randomUUID(),
      endorser,
      at: new Date().toISOString(),
    });
    this.passports.set(passportId, passport);
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'voice-passport.endorse',
      route: 'POST /v1/voice-passport/endorse',
      ip,
      metadata: { passportId, endorser } as never,
    });
    return { passport };
  }

  async check(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const passportId = String(body.passportId ?? '').trim();
    const purpose = String(body.purpose ?? 'tts').trim();
    const country = String(body.country ?? '').toUpperCase();
    const passport = this.passports.get(passportId);
    if (!passport) {
      throw new ApiException('not_found', 'passport not found', HttpStatus.NOT_FOUND);
    }
    const scopeOk =
      passport.scopes.includes(purpose) ||
      passport.scopes.includes('*') ||
      (purpose === 'voice_clone' && passport.scopes.includes('clone'));
    const endorsementOk = passport.endorsements.length > 0 || purpose === 'tts';
    const borderOk = !country || country === passport.country || passport.scopes.includes('cross_border');
    const allowed = passport.status === 'active' && scopeOk && endorsementOk && borderOk;
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'voice-passport.check',
      route: 'POST /v1/voice-passport/check',
      ip,
      metadata: { passportId, purpose, allowed } as never,
    });
    return {
      allowed,
      reasons: {
        active: passport.status === 'active',
        scopeOk,
        endorsementOk,
        borderOk,
      },
      passport: {
        id: passport.id,
        holderName: passport.holderName,
        country: passport.country,
        scopes: passport.scopes,
      },
    };
  }

  async revoke(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const passportId = String(body.passportId ?? '').trim();
    const passport = this.passports.get(passportId);
    if (!passport || passport.organizationId !== session.organizationId) {
      throw new ApiException('not_found', 'passport not found', HttpStatus.NOT_FOUND);
    }
    passport.status = 'revoked';
    this.passports.set(passportId, passport);
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'voice-passport.revoke',
      route: 'POST /v1/voice-passport/revoke',
      ip,
      metadata: { passportId, reason: String(body.reason ?? 'revoked') } as never,
    });
    return { passport };
  }
}
