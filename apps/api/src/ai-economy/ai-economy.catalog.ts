import { aieHonesty } from '../aie-store/aie-honesty';

export type AieProductRow = {
  id: string;
  name: string;
  status: 'shipped' | 'partial' | 'deferred';
  api: string | null;
  console: string | null;
  notes: string;
};

export function aiEconomyProductCatalog(): AieProductRow[] {
  return [
    {
      id: 'ai-economy',
      name: 'AI Economy',
      status: 'shipped' as const,
      api: 'GET /v1/ai-economy/products',
      console: '/ai-economy',
      notes: 'VL-374 AIE foundation. worldsLargestAiEconomy=false; marketplace software only.',
    },
    {
      id: 'ai-commerce-platform',
      name: 'AI Commerce Platform',
      status: 'shipped' as const,
      api: 'GET /v1/ai-commerce-platform/engine',
      console: '/ai-commerce-platform',
      notes: 'VL-375 Catalogs/subscriptions/invoices via existing Stripe billing — no hand-rolled card handling.',
    },
    {
      id: 'ai-licensing-platform',
      name: 'AI Licensing Platform',
      status: 'shipped' as const,
      api: 'GET /v1/ai-licensing-platform/engine',
      console: '/ai-licensing-platform',
      notes: 'VL-376 License entitlement ledger for models/datasets/voice/translation — not legal counsel.',
    },
    {
      id: 'revenue-sharing-platform',
      name: 'Revenue Sharing Platform',
      status: 'shipped' as const,
      api: 'GET /v1/revenue-sharing-platform/engine',
      console: '/revenue-sharing-platform',
      notes: 'VL-377 Royalty/payout ledger + workflow. autonomousPayouts=false; finance/legal set terms.',
    },
    {
      id: 'ai-talent-platform',
      name: 'AI Talent Platform',
      status: 'shipped' as const,
      api: 'GET /v1/ai-talent-platform/engine',
      console: '/ai-talent-platform',
      notes: 'VL-378 Marketplace matching for linguists/voice artists/translators/annotators — contracts still human.',
    },
    {
      id: 'research-funding-platform',
      name: 'Research Funding Platform',
      status: 'shipped' as const,
      api: 'GET /v1/research-funding-platform/engine',
      console: '/research-funding-platform',
      notes: 'VL-379 Grant/scholarship/innovation funding *tracking* — not autonomous grant disbursement.',
    },
    {
      id: 'global-community-platform',
      name: 'Global Community Platform',
      status: 'shipped' as const,
      api: 'GET /v1/global-community-platform/engine',
      console: '/global-community-platform',
      notes: 'VL-380 Forums/events/hackathons/open-source community tooling.',
    },
    {
      id: 'ai-investment-platform',
      name: 'AI Investment Platform',
      status: 'shipped' as const,
      api: 'GET /v1/ai-investment-platform/engine',
      console: '/ai-investment-platform',
      notes: 'VL-381 Investment *dashboard/reporting only*. fundingPortalOs=false; securitiesOfferingOs=false.',
    },
    {
      id: 'economic-intelligence',
      name: 'Economic Intelligence',
      status: 'shipped' as const,
      api: 'GET /v1/economic-intelligence/engine',
      console: '/economic-intelligence',
      notes: 'VL-382 Executive/adoption/revenue analytics dashboards — reporting tooling.',
    },
    {
      id: 'investment-dashboard-guard',
      name: 'Investment Dashboard Guard',
      status: 'shipped' as const,
      api: 'GET /v1/ai-investment-platform/engine',
      console: '/ai-investment-platform',
      notes: 'fundingPortalOs=false; securitiesOfferingOs=false; reporting only.',
    }
  ];
}

export function aiEconomyHonesty() {
  return aieHonesty();
}

export function aiEconomyLibrary() {
  return [
    { id: 'marketplace', title: 'Developer & Partner Marketplace' },
    { id: 'licensing', title: 'Licensing Engine' },
    { id: 'billing', title: 'Subscriptions & Usage Billing (Stripe)' },
    { id: 'revenue_share', title: 'Revenue Share Ledger' },
    { id: 'talent', title: 'Talent Marketplace' },
    { id: 'funding_track', title: 'Research Funding Tracking' },
    { id: 'community', title: 'Community Platform' },
    { id: 'investment_dash', title: 'Investment Dashboard (not a funding portal)' },
    { id: 'econ_intel', title: 'Economic Intelligence' },
  ];
}

export function aiEconomyRoutingTable() {
  return [
    { id: 'products', path: '/v1/ai-economy/products', purpose: 'AIE product catalog' },
    { id: 'overview', path: '/v1/ai-economy/overview', purpose: 'Authenticated overview' },
    { id: 'records', path: '/v1/ai-economy/records', purpose: 'All AIE records' },
    { id: 'monitoring', path: '/v1/ai-economy/monitoring', purpose: 'Monitoring snapshot' },
    { id: 'guards', path: '/v1/ai-economy/guards', purpose: 'Money/securities honesty guards' },
  ];
}
