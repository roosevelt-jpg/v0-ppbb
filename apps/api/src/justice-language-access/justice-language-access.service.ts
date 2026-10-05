import { HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { TranslateService } from '../translate/translate.service';
import { ApiException } from '../common/errors/api-exception';
import {
  justiceLanguageAccessCatalog,
  justiceLanguageAccessHonesty,
} from './justice-language-access.catalog';
import { SessionContext } from '../common/guards/clerk-auth.guard';

type CaseRecord = {
  id: string;
  organizationId: string;
  matter: string;
  speakerLanguage: string;
  courtLanguage: string;
  country: string;
  role: string;
  testimony: string;
  courtText?: string;
  rightsSummary?: { speakerLanguage: string; courtLanguage: string };
  createdAt: string;
};

const RIGHTS_TEMPLATES: Record<string, string[]> = {
  default: [
    'You have the right to understand the charges against you.',
    'You have the right to an interpreter if you do not speak the language of the court.',
    'You have the right to remain silent and to speak with a lawyer or legal aid.',
    'You should not sign documents you do not understand.',
  ],
  KE: [
    'You have the right to a fair hearing under the Constitution of Kenya.',
    'You may request interpretation into a language you understand.',
    'You may seek legal aid if you cannot afford a lawyer.',
  ],
  ZA: [
    'You have the right to a fair trial and to be informed in a language you understand.',
    'You may request an interpreter in court proceedings.',
    'Legal aid may be available through Legal Aid South Africa.',
  ],
  NG: [
    'You have the right to be informed of charges in a language you understand.',
    'You may request an interpreter during proceedings.',
    'You may seek legal assistance from legal aid clinics or counsel.',
  ],
};

@Injectable()
export class JusticeLanguageAccessService {
  private readonly caseStore = new Map<string, CaseRecord>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly translate: TranslateService,
  ) {}

  engine() {
    return {
      ...justiceLanguageAccessCatalog(),
      safety: justiceLanguageAccessHonesty(),
      cases: this.caseStore.size,
      disclaimer:
        'Assistive language access for justice — not legal advice and not a replacement for counsel or sworn interpreters where required.',
    };
  }

  cases(organizationId: string) {
    const rows = [...this.caseStore.values()].filter((c) => c.organizationId === organizationId);
    return {
      cases: rows.map((c) => ({
        id: c.id,
        matter: c.matter,
        speakerLanguage: c.speakerLanguage,
        courtLanguage: c.courtLanguage,
        country: c.country,
        role: c.role,
        hasBrief: Boolean(c.courtText),
        createdAt: c.createdAt,
      })),
      count: rows.length,
    };
  }

  monitoring() {
    return { status: 'ready', honesty: justiceLanguageAccessHonesty() };
  }

  async activity(organizationId: string) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const rows = await this.prisma.auditEvent.findMany({
      where: {
        organizationId,
        createdAt: { gte: since },
        action: { contains: 'justice-language' },
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
      cases: this.cases(session.organizationId),
      activity: await this.activity(session.organizationId),
      links: {
        self: '/justice-language-access',
        docs: '/docs/JUSTICE_LANGUAGE_ACCESS.md',
        interpreterMesh: '/interpreter-mesh',
        institutions: '/africa-institutions',
      },
    };
  }

  async ingest(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const testimony = String(body.testimony ?? body.text ?? '').trim();
    if (!testimony) {
      throw new ApiException('validation_error', 'testimony is required', HttpStatus.BAD_REQUEST);
    }
    const record: CaseRecord = {
      id: randomUUID(),
      organizationId: session.organizationId,
      matter: String(body.matter ?? 'criminal_defense'),
      speakerLanguage: String(body.speakerLanguage ?? body.source ?? 'sw'),
      courtLanguage: String(body.courtLanguage ?? body.target ?? 'en'),
      country: String(body.country ?? 'KE').toUpperCase(),
      role: String(body.role ?? 'defendant'),
      testimony,
      createdAt: new Date().toISOString(),
    };
    this.caseStore.set(record.id, record);
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'justice-language-access.ingest',
      route: 'POST /v1/justice-language-access/ingest',
      ip,
      metadata: {
        caseId: record.id,
        speakerLanguage: record.speakerLanguage,
        courtLanguage: record.courtLanguage,
      } as never,
    });
    return { case: record, note: 'Testimony stored under Africa residency defaults. Build a brief next.' };
  }

  async brief(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    let record: CaseRecord | undefined;
    const caseId = String(body.caseId ?? '').trim();
    if (caseId) {
      record = this.caseStore.get(caseId);
      if (!record || record.organizationId !== session.organizationId) {
        throw new ApiException('not_found', 'case not found', HttpStatus.NOT_FOUND);
      }
    } else {
      const ingested = await this.ingest(session, body, ip);
      record = ingested.case;
    }

    const translated = await this.translate.translate({
      text: record.testimony,
      source: record.speakerLanguage,
      target: record.courtLanguage,
      organizationId: session.organizationId,
      workspaceId: session.workspaceId,
      userId: session.userId,
      ip,
    } as never);

    record.courtText =
      typeof translated === 'object' && translated && 'text' in translated
        ? String((translated as { text: string }).text)
        : String(translated);
    this.caseStore.set(record.id, record);

    const brief = {
      caseId: record.id,
      matter: record.matter,
      role: record.role,
      country: record.country,
      speakerLanguage: record.speakerLanguage,
      courtLanguage: record.courtLanguage,
      dualLanguage: {
        speaker: record.testimony,
        court: record.courtText,
      },
      defenseNotes: [
        'Ensure sworn interpreter present if court rules require it.',
        'Confirm client understands each charge in their language.',
        'Do not treat machine translation as certified evidence without human review.',
      ],
      generatedAt: new Date().toISOString(),
    };

    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'justice-language-access.brief',
      route: 'POST /v1/justice-language-access/brief',
      ip,
      metadata: { caseId: record.id } as never,
    });

    return { brief };
  }

  async rights(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const country = String(body.country ?? 'KE').toUpperCase();
    const speakerLanguage = String(body.speakerLanguage ?? 'sw');
    const courtLanguage = String(body.courtLanguage ?? 'en');
    const bullets = RIGHTS_TEMPLATES[country] ?? RIGHTS_TEMPLATES.default;
    const courtText = bullets.map((b, i) => `${i + 1}. ${b}`).join('\n');

    let speakerText = courtText;
    if (speakerLanguage !== courtLanguage) {
      try {
        const translated = await this.translate.translate({
          text: courtText,
          source: courtLanguage,
          target: speakerLanguage,
          organizationId: session.organizationId,
          workspaceId: session.workspaceId,
          userId: session.userId,
          ip,
        } as never);
        speakerText =
          typeof translated === 'object' && translated && 'text' in translated
            ? String((translated as { text: string }).text)
            : courtText;
      } catch {
        speakerText = courtText;
      }
    }

    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'justice-language-access.rights',
      route: 'POST /v1/justice-language-access/rights',
      ip,
      metadata: { country, speakerLanguage, courtLanguage } as never,
    });

    return {
      rights: {
        country,
        speakerLanguage,
        courtLanguage,
        plain: {
          speakerLanguage: speakerText,
          courtLanguage: courtText,
        },
        note: 'Plain-language orientation for the person — review with counsel before relying in proceedings.',
      },
    };
  }
}
