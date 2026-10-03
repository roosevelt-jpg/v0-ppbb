import { vgasHonesty } from '../vgas-store/vgas-honesty';

export type VgasProductRow = {
  id: string;
  name: string;
  status: 'shipped' | 'partial' | 'deferred';
  api: string | null;
  console: string | null;
  notes: string;
};

export function globalAiStandardsProductCatalog(): VgasProductRow[] {
  return [
    {
      id: 'global-ai-standards',
      name: 'Global AI Standards',
      status: 'shipped' as const,
      api: 'GET /v1/global-ai-standards/products',
      console: '/global-ai-standards',
      notes: 'VL-364 VGAS foundation. internationalStandardAdoption=false.',
    },
    {
      id: 'ai-certification-platform',
      name: 'AI Certification Platform',
      status: 'shipped' as const,
      api: 'GET /v1/ai-certification-platform/engine',
      console: '/ai-certification-platform',
      notes: 'VL-365 VerbaLab-issued certificates. thirdPartyAccreditation=false.',
    },
    {
      id: 'ai-compliance-framework',
      name: 'AI Compliance Framework',
      status: 'shipped' as const,
      api: 'GET /v1/ai-compliance-framework/engine',
      console: '/ai-compliance-framework',
      notes: 'VL-366 Self-assessment gap-analysis tooling.',
    },
    {
      id: 'reference-architectures',
      name: 'Reference Architectures',
      status: 'shipped' as const,
      api: 'GET /v1/reference-architectures/engine',
      console: '/reference-architectures',
      notes: 'VL-367 Industry vertical blueprints.',
    },
    {
      id: 'best-practices-library',
      name: 'Best Practices Library',
      status: 'shipped' as const,
      api: 'GET /v1/best-practices-library/engine',
      console: '/best-practices-library',
      notes: 'VL-368 Pattern catalog.',
    },
    {
      id: 'enterprise-assessment-platform',
      name: 'Enterprise Assessment Platform',
      status: 'shipped' as const,
      api: 'GET /v1/enterprise-assessment-platform/engine',
      console: '/enterprise-assessment-platform',
      notes: 'VL-369 Maturity assessment tooling.',
    },
    {
      id: 'standards-repository',
      name: 'Standards Repository',
      status: 'shipped' as const,
      api: 'GET /v1/standards-repository/engine',
      console: '/standards-repository',
      notes: 'VL-370 Versioned standards content store.',
    },
    {
      id: 'global-partner-program',
      name: 'Global Partner Program',
      status: 'shipped' as const,
      api: 'GET /v1/global-partner-program/engine',
      console: '/global-partner-program',
      notes: 'VL-371 Partner onboarding portal.',
    },
    {
      id: 'standards-analytics',
      name: 'Standards Analytics',
      status: 'shipped' as const,
      api: 'GET /v1/standards-analytics/engine',
      console: '/standards-analytics',
      notes: 'VL-372 Adoption analytics.',
    },
    {
      id: 'certificate-verification',
      name: 'Certificate Verification',
      status: 'shipped' as const,
      api: 'GET /v1/global-ai-standards/verify/:code',
      console: '/ai-certification-platform',
      notes: 'Public verify API for VerbaLab-issued certificates. thirdPartyAccreditation=false.',
    },
    {
      id: 'iso-process-maturity',
      name: 'ISO Process Maturity',
      status: 'shipped' as const,
      api: 'GET /v1/global-ai-standards/iso-process',
      console: '/global-ai-standards',
      notes: 'ISO-aligned document control + recognition pathway. isoProcessMaturity=true; isoIeeeW3cRecognition=false.',
    },
  ];
}

export function globalAiStandardsHonesty() {
  return vgasHonesty();
}

export function globalAiStandardsLibrary() {
  return [
    { id: 'enterprise_ai', title: 'Enterprise AI Standard' },
    { id: 'african_ai', title: 'African AI Standard' },
    { id: 'language_ai', title: 'Language AI Standard' },
    { id: 'translation_ai', title: 'Translation AI Standard' },
    { id: 'voice_ai', title: 'Voice AI Standard' },
  ];
}

export function globalAiStandardsRoutingTable() {
  return [
    { id: 'products', path: '/v1/global-ai-standards/products', purpose: 'VGAS product catalog' },
    { id: 'iso-process', path: '/v1/global-ai-standards/iso-process', purpose: 'ISO-aligned process maturity + recognition pathway' },
    { id: 'verify', path: '/v1/global-ai-standards/verify/:code', purpose: 'Certificate verification' },
    { id: 'overview', path: '/v1/global-ai-standards/overview', purpose: 'Authenticated overview' },
    { id: 'records', path: '/v1/global-ai-standards/records', purpose: 'All VGAS records' },
    { id: 'monitoring', path: '/v1/global-ai-standards/monitoring', purpose: 'Monitoring snapshot' },
  ];
}
