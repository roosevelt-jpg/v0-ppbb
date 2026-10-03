import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { IntelligenceCloudService } from '../src/intelligence-cloud/intelligence-cloud.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';

const root = join(__dirname, '../../..');

async function seedOrg(prisma: PrismaService, name: string) {
  return prisma.organization.create({
    data: {
      name,
      memberships: {
        create: {
          role: MembershipRole.owner,
          user: {
            create: {
              clerkUserId: `clerk_intel_${name}_${Date.now()}_${Math.random()}`,
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

describe('Intelligence Cloud Foundation (VL-180)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let intelligenceCloud: IntelligenceCloudService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    intelligenceCloud = app.get(IntelligenceCloudService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('documents Intelligence Cloud mapping (no custom AI kernel)', () => {
    const doc = join(root, 'docs/INTELLIGENCE_CLOUD.md');
    const adr = join(root, 'docs/adr/0091-intelligence-cloud-foundation.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toContain('Embedding');
    expect(text).toContain('CQRS');
    expect(text).toContain('Terraform');
    expect(text).toContain('af-south-1');
    expect(text).toMatch(/is \*\*not\*\* a custom AI kernel/i);
    expect(text).toContain('VL-060');
    expect(text).toContain('VL-062');
    expect(text).toContain('VL-063');
  });

  it('exposes public product catalog with honest statuses', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/intelligence-cloud/products')
      .expect(200);
    expect(res.body.architecture.graphql).toBe(true);
    expect(res.body.architecture.cqrs).toBe(true);
    expect(res.body.architecture.customAiKernel).toBe(false);
    expect(res.body.architecture.llmGateway).toBe(true);
    expect(res.body.architecture.pgvector).toBe(true);
    expect(res.body.architecture.terraform).toBe(true);
    expect(res.body.architecture.kubernetes).toBe(true);
    expect(res.body.architecture.primaryRegion).toBe('af-south-1');
    expect(res.body.docs).toBe('/docs/INTELLIGENCE_CLOUD.md');

    const ids = res.body.products.map((p: { id: string }) => p.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'intelligence',
        'embeddings',
        'vector',
        'memory',
        'reasoning',
        'orchestration',
      ]),
    );

    const hub = res.body.products.find((p: { id: string }) => p.id === 'intelligence');
    expect(hub.status).toBe('shipped');

    const embeddings = res.body.products.find((p: { id: string }) => p.id === 'embeddings');
    expect(embeddings.status).toBe('partial');
    expect(embeddings.api).toContain('/v1/embeddings');

    const memory = res.body.products.find((p: { id: string }) => p.id === 'memory');
    expect(memory.status).toBe('deferred');

    const kg = res.body.products.find((p: { id: string }) => p.id === 'knowledge-graph');
    expect(kg.status).toBe('deferred');
  });

  it('returns org intelligence overview with chat/embeddings usage + deferred flags', async () => {
    const org = await seedOrg(prisma, `intel_${Date.now()}`);

    const overview = await intelligenceCloud.overview({
      userId: org.memberships[0].userId,
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      clerkUserId: 'clerk_intel',
      role: 'owner',
    });

    expect(overview.usage.chat).toBeDefined();
    expect(overview.usage.embeddings).toBeDefined();
    expect(overview.workspace.knowledgeDocuments).toBeGreaterThanOrEqual(0);
    expect(overview.deferred.customAiKernel).toBe(true);
    expect(overview.deferred.memoryCloud).toBe(true);
    expect(overview.deferred.knowledgeGraphOs).toBe(true);
    expect(overview.deferred.customReasoner).toBe(true);
    expect(overview.links.intelligenceCloud).toBe('/intelligence-cloud');
    expect(overview.links.knowledge).toBe('/knowledge');
    expect(overview.links.chat).toBe('/chat');
    expect(overview.architecture.hexagonalRewrite).toBe(false);
    expect(overview.architecture.customAiKernel).toBe(false);
  });

  it('exposes intelligenceProducts via GraphQL CQRS façade', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: '{ intelligenceProducts { id name status } }',
      })
      .expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.intelligenceProducts.length).toBeGreaterThan(5);
    expect(
      res.body.data.intelligenceProducts.some((p: { id: string }) => p.id === 'intelligence'),
    ).toBe(true);
  });
});
