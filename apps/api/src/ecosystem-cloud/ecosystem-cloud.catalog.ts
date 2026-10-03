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
        'Ecosystem hub (VL-249). Discovery + honesty for marketplaces/monetization. Extends VL-090+/voice marketplace — does not regenerate Volumes 1–10.',
    },
    {
      id: 'content-marketplace',
      name: 'Content Marketplace',
      status: 'shipped',
      api: 'GET /v1/marketplace/listings',
      console: '/marketplace',
      notes:
        'Existing VL-090–092 glossary/prompt/dataset listings + Stripe Connect (ADR-0031–0033). Foundation links here; dedicated kind marketplaces extend later.',
    },
    {
      id: 'voice-marketplace',
      name: 'Voice Marketplace',
      status: 'shipped',
      api: 'GET /v1/voice-marketplace/engine',
      console: '/voice-marketplace',
      notes:
        'Existing voice/pack/language_pack/enterprise marketplace (VL-177 / ADR-0088). Voice & Language Marketplace (VL-257) extends — does not replace.',
    },
    {
      id: 'plugin-marketplace',
      name: 'Plugin Marketplace',
      status: 'shipped',
      api: 'GET /v1/plugin-marketplace/engine',
      console: '/plugin-marketplace',
      notes:
        'VL-250 / Phase 117. Publish/install/run via Plugin Runtime sandbox + PluginPolicyGate + FabricPolicyGate. liveCodeExecution=false.',
    },
    {
      id: 'model-marketplace',
      name: 'Model Marketplace',
      status: 'shipped',
      api: 'GET /v1/model-marketplace/engine',
      console: '/model-marketplace',
      notes:
        'VL-251 / Phase 118. License SKUs over Model Registry; FabricPolicyGate + Stripe honesty. Not Hugging Face / weight CDN OS.',
    },
    {
      id: 'dataset-marketplace',
      name: 'Dataset Marketplace',
      status: 'deferred',
      api: null,
      console: null,
      notes:
        'VL-252 / Phase 119. Extends content-marketplace dataset kind — not Label Studio / Dataset Cloud OS.',
    },
    {
      id: 'prompt-marketplace',
      name: 'Prompt Marketplace',
      status: 'deferred',
      api: null,
      console: null,
      notes:
        'VL-253 / Phase 120. Extends content-marketplace prompt kind + Prompt Fabric — not a prompt mesh OS.',
    },
    {
      id: 'agent-marketplace',
      name: 'Agent Marketplace',
      status: 'deferred',
      api: null,
      console: null,
      notes:
        'VL-254 / Phase 121. Must enforce Agent Runtime sandbox + Policy Fabric hard-gate before third-party agents execute.',
    },
    {
      id: 'workflow-marketplace',
      name: 'Workflow Marketplace',
      status: 'deferred',
      api: null,
      console: null,
      notes: 'VL-255 / Phase 122. Publish/share Workflow Runtime definitions — not Zapier OS.',
    },
    {
      id: 'connector-marketplace',
      name: 'Connector Marketplace',
      status: 'deferred',
      api: null,
      console: null,
      notes: 'VL-256 / Phase 123. Buy/sell connectors — not a full iPaaS OS.',
    },
    {
      id: 'voice-language-marketplace',
      name: 'Voice & Language Marketplace',
      status: 'deferred',
      api: null,
      console: null,
      notes:
        'VL-257 / Phase 124. Extends voice marketplace + Volume 1 language packs — does not regenerate Voice Cloud.',
    },
    {
      id: 'creator-economy',
      name: 'Creator Economy',
      status: 'partial',
      api: 'GET /v1/marketplace/sales',
      console: '/marketplace',
      notes:
        'VL-092 Stripe Connect Express + platform fee already ships. VL-258 / Phase 125 expands royalty math, payouts, tax/dispute honesty — hand-check payout math before live creators.',
    },
    {
      id: 'sdk-marketplace',
      name: 'SDK Marketplace',
      status: 'deferred',
      api: null,
      console: null,
      notes: 'Catalog placeholder from Phase 116 product list. Not a package registry OS in Foundation.',
    },
    {
      id: 'template-marketplace',
      name: 'Template Marketplace',
      status: 'deferred',
      api: null,
      console: null,
      notes: 'Catalog placeholder from Phase 116 product list. Templates stay deferred until a dedicated phase.',
    },
    {
      id: 'extension-marketplace',
      name: 'Extension Marketplace',
      status: 'deferred',
      api: null,
      console: null,
      notes: 'Catalog placeholder from Phase 116 product list. Extensions map to Plugin Marketplace later.',
    },
    {
      id: 'billing-analytics',
      name: 'Ecosystem Billing & Analytics',
      status: 'partial',
      api: 'GET /v1/marketplace/sales',
      console: '/billing',
      notes:
        'Discovery link to existing billing/usage + marketplace sales. Not a new ledger rewrite in Foundation.',
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
      'Volume 11 README: real payments/licensing/royalties. Foundation ships discovery hub + honesty. Later phases extend marketplaces; Creator Economy must hand-check payout math; Plugin/Agent marketplaces must enforce Volume 8 sandboxes before third-party code runs.',
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
