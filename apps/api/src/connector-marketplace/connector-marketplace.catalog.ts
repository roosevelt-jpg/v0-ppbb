export type ConnectorMarketplaceStatus = 'shipped' | 'partial' | 'deferred';

export type ConnectorMarketplaceCapability = {
  id: string;
  name: string;
  status: ConnectorMarketplaceStatus;
  api: string | null;
  notes: string;
};

export const CONNECTOR_MARKETPLACE_CATEGORIES = [
  'crm',
  'erp',
  'hr',
  'finance',
  'healthcare',
  'government',
  'cloud',
  'identity',
  'email',
  'telephony',
  'payments',
  'video',
  'llm',
  'agent',
] as const;

export type ConnectorMarketplaceCategory = (typeof CONNECTOR_MARKETPLACE_CATEGORIES)[number];

export type ConnectorCatalogEntry = {
  key: string;
  name: string;
  category: ConnectorMarketplaceCategory;
  status: ConnectorMarketplaceStatus;
  api: string | null;
  notes: string;
};

/** Built-in connector SKUs — extend Slack (ADR-0026); not a full iPaaS catalog OS. */
export const CONNECTOR_CATALOG: ConnectorCatalogEntry[] = [
  {
    key: 'slack',
    name: 'Slack',
    category: 'cloud',
    status: 'shipped',
    api: '/v1/connectors/slack/commands',
    notes: 'Existing Slack slash connector (ADR-0026). Marketplace listing is an entitlement SKU.',
  },
  {
    key: 'crm.generic',
    name: 'CRM Connector',
    category: 'crm',
    status: 'shipped',
    api: null,
    notes: 'Metadata entitlement for CRM-class connectors.',
  },
  {
    key: 'erp.generic',
    name: 'ERP Connector',
    category: 'erp',
    status: 'shipped',
    api: null,
    notes: 'Metadata entitlement for ERP-class connectors.',
  },
  {
    key: 'hr.generic',
    name: 'HR Connector',
    category: 'hr',
    status: 'shipped',
    api: null,
    notes: 'Metadata entitlement for HR-class connectors.',
  },
  {
    key: 'finance.generic',
    name: 'Finance Connector',
    category: 'finance',
    status: 'shipped',
    api: null,
    notes: 'Metadata entitlement.',
  },
  {
    key: 'healthcare.generic',
    name: 'Healthcare Connector',
    category: 'healthcare',
    status: 'shipped',
    api: null,
    notes: 'Metadata entitlement.',
  },
  {
    key: 'government.generic',
    name: 'Government Connector',
    category: 'government',
    status: 'shipped',
    api: null,
    notes: 'Metadata entitlement for government systems.',
  },
  {
    key: 'cloud.generic',
    name: 'Cloud Connector',
    category: 'cloud',
    status: 'shipped',
    api: null,
    notes: 'Metadata entitlement for cloud SaaS connectors.',
  },
  {
    key: 'identity.generic',
    name: 'Identity Connector',
    category: 'identity',
    status: 'shipped',
    api: null,
    notes: 'Metadata entitlement.',
  },
  {
    key: 'email.generic',
    name: 'Email Connector',
    category: 'email',
    status: 'shipped',
    api: null,
    notes: 'Metadata entitlement.',
  },
  {
    key: 'telephony.generic',
    name: 'Telephony Connector',
    category: 'telephony',
    status: 'shipped',
    api: null,
    notes: 'Metadata entitlement.',
  },
  {
    key: 'payments.generic',
    name: 'Payments Connector',
    category: 'payments',
    status: 'shipped',
    api: null,
    notes: 'Metadata entitlement. Live card vault forbidden; Stripe stays elsewhere.',
  },
  {
    key: 'partner.higgsfield',
    name: 'Higgsfield Partner Connector',
    category: 'video',
    status: 'shipped',
    api: '/v1/partner-connectors/platforms/higgsfield',
    notes: 'Video platform partner API via Partner Connectors + MCP (ADR-0326).',
  },
  {
    key: 'partner.claude',
    name: 'Claude MCP Partner Connector',
    category: 'llm',
    status: 'shipped',
    api: '/v1/partner-connectors/mcp',
    notes: 'Claude/Cursor-ready MCP tool server over Own AI.',
  },
  {
    key: 'partner.cursor',
    name: 'Cursor MCP Partner Connector',
    category: 'agent',
    status: 'shipped',
    api: '/v1/partner-connectors/mcp/manifest',
    notes: 'Cursor MCP manifest + stdio bridge (@verbalab/mcp).',
  },
  {
    key: 'partner.runway',
    name: 'Runway Partner Connector',
    category: 'video',
    status: 'shipped',
    api: '/v1/partner-connectors/platforms/runway',
    notes: 'Video partner invoke + webhooks.',
  },
  {
    key: 'partner.pika',
    name: 'Pika Partner Connector',
    category: 'video',
    status: 'shipped',
    api: '/v1/partner-connectors/platforms/pika',
    notes: 'Short-form video partner connector.',
  },
  {
    key: 'partner.luma',
    name: 'Luma Partner Connector',
    category: 'video',
    status: 'shipped',
    api: '/v1/partner-connectors/platforms/luma',
    notes: 'Cinematic video partner connector.',
  },
  {
    key: 'partner.kling',
    name: 'Kling Partner Connector',
    category: 'video',
    status: 'shipped',
    api: '/v1/partner-connectors/platforms/kling',
    notes: 'Video partner connector.',
  },
  {
    key: 'partner.heygen',
    name: 'HeyGen Partner Connector',
    category: 'video',
    status: 'shipped',
    api: '/v1/partner-connectors/platforms/heygen',
    notes: 'Avatar/video voice partner connector.',
  },
  {
    key: 'partner.synthesia',
    name: 'Synthesia Partner Connector',
    category: 'video',
    status: 'shipped',
    api: '/v1/partner-connectors/platforms/synthesia',
    notes: 'Enterprise video partner connector.',
  },
  {
    key: 'partner.chatgpt',
    name: 'ChatGPT Agents Partner Connector',
    category: 'llm',
    status: 'shipped',
    api: '/v1/partner-connectors/tools',
    notes: 'Tool-calling surface for OpenAI-style agents.',
  },
  {
    key: 'partner.custom',
    name: 'Custom Partner Connector',
    category: 'cloud',
    status: 'shipped',
    api: '/v1/partner-connectors/invoke',
    notes: 'Generic REST/MCP/CLI partner invoke.',
  },
];

