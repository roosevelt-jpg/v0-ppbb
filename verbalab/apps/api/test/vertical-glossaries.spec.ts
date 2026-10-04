import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { VerticalGlossariesService } from '../src/vertical-glossaries/vertical-glossaries.service';
import { VERTICAL_GLOSSARY_PACKS } from '../src/vertical-glossaries/vertical-glossary-seeds';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';

async function seedOrg(prisma: PrismaService, name: string) {
  return prisma.organization.create({
    data: {
      name,
      memberships: {
        create: {
          role: MembershipRole.owner,
          user: {
            create: {
              clerkUserId: `clerk_vg_${name}_${Date.now()}_${Math.random()}`,
              email: `${name}@example.com`,
            },
          },
        },
      },
      workspaces: {
        create: { name: 'Default', defaultSourceLang: 'en', defaultTargetLang: 'sw' },
      },
    },
    include: { workspaces: true, memberships: true },
  });
}

describe('Vertical glossaries (VL-103)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let verticals: VerticalGlossariesService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    verticals = app.get(VerticalGlossariesService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('ships Africa-first vertical packs across EN→SW/YO/HA/AM/ZU/AR', () => {
    const ids = VERTICAL_GLOSSARY_PACKS.map((p) => p.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'public-sector-en-sw',
        'healthcare-en-sw',
        'banking-en-sw',
        'education-en-sw',
        'agriculture-en-sw',
        'legal-en-sw',
        'public-sector-en-yo',
        'healthcare-en-ha',
        'banking-en-am',
        'public-sector-en-zu',
        'healthcare-en-ar',
      ]),
    );
    expect(VERTICAL_GLOSSARY_PACKS.length).toBeGreaterThanOrEqual(11);
    for (const pack of VERTICAL_GLOSSARY_PACKS) {
      expect(pack.terms.length).toBeGreaterThanOrEqual(20);
    }
  });

  it('lists packs with preview and installs on Free', async () => {
    const org = await seedOrg(prisma, `vgfree_${Date.now()}`);
    const catalog = await verticals.list(org.id, org.workspaces[0].id);
    expect(catalog.length).toBeGreaterThanOrEqual(11);
    expect(catalog[0].preview.length).toBeGreaterThan(0);
    expect(catalog[0].terms).toBeUndefined();

    const installed = await verticals.install({
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      packId: 'healthcare-en-sw',
      userId: org.memberships[0].userId,
      role: 'owner',
    });
    expect(installed.termsInstalled).toBeGreaterThanOrEqual(20);
  });

  it('installs a pack into the workspace glossary', async () => {
    const org = await seedOrg(prisma, `vgpro_${Date.now()}`);
    const workspaceId = org.workspaces[0].id;

    const result = await verticals.install({
      organizationId: org.id,
      workspaceId,
      packId: 'banking-en-sw',
      userId: org.memberships[0].userId,
      role: 'owner',
    });
    expect(result.termsInstalled).toBe(
      VERTICAL_GLOSSARY_PACKS.find((p) => p.id === 'banking-en-sw')!.terms.length,
    );

    const terms = await prisma.glossaryTerm.findMany({
      where: { organizationId: org.id, workspaceId },
    });
    expect(terms.some((t) => t.sourceTerm === 'mobile money')).toBe(true);

    const again = await verticals.install({
      organizationId: org.id,
      workspaceId,
      packId: 'banking-en-sw',
      userId: org.memberships[0].userId,
      role: 'owner',
    });
    expect(again.reinstalled).toBe(true);

    const installs = await verticals.listInstalls(org.id, workspaceId);
    expect(installs.some((i) => i.packId === 'banking-en-sw')).toBe(true);
  });
});
