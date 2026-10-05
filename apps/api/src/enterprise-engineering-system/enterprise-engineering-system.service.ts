import { Injectable } from '@nestjs/common';
import { UsageService } from '../usage/usage.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import {
  enterpriseEngineeringSystemArchitectureNotes,
  enterpriseEngineeringSystemExtends,
  enterpriseEngineeringSystemHonesty,
  enterpriseEngineeringSystemHubInventory,
  enterpriseEngineeringSystemProductCatalog,
  enterpriseEngineeringSystemRoutingTable,
} from './enterprise-engineering-system.catalog';

@Injectable()
export class EnterpriseEngineeringSystemService {
  constructor(private readonly usage: UsageService) {}

  products() {
    return {
      product: 'VerbaLab Enterprise Engineering System',
      products: enterpriseEngineeringSystemProductCatalog(),
      hubInventory: enterpriseEngineeringSystemHubInventory(),
      extendsSurfaces: enterpriseEngineeringSystemExtends(),
      architecture: enterpriseEngineeringSystemArchitectureNotes(),
      honesty: enterpriseEngineeringSystemHonesty(),
      safety: {
        engineeringOsForHumansAndCursor: true,
        customerFacingProductCloud: false,
        architectureKnowledgeBaseOs: false,
        adrFactoryOs: false,
        jiraOs: false,
        confluenceOs: false,
        sonarqubeOs: false,
        note: 'Standards, templates, and governance for engineering workflows — not a new product cloud.',
      },
      docs: '/docs/ENTERPRISE_ENGINEERING_SYSTEM.md',
      note: 'Enterprise Engineering System Foundation. Engineering standards for humans and Cursor.',
    };
  }

  routing() {
    return {
      routes: enterpriseEngineeringSystemRoutingTable(),
      products: enterpriseEngineeringSystemProductCatalog().map((p) => ({
        id: p.id,
        status: p.status,
        api: p.api,
      })),
      hubInventory: enterpriseEngineeringSystemHubInventory(),
      extendsSurfaces: enterpriseEngineeringSystemExtends(),
      honesty: enterpriseEngineeringSystemHonesty(),
      note: 'Static EES discovery catalog for Foundation.',
      docs: '/docs/ENTERPRISE_ENGINEERING_SYSTEM.md',
    };
  }

  async overview(session: SessionContext) {
    const usageSummary = await this.usage.summary(session.organizationId);
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
      products: enterpriseEngineeringSystemProductCatalog(),
      hubInventory: enterpriseEngineeringSystemHubInventory(),
      extendsSurfaces: enterpriseEngineeringSystemExtends(),
      architecture: enterpriseEngineeringSystemArchitectureNotes(),
      honesty: enterpriseEngineeringSystemHonesty(),
      safety: {
        engineeringOsForHumansAndCursor: true,
        customerFacingProductCloud: false,
        architectureKnowledgeBaseOs: false,
        adrFactoryOs: false,
        note: 'Extends Platform Engineering, DevEx, Trust, and ADR workflows with engineering standards.',
      },
      deferred: {
        architectureKnowledgeBaseOs: true,
        adrFactoryOs: true,
        massPrdLibrary: true,
      },
      links: {
        enterpriseEngineeringSystem: '/enterprise-engineering-system',
        engineeringGovernance: '/engineering-governance',
        architectureGovernance: '/architecture-governance',
        repositoryStandards: '/repository-standards',
        engineeringQualityPlatform: '/engineering-quality-platform',
        aiEngineeringStandards: '/ai-engineering-standards',
        apiEngineeringStandards: '/api-engineering-standards',
        databaseEngineeringStandards: '/database-engineering-standards',
        infrastructureEngineeringStandards: '/infrastructure-engineering-standards',
        platformEngineeringCloud: '/platform-engineering-cloud',
        developerExperiencePlatform: '/developer-experience-platform',
        aiGovernancePlatform: '/ai-governance-platform',
      },
      docs: '/docs/ENTERPRISE_ENGINEERING_SYSTEM.md',
      note: 'Enterprise Engineering System. Discovery hub for standards/governance catalogs; Production Audit closes the volume.',
    };
  }

  monitoring() {
    const products = enterpriseEngineeringSystemProductCatalog();
    return {
      mode: 'foundation',
      products: products.map((p) => ({ id: p.id, status: p.status })),
      hubInventory: enterpriseEngineeringSystemHubInventory(),
      extendsSurfaces: enterpriseEngineeringSystemExtends(),
      architecture: enterpriseEngineeringSystemArchitectureNotes(),
      honesty: enterpriseEngineeringSystemHonesty(),
      note: 'EES monitoring snapshot.',
    };
  }
}