export function findConnectorCatalogEntry(key: string): ConnectorCatalogEntry | undefined {
  const normalized = key.trim().toLowerCase();
  return CONNECTOR_CATALOG.find((c) => c.key === normalized);
}

/**
 * Library Phase 123 → Connector Marketplace (VL-256).
 * Buy/sell/publish connector entitlements — not Zapier/iPaaS OS.
 * Extends Slack connector (ADR-0026). Volume 11: Stripe-only; never store raw cards.
 */
export function connectorMarketplaceEngineCatalog() {
  return {
    product: 'VerbaLab Connector Marketplace',
    note:
      'Connector Marketplace. Publish/license connector SKUs over the built-in connector catalog + existing Slack connector. Install grants workspace entitlements. Monetization records MarketplaceSale receipts; Stripe Connect via.',
    capabilities: [
      {
        id: 'crm-connectors',
        name: 'CRM',
        status: 'shipped',
        api: 'POST /v1/connector-marketplace/listings',
        notes: 'category=crm entitlement listings.',
      },
      {
        id: 'erp-connectors',
        name: 'ERP',
        status: 'shipped',
        api: 'POST /v1/connector-marketplace/listings',
        notes: 'category=erp.',
      },
      {
        id: 'hr-connectors',
        name: 'HR',
        status: 'shipped',
        api: 'POST /v1/connector-marketplace/listings',
        notes: 'category=hr.',
      },
      {
        id: 'finance-connectors',
        name: 'Finance',
        status: 'shipped',
        api: 'POST /v1/connector-marketplace/listings',
        notes: 'category=finance.',
      },
      {
        id: 'healthcare-connectors',
        name: 'Healthcare',
        status: 'shipped',
        api: 'POST /v1/connector-marketplace/listings',
        notes: 'category=healthcare metadata listings.',
      },
      {
        id: 'government-connectors',
        name: 'Government',
        status: 'shipped',
        api: 'POST /v1/connector-marketplace/listings',
        notes: 'category=government.',
      },
      {
        id: 'cloud-connectors',
        name: 'Cloud',
        status: 'shipped',
        api: 'POST /v1/connector-marketplace/listings',
        notes: 'category=cloud — includes Slack entitlement SKU.',
      },
      {
        id: 'identity-connectors',
        name: 'Identity',
        status: 'shipped',
        api: 'POST /v1/connector-marketplace/listings',
        notes: 'category=identity.',
      },
      {
        id: 'email-connectors',
        name: 'Email',
        status: 'shipped',
        api: 'POST /v1/connector-marketplace/listings',
        notes: 'category=email.',
      },
      {
        id: 'telephony-connectors',
        name: 'Telephony',
        status: 'shipped',
        api: 'POST /v1/connector-marketplace/listings',
        notes: 'category=telephony.',
      },
      {
        id: 'payments-connectors',
        name: 'Payments',
        status: 'shipped',
        api: 'POST /v1/connector-marketplace/listings',
        notes: 'category=payments metadata only —.',
      },
      {
        id: 'connector-security',
        name: 'Connector Security',
        status: 'shipped',
        api: 'POST /v1/connector-marketplace/listings/:id/install',
        notes:
          'Install is entitlement-only. FabricPolicyGate on publish/install.',
      },
      {
        id: 'connector-analytics',
        name: 'Connector Analytics',
        status: 'shipped',
        api: 'GET /v1/connector-marketplace/analytics',
        notes: 'Listing/install/review aggregates. Commerce aggregates available; deeper payout math lives in Creator Economy.',
      },
      {
        id: 'connector-monetization',
        name: 'Connector Monetization',
        status: 'shipped',
        api: 'POST /v1/connector-marketplace/listings/:id/install',
        notes:
          'Paid listings record MarketplaceSale receipts (15% fee). Stripe Connect when configured.',
      },
    ] satisfies ConnectorMarketplaceCapability[],
    categories: CONNECTOR_MARKETPLACE_CATEGORIES.map((id) => ({ id })),
    connectors: CONNECTOR_CATALOG.map((c) => ({
      key: c.key,
      name: c.name,
      category: c.category,
      status: c.status,
      api: c.api,
    })),
    architecture: {
      style: 'nest_modular_monolith',
      cqrs: true,
      hexagonalRewrite: false,
      extendsSlackConnector: true,
      extendsMarketplaceListings: true,
      regeneratesConnectors: false,
      regeneratesMarketplaceVl090: false,
      ipaasOs: false,
      zapierOs: false,
      mulesoftOs: false,
      liveConnectorExecution: false,
      sandboxRequired: true,
      fabricPolicyHardGateRequired: true,
      stripeOrEquivalentRequired: true,
      storesRawCardData: false,
      realMoneyRiskCategory: true,
    },
    honesty: {
      liveConnectorExecution: false,
      openOutboundExecution: false,
      ipaasOs: false,
      zapierOs: false,
      mulesoftOs: false,
      regeneratesConnectors: false,
      regeneratesMarketplaceVl090: false,
      sandboxRequired: true,
      fabricPolicyHardGateRequired: true,
      paymentProcessorOs: false,
      storesRawCardData: false,
      stripeOrEquivalentRequired: true,
      realMoneyRiskCategory: true,
      creatorPayoutMathVerifiedLive: false,
    },
    safety: {
      sandboxRequired: true,
      liveConnectorExecutionForbidden: true,
      fabricPolicyHardGateRequired: true,
      stripeOrEquivalentRequired: true,
      storesRawCardData: false,
      note:
        'Volume 11 real-money volume. Connector listings are entitlements. Use Stripe (or equivalent); never store raw card data.',
    },
    docs: '/docs/CONNECTOR_MARKETPLACE.md',
  };
}
