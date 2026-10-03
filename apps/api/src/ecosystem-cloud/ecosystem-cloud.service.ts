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
          'Volume 11 README: real payments/licensing/royalties. Do not store raw card data. Plugin/Agent marketplaces must enforce Volume 8 sandboxes + Policy hard-gate before third-party code runs. Creator Economy payout math must be hand-checked before live creators.',
      },
      docs: '/docs/ECOSYSTEM_CLOUD.md',
      note:
        'Ecosystem Foundation hub (VL-249). Extends VL-090+ content marketplace and voice marketplace. Not a payment-processor OS or regenerate of Volumes 1–10.',
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
        'Static marketplace/monetization discovery catalog for Foundation. Not a new commerce mesh OS.',
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
          'Real-money volume. Stripe Connect already backs VL-092 creator payouts. Tax/dispute/1099 flows remain gaps until Creator Economy (VL-258) documents coverage. Plugin/Agent listings must stay sandboxed.',
      },
      deferred: {
        pluginMarketplace: true,
        modelMarketplace: true,
        datasetMarketplace: true,
        promptMarketplace: true,
        agentMarketplace: true,
        workflowMarketplace: true,
        connectorMarketplace: true,
        voiceLanguageMarketplace: true,
        creatorEconomyExpansion: true,
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
        billing: '/billing',
        pluginRuntime: '/plugin-runtime',
        agentRuntime: '/agent-runtime',
        agentFabric: '/agent-fabric',
        policyFabric: '/policy-fabric',
        modelRegistry: '/model-registry',
        developerCloud: '/developers',
        aiFabric: '/ai-fabric',
      },
      docs: '/docs/ECOSYSTEM_CLOUD.md',
      note:
        'Ecosystem Foundation (VL-249). Discovery hub over existing marketplaces; dedicated marketplaces VL-250–257 and Creator Economy VL-258 deferred with honest catalog.',
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
        'Ecosystem Cloud monitoring snapshot (VL-249). Foundation hub shipped; marketplace phases and production audit remain.',
    };
  }
}
