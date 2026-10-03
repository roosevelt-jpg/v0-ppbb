export type EcosystemProductStatus = 'shipped' | 'partial' | 'deferred';

export type EcosystemProductRow = {
  id: string;
  name: string;
  status: EcosystemProductStatus;
  api: string | null;
  console: string | null;
  notes: string;
};

/**
 * Library Phase 116 → Ecosystem Foundation (VL-249).
 * Marketplace + monetization hub over existing VL-090+ / voice marketplace —
 * not a payment-processor OS or regenerate of Volumes 1–10.
 * Volume 11 README: real-money risk; Stripe (or equivalent) only; no raw cards.
 */
export function ecosystemProductCatalog(): EcosystemProductRow[] {
  return [
    {
      id: 'ecosystem-cloud',
      name: 'Ecosystem Cloud',
      status: 'shipped',
      api: 'GET /v1/ecosystem-cloud/products',
      console: '/ecosystem-cloud',
      notes:
        'Ecosystem hub for marketplace discovery and monetization over content and voice markets.',
    },
    {
      id: 'content-marketplace',
      name: 'Content Marketplace',
      status: 'shipped',
      api: 'GET /v1/marketplace/listings',
      console: '/marketplace',
      notes:
        'Glossary, prompt, and dataset listings with Stripe Connect. Dedicated kind marketplaces extend from here.',
    },
    {
      id: 'voice-marketplace',
      name: 'Voice Marketplace',
      status: 'shipped',
      api: 'GET /v1/voice-marketplace/engine',
      console: '/voice-marketplace',
      notes:
        'Voice, pack, and language-pack marketplace. Voice & Language Marketplace extends these listings.',
    },
    {
      id: 'plugin-marketplace',
      name: 'Plugin Marketplace',
      status: 'shipped',
      api: 'GET /v1/plugin-marketplace/engine',
      console: '/plugin-marketplace',
      notes:
        'Publish, install, and run sandboxed plugins through Plugin Runtime with policy hard-gates.',
    },
    {
      id: 'model-marketplace',
      name: 'Model Marketplace',
      status: 'shipped',
      api: 'GET /v1/model-marketplace/engine',
      console: '/model-marketplace',
      notes:
        'License SKUs over Model Registry with policy gates and Stripe Connect sales.',
    },
    {
      id: 'dataset-marketplace',
      name: 'Dataset Marketplace',
      status: 'shipped',
      api: 'GET /v1/dataset-marketplace/engine',
      console: '/dataset-marketplace',
      notes:
        'Dataset listing entitlements over dataset assets with policy gates and Stripe Connect.',
    },
    {
      id: 'prompt-marketplace',
      name: 'Prompt Marketplace',
      status: 'shipped',
      api: 'GET /v1/prompt-marketplace/engine',
      console: '/prompt-marketplace',
      notes:
        'Prompt listing entitlements over Prompt Fabric with policy gates and Stripe Connect.',
    },
    {
      id: 'agent-marketplace',
      name: 'Agent Marketplace',
      status: 'shipped',
      api: 'GET /v1/agent-marketplace/engine',
      console: '/agent-marketplace',
      notes:
        'Agent listings with Agent Runtime sandbox and policy hard-gates, plus Stripe Connect sales.',
    },
    {
      id: 'workflow-marketplace',
      name: 'Workflow Marketplace',
      status: 'shipped',
      api: 'GET /v1/workflow-marketplace/engine',
      console: '/workflow-marketplace',
      notes:
        'Workflow listings with Workflow Runtime sandbox and policy hard-gates, plus Stripe Connect sales.',
    },
    {
      id: 'connector-marketplace',
      name: 'Connector Marketplace',
      status: 'shipped',
      api: 'GET /v1/connector-marketplace/engine',
      console: '/connector-marketplace',
      notes:
        'Connector entitlement SKUs over the connector catalog with policy gates and Stripe Connect.',
    },
    {
      id: 'voice-language-marketplace',
      name: 'Voice & Language Marketplace',
      status: 'shipped',
      api: 'GET /v1/voice-language-marketplace/engine',
      console: '/voice-language-marketplace',
      notes:
        'Entitlement SKUs over voice marketplace packs, dialects, accents, and locale packs.',
    },
    {
      id: 'creator-economy',
      name: 'Creator Economy',
      status: 'shipped',
      api: 'GET /v1/creator-economy/engine',
      console: '/creator-economy',
      notes:
        'Stripe Connect and MarketplaceSale royalty math with explicit tax and dispute gaps.',
    },
    {
      id: 'sdk-marketplace',
      name: 'SDK Marketplace',
      status: 'deferred',
      api: null,
      console: null,
      notes: 'Catalog placeholder.',
    },
    {
      id: 'template-marketplace',
      name: 'Template Marketplace',
      status: 'deferred',
      api: null,
      console: null,
      notes: 'Catalog placeholder. Templates stay deferred until a dedicated marketplace surface ships.',
    },
    {
      id: 'extension-marketplace',
      name: 'Extension Marketplace',
      status: 'deferred',
      api: null,
      console: null,
      notes: 'Catalog placeholder. Extensions map to Plugin Marketplace later.',
    },
    {
      id: 'billing-analytics',
      name: 'Ecosystem Billing & Analytics',
      status: 'shipped',
      api: 'GET /v1/marketplace/sales',
      console: '/creator-economy',
      notes:
        'Discovery link to billing, usage, and marketplace sales analytics.',
    },
  ];
}

