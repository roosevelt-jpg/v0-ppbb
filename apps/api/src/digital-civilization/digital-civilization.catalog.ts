import { dcivHonesty } from '../dciv-store/dciv-honesty';

export type DcivProductRow = {
  id: string;
  name: string;
  status: 'shipped' | 'partial' | 'deferred';
  api: string | null;
  console: string | null;
  notes: string;
};

export function digitalCivilizationProductCatalog(): DcivProductRow[] {
  return [
    {
      id: 'digital-civilization',
      name: 'Digital Civilization',
      status: 'shipped' as const,
      api: 'GET /v1/digital-civilization/products',
      console: '/digital-civilization',
      notes: 'DCIV foundation. civilizationInfrastructureOs=false; product platforms only.',
    },
    {
      id: 'national-ai-platform',
      name: 'National AI Platform',
      status: 'shipped' as const,
      api: 'GET /v1/national-ai-platform/engine',
      console: '/national-ai-platform',
      notes: 'Gov/public-sector demo platform. productionCourtPoliceMilitary=false; productionCitizenIdentityAuth=false.',
    },
    {
      id: 'smart-city-platform',
      name: 'Smart City Platform',
      status: 'shipped' as const,
      api: 'GET /v1/smart-city-platform/engine',
      console: '/smart-city-platform',
      notes: 'City systems integration demo. productionEmergencyDispatch=false.',
    },
    {
      id: 'enterprise-nation-platform',
      name: 'Enterprise Nation Platform',
      status: 'shipped' as const,
      api: 'GET /v1/enterprise-nation-platform/engine',
      console: '/enterprise-nation-platform',
      notes: 'Vertical platform for banks/hospitals/universities/telecoms — licensable product groundwork.',
    },
    {
      id: 'global-language-preservation',
      name: 'Global Language Preservation',
      status: 'shipped' as const,
      api: 'GET /v1/global-language-preservation/engine',
      console: '/global-language-preservation',
      notes: 'Endangered-language archives/digital museums. consentRequiredForCulturalArchives=true.',
    },
    {
      id: 'universal-translation-grid',
      name: 'Universal Translation Grid',
      status: 'shipped' as const,
      api: 'GET /v1/universal-translation-grid/engine',
      console: '/universal-translation-grid',
      notes: 'Translation infrastructure across speech/doc/broadcast/IoT channels.',
    },
    {
      id: 'global-knowledge-network',
      name: 'Global Knowledge Network',
      status: 'shipped' as const,
      api: 'GET /v1/global-knowledge-network/engine',
      console: '/global-knowledge-network',
      notes: 'Research/library/museum knowledge sharing network product.',
    },
    {
      id: 'global-ai-federation',
      name: 'Global AI Federation',
      status: 'shipped' as const,
      api: 'GET /v1/global-ai-federation/engine',
      console: '/global-ai-federation',
      notes: 'Federated learning/cross-border collaboration. federationSecurityReviewRequired=true.',
    },
    {
      id: 'civilization-intelligence-dashboard',
      name: 'Civilization Intelligence Dashboard',
      status: 'shipped' as const,
      api: 'GET /v1/civilization-intelligence-dashboard/engine',
      console: '/civilization-intelligence-dashboard',
      notes: 'Adoption/impact analytics dashboards — reporting tooling.',
    },
    {
      id: 'public-sector-guards',
      name: 'Public Sector Guards',
      status: 'shipped' as const,
      api: 'GET /v1/digital-civilization/guards',
      console: '/digital-civilization',
      notes: 'Court/police/military/emergency/citizen-ID production flags remain false.',
    }
  ];
}

export function digitalCivilizationHonesty() {
  return dcivHonesty();
}

export function digitalCivilizationLibrary() {
  return [
    { id: 'national', title: 'National / Public-Sector Platform (demo)' },
    { id: 'smart_city', title: 'Smart City Platform (demo)' },
    { id: 'enterprise_nation', title: 'Enterprise Nation Verticals' },
    { id: 'language_preservation', title: 'Language Preservation Archives' },
    { id: 'translation_grid', title: 'Universal Translation Grid' },
    { id: 'knowledge_network', title: 'Global Knowledge Network' },
    { id: 'ai_federation', title: 'Global AI Federation' },
    { id: 'civ_intel', title: 'Civilization Intelligence Dashboard' },
  ];
}

export function digitalCivilizationRoutingTable() {
  return [
    { id: 'products', path: '/v1/digital-civilization/products', purpose: 'DCIV product catalog' },
    { id: 'guards', path: '/v1/digital-civilization/guards', purpose: 'Public-sector honesty guards' },
    { id: 'overview', path: '/v1/digital-civilization/overview', purpose: 'Authenticated overview' },
    { id: 'records', path: '/v1/digital-civilization/records', purpose: 'All DCIV records' },
    { id: 'monitoring', path: '/v1/digital-civilization/monitoring', purpose: 'Monitoring snapshot' },
  ];
}
