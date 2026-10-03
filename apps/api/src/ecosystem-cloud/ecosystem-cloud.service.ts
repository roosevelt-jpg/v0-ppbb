import { Injectable } from '@nestjs/common';
import { UsageService } from '../usage/usage.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import {
  ecosystemArchitectureNotes,
  ecosystemHonesty,
  ecosystemProductCatalog,
  ecosystemRoutingTable,
} from './ecosystem-cloud.catalog';

@Injectable()
export class EcosystemCloudService {
  constructor(private readonly usage: UsageService) {}

  products() {
    return {
      product: 'VerbaLab Ecosystem Cloud',
      products: ecosystemProductCatalog(),
      architecture: ecosystemArchitectureNotes(),
      honesty: ecosystemHonesty(),
      safety: {
        stripeOrEquivalentRequired: true,
        storesRawCardData: false,
        pluginAgentSandboxRequired: true,
        realMoneyRiskCategory: true,
        note:
          'Real payments, licensing, and royalties require Stripe or equivalent. Do not store raw card data. Plugin and agent marketplaces enforce sandboxes and policy hard-gates before third-party code runs. Creator Economy payout math must be reviewed before live creators.',
      },
      docs: '/docs/ECOSYSTEM_CLOUD.md',
      note:
        'Ecosystem Foundation hub over content and voice marketplaces plus plugin, model, dataset, prompt, agent, workflow, and connector markets.',
    };
  }

  routing() {
    return {
      routes: ecosystemRoutingTable(),
      products: ecosystemProductCatalog().map((p) => ({
        id: p.id,
        status: p.status,
        api: p.api,
      })),
      honesty: ecosystemHonesty(),
      note:
        'Static marketplace/monetization discovery catalog for Foundation.',
      docs: '/docs/ECOSYSTEM_CLOUD.md',
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
      products: ecosystemProductCatalog(),
      architecture: ecosystemArchitectureNotes(),
      honesty: ecosystemHonesty(),
      safety: {
        stripeOrEquivalentRequired: true,
        storesRawCardData: false,
        pluginAgentSandboxRequired: true,
        realMoneyRiskCategory: true,
        note:
          'Real-money volume. Stripe Connect backs creator payouts. Tax, dispute, and 1099 flows remain documented gaps. Plugin and agent listings stay sandboxed.',
      },
      deferred: {
        pluginMarketplace: false,
        modelMarketplace: false,
        datasetMarketplace: false,
        promptMarketplace: false,
        agentMarketplace: false,
        workflowMarketplace: false,
        connectorMarketplace: false,
        voiceLanguageMarketplace: false,
        creatorEconomyExpansion: false,
        sdkMarketplace: true,
        templateMarketplace: true,
        extensionMarketplace: true,
        taxHandlingComplete: true,
        disputeChargebackComplete: true,
        paymentProcessorOs: false,
        regeneratesVolumes1to10: false,
      },
      links: {
        ecosystemCloud: '/ecosystem-cloud',
        contentMarketplace: '/marketplace',
        voiceMarketplace: '/voice-marketplace',
        pluginMarketplace: '/plugin-marketplace',
        modelMarketplace: '/model-marketplace',
        datasetMarketplace: '/dataset-marketplace',
        promptMarketplace: '/prompt-marketplace',
        agentMarketplace: '/agent-marketplace',
        workflowMarketplace: '/workflow-marketplace',
        connectorMarketplace: '/connector-marketplace',
        voiceLanguageMarketplace: '/voice-language-marketplace',
        creatorEconomy: '/creator-economy',
        billing: '/creator-economy',
        coverage: '/coverage',
        pluginRuntime: '/plugin-runtime',
        agentRuntime: '/agent-runtime',
        agentFabric: '/agent-fabric',
        policyFabric: '/policy-fabric',
        modelRegistry: '/model-registry',
        developerCloud: '/developers',
        aiFabric: '/ai-fabric',
      },
      docs: '/docs/ECOSYSTEM_CLOUD.md',
      note: 'Ecosystem Cloud discovery hub over marketplace and monetization surfaces.',
    };
  }

  monitoring() {
    const products = ecosystemProductCatalog();
    return {
      mode: 'foundation',
      products: products.map((p) => ({ id: p.id, status: p.status })),
      architecture: ecosystemArchitectureNotes(),
      honesty: ecosystemHonesty(),
      note:
        'Ecosystem Cloud monitoring snapshot across marketplace and monetization surfaces.',
    };
  }
}
