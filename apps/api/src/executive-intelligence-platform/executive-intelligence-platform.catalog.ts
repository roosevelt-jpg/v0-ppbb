export function executiveIntelligencePlatformHonesty() {
  return {
    internalBusinessSoftware: true,
    realCorporateGovernance: false,
    boardOs: false,
    legalCounselOs: false,
    confluenceOs: false,
    jiraOs: false,
    togafModelingSuiteOs: false,
    executiveJudgmentOs: false,
    note:
      'Volume 21 README: tooling that supports governance/strategy processes — not a substitute for a real board, counsel, or executives.',
  };
}

export function executiveIntelligencePlatformCapabilities() {
  return [
    { id: 'corporate_kpi', name: 'Corporate KPI', status: 'shipped', api: 'GET /v1/executive-intelligence-platform/records?kind=corporate_kpi', notes: 'Corporate KPI records in domain executive.' },
    { id: 'product_kpi', name: 'Product KPI', status: 'shipped', api: 'GET /v1/executive-intelligence-platform/records?kind=product_kpi', notes: 'Product KPI records in domain executive.' },
    { id: 'engineering_kpi', name: 'Engineering KPI', status: 'shipped', api: 'GET /v1/executive-intelligence-platform/records?kind=engineering_kpi', notes: 'Engineering KPI records in domain executive.' },
    { id: 'ai_kpi', name: 'AI KPI', status: 'shipped', api: 'GET /v1/executive-intelligence-platform/records?kind=ai_kpi', notes: 'AI KPI records in domain executive.' },
    { id: 'financial_kpi', name: 'Financial KPI', status: 'shipped', api: 'GET /v1/executive-intelligence-platform/records?kind=financial_kpi', notes: 'Financial KPI records in domain executive.' },
    { id: 'customer_kpi', name: 'Customer KPI', status: 'shipped', api: 'GET /v1/executive-intelligence-platform/records?kind=customer_kpi', notes: 'Customer KPI records in domain executive.' },
    { id: 'research_kpi', name: 'Research KPI', status: 'shipped', api: 'GET /v1/executive-intelligence-platform/records?kind=research_kpi', notes: 'Research KPI records in domain executive.' }
  ];
}

export function executiveIntelligencePlatformRoutesTo() {
  return [
    { module: 'corporate-operating-system', path: '/v1/corporate-operating-system/products', role: 'VCOS Foundation' },
    { module: 'enterprise-engineering-system', path: '/v1/enterprise-engineering-system/products', role: 'EES (Vol 20)' },
    { module: 'ai-governance-platform', path: '/v1/ai-governance-platform/engine', role: 'AI Governance (Vol 15)' },
  ];
}
