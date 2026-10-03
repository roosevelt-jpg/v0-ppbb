import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { KnowledgeCloudService } from '../src/knowledge-cloud/knowledge-cloud.service';
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
              clerkUserId: `clerk_know_${name}_${Date.now()}_${Math.random()}`,
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

describe('Knowledge Cloud Foundation (VL-193)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let knowledgeCloud: KnowledgeCloudService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    knowledgeCloud = app.get(KnowledgeCloudService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('documents Knowledge Cloud mapping (no enterprise knowledge OS)', () => {
    const doc = join(root, 'docs/KNOWLEDGE_CLOUD.md');
    const adr = join(root, 'docs/adr/0104-knowledge-cloud-foundation.md');
    const readme = join(root, 'docs/roadmap/volume6-knowledge-cloud/README_VOLUME6.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    expect(existsSync(readme)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toContain('Enterprise Knowledge Base');
    expect(text).toContain('CQRS');
    expect(text).toContain('Terraform');
    expect(text).toContain('af-south-1');
    expect(text).toMatch(/is \*\*not\*\* an enterprise knowledge OS/i);
    expect(text).toContain('VL-062');
    expect(text).toContain('VL-063');
  });

  it('exposes public product catalog with honest statuses', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/knowledge-cloud/products')
      .expect(200);
    expect(res.body.architecture.graphql).toBe(true);
    expect(res.body.architecture.cqrs).toBe(true);
    expect(res.body.architecture.enterpriseKnowledgeOs).toBe(false);
    expect(res.body.architecture.ontologyOs).toBe(false);
    expect(res.body.architecture.regeneratesVl062).toBe(false);
    expect(res.body.architecture.extendsVl062).toBe(true);
    expect(res.body.architecture.extendsIntelligenceCloud).toBe(true);
    expect(res.body.architecture.tenantScopedKnowledge).toBe(true);
    expect(res.body.architecture.pgvector).toBe(true);
    expect(res.body.architecture.neo4jParity).toBe(false);
    expect(res.body.architecture.terraform).toBe(true);
    expect(res.body.architecture.kubernetes).toBe(true);
    expect(res.body.architecture.primaryRegion).toBe('af-south-1');
    expect(res.body.docs).toBe('/docs/KNOWLEDGE_CLOUD.md');

    const ids = res.body.products.map((p: { id: string }) => p.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'knowledge-cloud',
        'enterprise-knowledge-base',
        'enterprise-search',
        'ontology-platform',
        'taxonomy-platform',
        'enterprise-rag',
        'knowledge-memory',
        'knowledge-intelligence',
        'enterprise-knowledge-apis',
        'knowledge-analytics',
      ]),
    );

    const hub = res.body.products.find((p: { id: string }) => p.id === 'knowledge-cloud');
    expect(hub.status).toBe('shipped');

    const ekb = res.body.products.find(
      (p: { id: string }) => p.id === 'enterprise-knowledge-base',
    );
    expect(ekb.status).toBe('deferred');

    const rag = res.body.products.find((p: { id: string }) => p.id === 'enterprise-rag');
    expect(rag.status).toBe('partial');
    expect(rag.api).toContain('/v1/knowledge/query');
    expect(rag.console).toBe('/knowledge');

    const apis = res.body.products.find(
      (p: { id: string }) => p.id === 'enterprise-knowledge-apis',
    );
    expect(apis.status).toBe('partial');
    expect(apis.api).toContain('/v1/knowledge/');
  });

  it('returns org knowledge overview with doc/chunk counts + deferred flags', async () => {
    const org = await seedOrg(prisma, `know_${Date.now()}`);

    const overview = await knowledgeCloud.overview({
      userId: org.memberships[0].userId,
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      clerkUserId: 'clerk_know',
      role: 'owner',
    });

    expect(overview.usage.chat).toBeDefined();
    expect(overview.usage.embeddings).toBeDefined();
    expect(overview.workspace.knowledgeDocuments).toBeGreaterThanOrEqual(0);
    expect(overview.workspace.knowledgeChunks).toBeGreaterThanOrEqual(0);
    expect(overview.deferred.enterpriseKnowledgeBase).toBe(true);
    expect(overview.deferred.enterpriseSearch).toBe(true);
    expect(overview.deferred.ontologyPlatform).toBe(true);
    expect(overview.deferred.taxonomyPlatform).toBe(true);
    expect(overview.deferred.enterpriseRagProduct).toBe(true);
    expect(overview.deferred.knowledgeMemory).toBe(true);
    expect(overview.deferred.knowledgeIntelligence).toBe(true);
    expect(overview.deferred.enterpriseKnowledgeOs).toBe(true);
    expect(overview.deferred.ontologyOs).toBe(true);
    expect(overview.deferred.neo4jKnowledgeOs).toBe(true);
    expect(overview.deferred.regeneratesVl062).toBe(false);
    expect(overview.links.knowledgeCloud).toBe('/knowledge-cloud');
    expect(overview.links.knowledge).toBe('/knowledge');
    expect(overview.links.knowledgeGraph).toBe('/knowledge-graph');
    expect(overview.links.intelligenceCloud).toBe('/intelligence-cloud');
    expect(overview.architecture.hexagonalRewrite).toBe(false);
    expect(overview.architecture.enterpriseKnowledgeOs).toBe(false);
    expect(overview.architecture.extendsVl062).toBe(true);
  });

  it('exposes knowledgeProducts via GraphQL CQRS façade', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: '{ knowledgeProducts { id name status } }',
      })
      .expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.knowledgeProducts.length).toBeGreaterThan(5);
    expect(
      res.body.data.knowledgeProducts.some((p: { id: string }) => p.id === 'knowledge-cloud'),
    ).toBe(true);
  });
});
