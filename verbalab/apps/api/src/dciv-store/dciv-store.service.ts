import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { dcivHonesty } from './dciv-honesty';
import { dcivDefaultSeeds } from './dciv-store.seed';

const DEMO_ORG = 'org_verbalab_demo';

@Injectable()
export class DcivStoreService implements OnModuleInit {
  private readonly log = new Logger(DcivStoreService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      await this.ensureSeeded(DEMO_ORG);
    } catch (err) {
      this.log.warn(`DCIV seed skipped: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async ensureSeeded(organizationId: string) {
    const count = await this.prisma.dcivRecord.count({ where: { organizationId } });
    if (count > 0) {
      for (const seed of dcivDefaultSeeds()) {
        const existing = await this.prisma.dcivRecord.findFirst({
          where: { organizationId, domain: seed.domain, kind: seed.kind, title: seed.title },
        });
        if (!existing) {
          await this.prisma.dcivRecord.create({
            data: {
              organizationId,
              domain: seed.domain,
              kind: seed.kind,
              title: seed.title,
              status: seed.status,
              summary: seed.summary,
              ownerLabel: seed.ownerLabel,
              content: seed.content as Prisma.InputJsonValue,
            },
          });
        }
      }
      const next = await this.prisma.dcivRecord.count({ where: { organizationId } });
      return { seeded: false, count: next };
    }
    for (const seed of dcivDefaultSeeds()) {
      await this.prisma.dcivRecord.create({
        data: {
          organizationId,
          domain: seed.domain,
          kind: seed.kind,
          title: seed.title,
          status: seed.status,
          summary: seed.summary,
          ownerLabel: seed.ownerLabel,
          content: seed.content as Prisma.InputJsonValue,
        },
      });
    }
    const next = await this.prisma.dcivRecord.count({ where: { organizationId } });
    this.log.log(`DCIV seeded ${next} records for ${organizationId}`);
    return { seeded: true, count: next };
  }

  list(organizationId: string, domain?: string) {
    return this.prisma.dcivRecord.findMany({
      where: { organizationId, ...(domain ? { domain } : {}) },
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
      content?: Record<string, unknown>;
    },
  ) {
    return this.prisma.dcivRecord.create({
      data: {
        organizationId,
        domain: input.domain,
        kind: input.kind,
        title: input.title,
        status: input.status ?? 'active',
        summary: input.summary ?? '',
        ownerLabel: input.ownerLabel,
        content: (input.content ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  async summary(organizationId: string) {
    await this.ensureSeeded(organizationId);
    const rows = await this.list(organizationId);
    const byDomain: Record<string, number> = {};
    for (const row of rows) byDomain[row.domain] = (byDomain[row.domain] ?? 0) + 1;
    return { organizationId, total: rows.length, byDomain, ...dcivHonesty() };
  }
}
