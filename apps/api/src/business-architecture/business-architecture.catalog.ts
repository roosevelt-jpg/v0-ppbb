export function businessArchitectureHonesty() {
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

export function businessArchitectureCapabilities() {
  return [
    { id: 'capability', name: 'Business Capability', status: 'shipped', api: 'GET /v1/business-architecture/records?kind=capability', notes: 'Business Capability records in domain capability.' },
    { id: 'value_stream', name: 'Value Stream', status: 'shipped', api: 'GET /v1/business-architecture/records?kind=value_stream', notes: 'Value Stream records in domain capability.' },
    { id: 'process', name: 'Business Process', status: 'shipped', api: 'GET /v1/business-architecture/records?kind=process', notes: 'Business Process records in domain capability.' },
    { id: 'journey', name: 'Customer Journey', status: 'shipped', api: 'GET /v1/business-architecture/records?kind=journey', notes: 'Customer Journey records in domain capability.' },
    { id: 'operating_model', name: 'Operating Model', status: 'shipped', api: 'GET /v1/business-architecture/records?kind=operating_model', notes: 'Operating Model records in domain capability.' },
    { id: 'org_design', name: 'Organizational Design', status: 'shipped', api: 'GET /v1/business-architecture/records?kind=org_design', notes: 'Organizational Design records in domain capability.' }
  ];
}

export function businessArchitectureRoutesTo() {
  return [
    { module: 'corporate-operating-system', path: '/v1/corporate-operating-system/products', role: 'VCOS Foundation' },
    { module: 'enterprise-engineering-system', path: '/v1/enterprise-engineering-system/products', role: 'EES (Vol 20)' },
    { module: 'ai-governance-platform', path: '/v1/ai-governance-platform/engine', role: 'AI Governance (Vol 15)' },
  ];
}
