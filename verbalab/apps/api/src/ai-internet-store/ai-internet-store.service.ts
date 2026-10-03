import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { aiInternetHonesty } from './ai-internet-honesty';
import { aiInternetDefaultSeeds } from './ai-internet-store.seed';

const DEMO_ORG = 'org_verbalab_demo';

@Injectable()
export class AiInternetStoreService implements OnModuleInit {
  private readonly log = new Logger(AiInternetStoreService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      await this.ensureSeeded(DEMO_ORG);
    } catch (err) {
      this.log.warn(`AI Internet seed skipped: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async ensureSeeded(organizationId: string) {
    const count = await this.prisma.aiInternetRecord.count({ where: { organizationId } });
    if (count === 0) {
      for (const seed of aiInternetDefaultSeeds()) {
        await this.prisma.aiInternetRecord.create({
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
    return { count: await this.prisma.aiInternetRecord.count({ where: { organizationId } }) };
  }

  list(organizationId: string, domain?: string) {
    return this.prisma.aiInternetRecord.findMany({
      where: { organizationId, ...(domain ? { domain } : {}) },
      orderBy: [{ domain: 'asc' }, { updatedAt: 'desc' }],
    });
  }

  create(
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
    return this.prisma.aiInternetRecord.create({
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
    return { organizationId, total: rows.length, byDomain, ...aiInternetHonesty() };
  }
}
