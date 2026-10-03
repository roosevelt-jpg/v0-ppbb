export type VcosProductRow = {
  id: string;
  name: string;
  status: 'shipped' | 'partial' | 'deferred';
  api: string | null;
  console: string | null;
  notes: string;
};

export function corporateOperatingSystemProductCatalog(): VcosProductRow[] {
  return [
    {
      id: 'corporate-operating-system',
      name: 'Corporate Operating System',
      status: 'shipped',
      api: 'GET /v1/corporate-operating-system/products',
      console: '/corporate-operating-system',
      notes: 'VL-354 foundation. internalBusinessSoftware=true; realCorporateGovernance=false.',
    },
    {
      id: 'corporate-governance-platform',
      name: 'Corporate Governance Platform',
      status: 'shipped',
      api: 'GET /v1/corporate-governance-platform/engine',
      console: '/corporate-governance-platform',
      notes: 'VL-355 committee/board tracking tooling.',
    },
    {
      id: 'strategic-planning-platform',
      name: 'Strategic Planning Platform',
      status: 'shipped',
      api: 'GET /v1/strategic-planning-platform/engine',
      console: '/strategic-planning-platform',
      notes: 'VL-356 strategy/OKR tooling.',
    },
    {
      id: 'enterprise-portfolio-management',
      name: 'Enterprise Portfolio Management',
      status: 'shipped',
      api: 'GET /v1/enterprise-portfolio-management/engine',
      console: '/enterprise-portfolio-management',
      notes: 'VL-357 portfolio tracking.',
    },
    {
      id: 'business-architecture',
      name: 'Business Architecture',
      status: 'shipped',
      api: 'GET /v1/business-architecture/engine',
      console: '/business-architecture',
      notes: 'VL-358 capability/value-stream models.',
    },
    {
      id: 'enterprise-architecture-repository',
      name: 'Enterprise Architecture Repository',
      status: 'shipped',
      api: 'GET /v1/enterprise-architecture-repository/engine',
      console: '/enterprise-architecture-repository',
      notes: 'VL-359 architecture artifact store; togafModelingSuiteOs=false.',
    },
    {
      id: 'corporate-knowledge-system',
      name: 'Corporate Knowledge System',
      status: 'shipped',
      api: 'GET /v1/corporate-knowledge-system/engine',
      console: '/corporate-knowledge-system',
      notes: 'VL-360 knowledge portal; confluenceOs=false.',
    },
    {
      id: 'executive-intelligence-platform',
      name: 'Executive Intelligence Platform',
      status: 'shipped',
      api: 'GET /v1/executive-intelligence-platform/engine',
      console: '/executive-intelligence-platform',
      notes: 'VL-361 executive/board KPI cockpits.',
    },
    {
      id: 'corporate-risk-platform',
      name: 'Corporate Risk Platform',
      status: 'shipped',
      api: 'GET /v1/corporate-risk-platform/engine',
      console: '/corporate-risk-platform',
      notes: 'VL-362 enterprise risk register.',
    },
    {
      id: 'digital-constitution',
      name: 'Digital Constitution',
      status: 'shipped',
      api: 'GET /v1/corporate-operating-system/constitution',
      console: '/corporate-operating-system',
      notes: 'VL-363 audit packs Digital Constitution layers (versioned principles).',
    },
  ];
}

export function corporateOperatingSystemHonesty() {
  return {
    internalBusinessSoftware: true,
    realCorporateGovernance: false,
    boardOs: false,
    legalCounselOs: false,
    confluenceOs: false,
    jiraOs: false,
    togafModelingSuiteOs: false,
    executiveJudgmentOs: false,
  };
}

export function digitalConstitutionLayers() {
  return [
    { id: 'mission', title: 'Mission Constitution', focus: ['why VerbaLab exists', 'long-term mission', 'core values'] },
    { id: 'engineering', title: 'Engineering Constitution', focus: ['architecture', 'coding', 'API', 'security', 'AI principles'] },
    { id: 'product', title: 'Product Constitution', focus: ['UX', 'accessibility', 'localization', 'quality'] },
    { id: 'ai', title: 'AI Constitution', focus: ['responsible AI', 'safety', 'fairness', 'human oversight', 'evaluation'] },
    { id: 'data', title: 'Data Constitution', focus: ['ownership', 'privacy', 'sovereignty', 'retention', 'classification'] },
    { id: 'research', title: 'Research Constitution', focus: ['publication', 'open-source', 'patent', 'technology transfer'] },
    { id: 'operations', title: 'Operations Constitution', focus: ['incident response', 'BCP', 'DR', 'change management'] },
    { id: 'corporate', title: 'Corporate Constitution', focus: ['governance', 'ethics', 'decision-making', 'accountability'] },
  ];
}

export function corporateOperatingSystemRoutingTable() {
  return [
    { id: 'products', path: '/v1/corporate-operating-system/products', purpose: 'VCOS product catalog' },
    { id: 'engine', path: '/v1/corporate-operating-system/engine', purpose: 'Engine alias' },
    { id: 'overview', path: '/v1/corporate-operating-system/overview', purpose: 'Authenticated overview' },
    { id: 'constitution', path: '/v1/corporate-operating-system/constitution', purpose: 'Digital Constitution layers' },
    { id: 'records', path: '/v1/corporate-operating-system/records', purpose: 'All VCOS records' },
    { id: 'monitoring', path: '/v1/corporate-operating-system/monitoring', purpose: 'Monitoring snapshot' },
  ];
}
