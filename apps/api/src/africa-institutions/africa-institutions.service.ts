import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  africaInstitutionsCatalog,
  africaInstitutionsHonesty,
} from './africa-institutions.catalog';
import { SessionContext } from '../common/guards/clerk-auth.guard';

const PILLARS = [
  {
    id: 'culture',
    name: 'Culture & oral heritage',
    nationalPride: 'Languages, dialects, and oral knowledge stay first-class — not afterthoughts of English/French defaults.',
    products: [
      { id: 'oral-knowledge', href: '/oral-knowledge', api: '/v1/oral-knowledge' },
      { id: 'dialect-continuum', href: '/dialect-continuum', api: '/v1/dialect-continuum' },
      { id: 'intent-preserving-dub', href: '/intent-preserving-dub', api: '/v1/intent-preserving-dub' },
    ],
  },
  {
    id: 'sovereignty',
    name: 'Data & model sovereignty',
    nationalPride: 'African residency (af / jnb), consented flywheels, and Own AI models so nations are not renting their voice abroad.',
    products: [
      { id: 'sovereign-flywheel', href: '/sovereign-flywheel', api: '/v1/sovereign-flywheel' },
      { id: 'ai-sovereignty-exchange', href: '/ai-sovereignty-exchange', api: '/v1/ai-sovereignty-exchange' },
      { id: 'compliance-attestations', href: '/compliance-attestations', api: '/v1/compliance-attestations' },
      { id: 'edge-offline', href: '/edge-offline', api: '/v1/edge-offline' },
    ],
  },
  {
    id: 'security',
    name: 'People & institutional security',
    nationalPride: 'Consented voice identity, sealed public speech, and secure transcript alerts that protect people under threat.',
    products: [
      { id: 'secure-transcript-alerts', href: '/secure-transcript-alerts', api: '/v1/secure-transcript-alerts' },
      { id: 'voice-passport', href: '/voice-passport', api: '/v1/voice-passport' },
      { id: 'civic-voice-seal', href: '/civic-voice-seal', api: '/v1/civic-voice-seal' },
      { id: 'voice-trust-graph', href: '/voice-trust-graph', api: '/v1/voice-trust-graph' },
    ],
  },
  {
    id: 'justice',
    name: 'Justice & language access',
    nationalPride: 'Courts and legal aid can hear every African language — defendants are not silenced by the language of the room.',
    products: [
      { id: 'justice-language-access', href: '/justice-language-access', api: '/v1/justice-language-access' },
      { id: 'interpreter-mesh', href: '/interpreter-mesh', api: '/v1/interpreter-mesh' },
      { id: 'meeting-transcription', href: '/meeting-transcription', api: '/v1/meeting-transcription' },
    ],
  },
  {
    id: 'truth',
    name: 'Truth & information integrity',
    nationalPride: 'Public figures and media can prove authenticity; citizens can challenge synthetic voice and viral falsehoods.',
    products: [
      { id: 'civic-truth-guard', href: '/civic-truth-guard', api: '/v1/civic-truth-guard' },
      { id: 'civic-voice-seal', href: '/civic-voice-seal', api: '/v1/civic-voice-seal' },
      { id: 'africa-eval-matrix', href: '/africa-eval-matrix', api: '/v1/africa-eval-matrix' },
    ],
  },
];

const PLAYBOOKS = [
  {
    id: 'protect-witness',
    title: 'Protect a person with transcript + SMS/email alert',
    pillar: 'security',
    steps: [
      'Record or upload the conversation (with consent)',
      'POST /v1/secure-transcript-alerts/protect',
      'Alert trusted contact via SMS/email with sealed receipt',
    ],
    api: 'POST /v1/secure-transcript-alerts/protect',
  },
  {
    id: 'court-defense',
    title: 'Defend a client facing a language barrier',
    pillar: 'justice',
    steps: [
      'Ingest testimony in the speaker’s language',
      'POST /v1/justice-language-access/brief',
      'Produce dual-language court brief + rights plain summary',
    ],
    api: 'POST /v1/justice-language-access/brief',
  },
  {
    id: 'stop-fake-clip',
    title: 'Challenge a viral fake voice/news clip',
    pillar: 'truth',
    steps: [
      'Submit claim or audio metadata',
      'POST /v1/civic-truth-guard/assess',
      'Publish authenticity report + seal verify path',
    ],
    api: 'POST /v1/civic-truth-guard/assess',
  },
  {
    id: 'national-archive',
    title: 'Preserve oral culture under community consent',
    pillar: 'culture',
    steps: [
      'Consented ingest via Oral Knowledge OS',
      'Dialect continuum tagging',
      'Africa residency + sovereignty attestations',
    ],
    api: 'POST /v1/oral-knowledge/ingest',
  },
];

@Injectable()
export class AfricaInstitutionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  engine() {
    return {
      ...africaInstitutionsCatalog(),
      safety: africaInstitutionsHonesty(),
      pillarCount: PILLARS.length,
      playbookCount: PLAYBOOKS.length,
      mission:
        'VerbaLab is African language infrastructure for institutions — culture kept alive, sovereignty kept local, people kept safe, justice kept fair, truth kept checkable.',
    };
  }

  pillars() {
    return { pillars: PILLARS, count: PILLARS.length };
  }

  playbooks() {
    return { playbooks: PLAYBOOKS, count: PLAYBOOKS.length };
  }

  monitoring() {
    return { status: 'ready', honesty: africaInstitutionsHonesty() };
  }

  async activity(organizationId: string) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const rows = await this.prisma.auditEvent.findMany({
      where: {
        organizationId,
        createdAt: { gte: since },
        action: { contains: 'africa-institutions' },
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
      pillars: this.pillars(),
      playbooks: this.playbooks(),
      activity: await this.activity(session.organizationId),
      links: { self: '/africa-institutions', docs: '/docs/AFRICA_INSTITUTIONS.md' },
    };
  }

  async route(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const need = String(body.need ?? body.query ?? '').toLowerCase();
    const scored = PILLARS.map((p) => {
      const hay = `${p.id} ${p.name} ${p.nationalPride}`.toLowerCase();
      const hit = need.split(/\s+/).filter((w) => w.length > 3 && hay.includes(w)).length;
      return { pillar: p, score: hit };
    }).sort((a, b) => b.score - a.score);
    const best = scored[0]?.score ? scored[0].pillar : PILLARS.find((p) => p.id === 'security')!;
    const playbook =
      PLAYBOOKS.find((pb) => pb.pillar === best.id) ??
      PLAYBOOKS.find((pb) => need.includes('fake') || need.includes('news')) ??
      PLAYBOOKS[0];
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'africa-institutions.route',
      route: 'POST /v1/africa-institutions/route',
      ip,
      metadata: { need, pillar: best.id, playbook: playbook.id, routeId: randomUUID() } as never,
    });
    return {
      need: String(body.need ?? body.query ?? ''),
      pillar: best,
      playbook,
      next: {
        console: best.products[0]?.href,
        api: playbook.api,
      },
    };
  }
}
