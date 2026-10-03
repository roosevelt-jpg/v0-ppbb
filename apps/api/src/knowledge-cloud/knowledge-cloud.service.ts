import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsageService } from '../usage/usage.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import {
  knowledgeArchitectureNotes,
  knowledgeProductCatalog,
} from './knowledge-products.catalog';

@Injectable()
export class KnowledgeCloudService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usage: UsageService,
  ) {}

  products() {
    return {
      products: knowledgeProductCatalog(),
      architecture: knowledgeArchitectureNotes(),
      docs: '/docs/KNOWLEDGE_CLOUD.md',
    };
  }

  async overview(session: SessionContext) {
    const [usageSummary, knowledgeDocs, knowledgeChunks] = await Promise.all([
      this.usage.summary(session.organizationId),
      this.prisma.knowledgeDocument.count({
        where: { organizationId: session.organizationId },
      }),
      this.prisma.knowledgeChunk.count({
        where: { organizationId: session.organizationId },
      }),
    ]);

    return {
      session: {
        organizationId: session.organizationId,
        workspaceId: session.workspaceId,
        role: session.role,
      },
      usage: {
        periodStart: usageSummary.periodStart,
        chat: usageSummary.chat,
        embeddings: usageSummary.embeddings,
      },
      workspace: {
        knowledgeDocuments: knowledgeDocs,
        knowledgeChunks,
      },
      products: knowledgeProductCatalog(),
      architecture: knowledgeArchitectureNotes(),
      deferred: {
        enterpriseKnowledgeBase: true,
        enterpriseSearch: true,
        ontologyPlatform: true,
        taxonomyPlatform: true,
        enterpriseRagProduct: true,
        knowledgeMemory: true,
        knowledgeIntelligence: true,
        enterpriseKnowledgeApisPack: true,
        knowledgeAnalytics: true,
        enterpriseKnowledgeOs: true,
        ontologyOs: true,
        neo4jKnowledgeOs: true,
        regeneratesVl062: false,
      },
      links: {
        knowledgeCloud: '/knowledge-cloud',
        knowledge: '/knowledge',
        knowledgeGraph: '/knowledge-graph',
        vectorCloud: '/vector-cloud',
        embeddingCloud: '/embedding-cloud',
        memoryCloud: '/memory-cloud',
        contextEngine: '/context-engine',
        intelligenceCloud: '/intelligence-cloud',
        chat: '/chat',
        language: '/language',
        speech: '/speech',
        voiceCloud: '/voice-cloud',
        usage: '/usage',
        billing: '/billing',
        analytics: '/analytics',
        graphql: '/graphql',
        playground: '/playground',
      },
      docs: '/docs/KNOWLEDGE_CLOUD.md',
      note: 'Hub over VL-062 RAG + Intelligence knowledge surfaces. Not an enterprise knowledge OS / ontology platform.',
    };
  }
}
