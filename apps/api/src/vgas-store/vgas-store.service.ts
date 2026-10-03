import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { vgasDefaultSeeds } from './vgas-store.seed';

const DEMO_ORG = 'org_verbalab_demo';

@Injectable()
export class VgasStoreService implements OnModuleInit {
  private readonly log = new Logger(VgasStoreService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      await this.ensureSeeded(DEMO_ORG);
    } catch (err) {
      this.log.warn(`VGAS seed skipped: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async ensureSeeded(organizationId: string) {
    const count = await this.prisma.vgasRecord.count({ where: { organizationId } });
    if (count > 0) {
      // Backfill demo verify codes if an earlier seed omitted them.
      for (const seed of vgasDefaultSeeds()) {
        if (!seed.verifyCode) continue;
        const existing = await this.prisma.vgasRecord.findFirst({
          where: {
            organizationId,
            domain: seed.domain,
            kind: seed.kind,
            title: seed.title,
            verifyCode: null,
          },
        });
        if (existing) {
          await this.prisma.vgasRecord.update({
            where: { id: existing.id },
            data: { verifyCode: seed.verifyCode },
          });
        }
      }
      return { seeded: false, count };
    }
    for (const seed of vgasDefaultSeeds()) {
      await this.prisma.vgasRecord.create({
        data: {
          organizationId,
          domain: seed.domain,
          kind: seed.kind,
          title: seed.title,
          status: seed.status,
          summary: seed.summary,
          ownerLabel: seed.ownerLabel,
          verifyCode: seed.verifyCode,
          content: seed.content as Prisma.InputJsonValue,
        },
      });
    }
    const next = await this.prisma.vgasRecord.count({ where: { organizationId } });
    this.log.log(`VGAS seeded ${next} records for ${organizationId}`);
    return { seeded: true, count: next };
  }

  list(organizationId: string, domain?: string) {
    return this.prisma.vgasRecord.findMany({
      where: {
        organizationId,
        ...(domain ? { domain } : {}),
      },
      orderBy: [{ domain: 'asc' }, { updatedAt: 'desc' }],
    });
  }

  async create(
    organizationId: string,
    input: {
      domain: string;
      kind: string;
      title: string;
      status?: string;
      summary?: string;
      ownerLabel?: string;
      verifyCode?: string;
      content?: Record<string, unknown>;
    },
  ) {
    return this.prisma.vgasRecord.create({
      data: {
        organizationId,
        domain: input.domain,
        kind: input.kind,
        title: input.title,
        status: input.status ?? 'active',
        summary: input.summary ?? '',
        ownerLabel: input.ownerLabel,
        verifyCode: input.verifyCode,
        content: (input.content ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  async verify(code: string) {
    await this.ensureSeeded(DEMO_ORG);
    const row = await this.prisma.vgasRecord.findFirst({
      where: { verifyCode: code, domain: 'certification', kind: 'certificate' },
    });
    if (!row) {
      return { valid: false, thirdPartyAccreditation: false, note: 'No VerbaLab-issued certificate found for this code.' };
    }
    return {
      valid: true,
      thirdPartyAccreditation: false,
      certificate: { id: row.id, title: row.title, status: row.status, summary: row.summary, issuedBy: 'VerbaLab', verifyCode: row.verifyCode, content: row.content },
      note: 'VerbaLab-issued credential only - not third-party accredited.',
    };
  }

  async summary(organizationId: string) {
    await this.ensureSeeded(organizationId);
    const rows = await this.list(organizationId);
    const byDomain: Record<string, number> = {};
    for (const row of rows) {
      byDomain[row.domain] = (byDomain[row.domain] ?? 0) + 1;
    }
    return {
      organizationId,
      total: rows.length,
      byDomain,
      certificates: rows.filter((r) => r.domain === 'certification' && r.kind === 'certificate').length,
      partners: rows.filter((r) => r.domain === 'partner').length,
      thirdPartyAccreditation: false,
      internationalStandardAdoption: false,
    };
  }
}