export function ecosystemArchitectureNotes() {
  return {
    style: 'nest_modular_monolith',
    ddd: 'bounded_ecosystem_cloud_hub',
    cqrs: true,
    hexagonalRewrite: false,
    repositoryPattern: 'prisma_and_existing_marketplace',
    eventDriven: 'audit_jobs_and_event_fabric',
    solid: true,
    terraform: true,
    terraformPath: 'infra/DEPLOY.md',
    kubernetes: true,
    kubernetesPath: 'infra/AWS_EKS.md',
    primaryRegion: 'af-south-1',
    extendsContentMarketplace: true,
    extendsVoiceMarketplace: true,
    regeneratesVolumes1to10: false,
    regeneratesMarketplaceVl090: false,
    paymentProcessorOs: false,
    storesRawCardData: false,
    stripeOrEquivalentRequired: true,
    pluginAgentSandboxRequired: true,
    taxDisputeOs: false,
    realMoneyRiskCategory: true,
    note:
      'Real payments, licensing, and royalties require Stripe or equivalent. Creator Economy payout math must be reviewed before live creators. Plugin and agent marketplaces enforce sandboxes before third-party code runs.',
  };
}

export function ecosystemHonesty() {
  return {
    paymentProcessorOs: false,
    storesRawCardData: false,
    stripeOrEquivalentRequired: true,
    rollsOwnCardVault: false,
    regeneratesVolumes1to10: false,
    regeneratesMarketplaceVl090: false,
    regeneratesVoiceMarketplace: false,
    pluginAgentSandboxRequired: true,
    taxHandlingComplete: false,
    disputeChargebackComplete: false,
    creatorPayoutMathVerifiedLive: false,
    realMoneyRiskCategory: true,
    pciSelfAssessmentRequiredBeforeLiveCards: true,
    note:
      'Marketplace monetization hub with Stripe Connect, sandboxed plugin/agent installs, and reviewed royalty math before live creator payouts.',
  };
}

export function ecosystemRoutingTable() {
  return [
    { surface: 'content-marketplace', path: '/marketplace', api: '/v1/marketplace/listings' },
    { surface: 'voice-marketplace', path: '/voice-marketplace', api: '/v1/voice-marketplace/engine' },
    {
      surface: 'plugin-marketplace',
      path: '/plugin-marketplace',
      api: '/v1/plugin-marketplace/engine',
    },
    {
      surface: 'model-marketplace',
      path: '/model-marketplace',
      api: '/v1/model-marketplace/engine',
    },
    {
      surface: 'dataset-marketplace',
      path: '/dataset-marketplace',
      api: '/v1/dataset-marketplace/engine',
    },
    {
      surface: 'prompt-marketplace',
      path: '/prompt-marketplace',
      api: '/v1/prompt-marketplace/engine',
    },
    {
      surface: 'agent-marketplace',
      path: '/agent-marketplace',
      api: '/v1/agent-marketplace/engine',
    },
    {
      surface: 'workflow-marketplace',
      path: '/workflow-marketplace',
      api: '/v1/workflow-marketplace/engine',
    },
    {
      surface: 'connector-marketplace',
      path: '/connector-marketplace',
      api: '/v1/connector-marketplace/engine',
    },
    {
      surface: 'voice-language-marketplace',
      path: '/voice-language-marketplace',
      api: '/v1/voice-language-marketplace/engine',
    },
    {
      surface: 'creator-economy',
      path: '/creator-economy',
      api: '/v1/creator-economy/engine',
    },
    { surface: 'creator-sales', path: '/marketplace', api: '/v1/marketplace/sales' },
    { surface: 'billing', path: '/billing', api: '/v1/billing/summary' },
    { surface: 'plugin-runtime', path: '/plugin-runtime', api: '/v1/plugin-runtime/engine' },
    { surface: 'agent-runtime', path: '/agent-runtime', api: '/v1/agent-runtime/engine' },
    { surface: 'agent-fabric', path: '/agent-fabric', api: '/v1/agent-fabric/products' },
    { surface: 'policy-fabric', path: '/policy-fabric', api: '/v1/policy-fabric/products' },
    { surface: 'model-registry', path: '/model-registry', api: '/v1/model-registry/engine' },
    { surface: 'developer-cloud', path: '/developers', api: '/v1/developer-cloud/products' },
  ];
}
