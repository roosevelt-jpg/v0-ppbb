export function enterpriseArchitectureRepositoryHonesty() {
  return {
    internalBusinessSoftware: true,
    realCorporateGovernance: false,
    boardOs: false,
    legalCounselOs: false,
    confluenceOs: false,
    jiraOs: false,
    togafModelingSuiteOs: false,
    executiveJudgmentOs: false,
    note: 'Tooling that supports governance and strategy processes for corporate teams.',
  };
}

export function enterpriseArchitectureRepositoryCapabilities() {
  return [
    { id: 'capability_model', name: 'Capability Model', status: 'shipped', api: 'GET /v1/enterprise-architecture-repository/records?kind=capability_model', notes: 'Capability Model records in domain architecture.' },
    { id: 'information_model', name: 'Information Model', status: 'shipped', api: 'GET /v1/enterprise-architecture-repository/records?kind=information_model', notes: 'Information Model records in domain architecture.' },
    { id: 'application_map', name: 'Application Map', status: 'shipped', api: 'GET /v1/enterprise-architecture-repository/records?kind=application_map', notes: 'Application Map records in domain architecture.' },
    { id: 'technology_map', name: 'Technology Map', status: 'shipped', api: 'GET /v1/enterprise-architecture-repository/records?kind=technology_map', notes: 'Technology Map records in domain architecture.' },
    { id: 'traceability', name: 'Architecture Traceability', status: 'shipped', api: 'GET /v1/enterprise-architecture-repository/records?kind=traceability', notes: 'Architecture Traceability records in domain architecture.' },
    { id: 'archimate_view', name: 'ArchiMate View', status: 'shipped', api: 'GET /v1/enterprise-architecture-repository/records?kind=archimate_view', notes: 'ArchiMate View records in domain architecture.' }
  ];
}

export function enterpriseArchitectureRepositoryRoutesTo() {
  return [
    { module: 'corporate-operating-system', path: '/v1/corporate-operating-system/products', role: 'VCOS Foundation' },
    { module: 'enterprise-engineering-system', path: '/v1/enterprise-engineering-system/products', role: 'EES (Vol 20)' },
    { module: 'ai-governance-platform', path: '/v1/ai-governance-platform/engine', role: 'AI Governance (Vol 15)' },
  ];
}
