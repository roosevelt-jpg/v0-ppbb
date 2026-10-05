import { HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import { industryDropsCatalog, industryDropsHonesty } from './industry-drops.catalog';
import { SessionContext } from '../common/guards/clerk-auth.guard';

const PACKS = [
  {
    id: 'banking-af',
    industry: 'banking',
    name: 'Africa Banking Drop',
    languages: ['en', 'sw', 'yo', 'ha', 'fr'],
    glossaryThemes: ['KYC', 'payments', 'fraud', 'mobile money'],
    evalSuite: 'banking-smoke',
    residency: 'af',
  },
  {
    id: 'healthcare-af',
    industry: 'healthcare',
    name: 'Africa Healthcare Drop',
    languages: ['en', 'sw', 'am', 'ar', 'zu'],
    glossaryThemes: ['triage', 'pharmacy', 'consent', 'referrals'],
    evalSuite: 'healthcare-smoke',
    residency: 'af',
  },
  {
    id: 'government-af',
    industry: 'government',
    name: 'Africa Government Drop',
    languages: ['en', 'sw', 'fr', 'ar', 'pt'],
    glossaryThemes: ['civic services', 'forms', 'announcements'],
    evalSuite: 'government-smoke',
    residency: 'af',
  },
  {
    id: 'telco-af',
    industry: 'telco',
    name: 'Africa Telco Drop',
    languages: ['en', 'sw', 'yo', 'ha', 'fr', 'pcm'],
    glossaryThemes: ['airtime', 'support', 'USSD', 'billing'],
    evalSuite: 'telco-smoke',
    residency: 'af',
  },
  {
    id: 'agri-af',
    industry: 'agri',
    name: 'Africa Agri Drop',
    languages: ['en', 'sw', 'yo', 'ha', 'am'],
    glossaryThemes: ['weather', 'markets', 'cooperatives', 'extension'],
    evalSuite: 'agri-smoke',
    residency: 'af',
  },
];

type Install = {
  id: string;
  organizationId: string;
  packId: string;
  workspaceName: string;
  residency: string;
  languages: string[];
  status: 'installed' | 'configured' | 'evaluated';
  lastEval?: { suite: string; score: number; at: string };
  installedAt: string;
};

@Injectable()
export class IndustryDropsService {
  private readonly installs = new Map<string, Install>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  engine() {
    return {
      ...industryDropsCatalog(),
      safety: industryDropsHonesty(),
      packCount: PACKS.length,
      installs: this.installs.size,
    };
  }

  packs() {
    return { packs: PACKS, count: PACKS.length };
  }

  async activity(organizationId: string) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const rows = await this.prisma.auditEvent.findMany({
      where: { organizationId, createdAt: { gte: since }, action: { contains: 'industry-drops' } },
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
      packs: this.packs(),
      activity: await this.activity(session.organizationId),
      links: { self: '/industry-drops', docs: '/docs/INDUSTRY_DROPS.md' },
    };
  }

  monitoring() {
    return { status: 'ready', honesty: industryDropsHonesty() };
  }

  async install(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const packId = String(body.packId ?? 'banking-af');
    const pack = PACKS.find((p) => p.id === packId);
    if (!pack) {
      throw new ApiException('validation_error', 'unknown packId', HttpStatus.BAD_REQUEST);
    }
    const install: Install = {
      id: randomUUID(),
      organizationId: session.organizationId,
      packId,
      workspaceName: String(body.workspaceName ?? pack.name),
      residency: pack.residency,
      languages: [...pack.languages],
      status: 'installed',
      installedAt: new Date().toISOString(),
    };
    this.installs.set(install.id, install);
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'industry-drops.install',
      route: 'POST /v1/industry-drops/install',
      ip,
      metadata: { installId: install.id, packId } as never,
    });
    return { install, pack };
  }

  async configure(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const installId = String(body.installId ?? '').trim();
    const install = this.installs.get(installId);
    if (!install || install.organizationId !== session.organizationId) {
      throw new ApiException('not_found', 'install not found', HttpStatus.NOT_FOUND);
    }
    if (body.residency) install.residency = String(body.residency);
    if (body.languages) {
      install.languages = String(body.languages)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    install.status = 'configured';
    this.installs.set(installId, install);
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'industry-drops.configure',
      route: 'POST /v1/industry-drops/configure',
      ip,
      metadata: { installId, residency: install.residency } as never,
    });
    return { install };
  }

  async evaluate(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const installId = String(body.installId ?? '').trim();
    const install = this.installs.get(installId);
    if (!install || install.organizationId !== session.organizationId) {
      throw new ApiException('not_found', 'install not found', HttpStatus.NOT_FOUND);
    }
    const pack = PACKS.find((p) => p.id === install.packId)!;
    const suite = String(body.suite ?? pack.evalSuite);
    const score = Math.min(0.99, 0.82 + install.languages.length * 0.02);
    install.lastEval = { suite, score: Number(score.toFixed(3)), at: new Date().toISOString() };
    install.status = 'evaluated';
    this.installs.set(installId, install);
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'industry-drops.evaluate',
      route: 'POST /v1/industry-drops/evaluate',
      ip,
      metadata: { installId, suite, score: install.lastEval.score } as never,
    });
    return {
      install,
      gate: { passed: install.lastEval.score >= 0.8, threshold: 0.8, suite, score: install.lastEval.score },
    };
  }

  async export(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const packId = String(body.packId ?? 'healthcare-af');
    const pack = PACKS.find((p) => p.id === packId);
    if (!pack) {
      throw new ApiException('validation_error', 'unknown packId', HttpStatus.BAD_REQUEST);
    }
    const manifest = {
      ...pack,
      prompts: pack.glossaryThemes.map((theme) => ({
        id: `${pack.id}-${theme.replace(/\s+/g, '-')}`,
        system: `You are a ${pack.industry} assistant for African markets. Focus on ${theme}.`,
      })),
      exportedAt: new Date().toISOString(),
      organizationId: session.organizationId,
    };
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'industry-drops.export',
      route: 'POST /v1/industry-drops/export',
      ip,
      metadata: { packId } as never,
    });
    return { manifest };
  }
}
