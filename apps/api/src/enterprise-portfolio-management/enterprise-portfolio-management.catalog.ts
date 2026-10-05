export function enterprisePortfolioManagementHonesty() {
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

export function enterprisePortfolioManagementCapabilities() {
  return [
    { id: 'product', name: 'Product', status: 'shipped', api: 'GET /v1/enterprise-portfolio-management/records?kind=product', notes: 'Product records in domain portfolio.' },
    { id: 'program', name: 'Program', status: 'shipped', api: 'GET /v1/enterprise-portfolio-management/records?kind=program', notes: 'Program records in domain portfolio.' },
    { id: 'project', name: 'Project', status: 'shipped', api: 'GET /v1/enterprise-portfolio-management/records?kind=project', notes: 'Project records in domain portfolio.' },
    { id: 'team', name: 'Team', status: 'shipped', api: 'GET /v1/enterprise-portfolio-management/records?kind=team', notes: 'Team records in domain portfolio.' },
    { id: 'budget', name: 'Budget', status: 'shipped', api: 'GET /v1/enterprise-portfolio-management/records?kind=budget', notes: 'Budget records in domain portfolio.' },
    { id: 'capacity', name: 'Capacity', status: 'shipped', api: 'GET /v1/enterprise-portfolio-management/records?kind=capacity', notes: 'Capacity records in domain portfolio.' },
    { id: 'dependency', name: 'Dependency', status: 'shipped', api: 'GET /v1/enterprise-portfolio-management/records?kind=dependency', notes: 'Dependency records in domain portfolio.' },
    { id: 'portfolio_risk', name: 'Portfolio Risk', status: 'shipped', api: 'GET /v1/enterprise-portfolio-management/records?kind=portfolio_risk', notes: 'Portfolio Risk records in domain portfolio.' }
  ];
}

export function enterprisePortfolioManagementRoutesTo() {
  return [
    { module: 'corporate-operating-system', path: '/v1/corporate-operating-system/products', role: 'VCOS Foundation' },
    { module: 'enterprise-engineering-system', path: '/v1/enterprise-engineering-system/products', role: 'EES (Vol 20)' },
    { module: 'ai-governance-platform', path: '/v1/ai-governance-platform/engine', role: 'AI Governance (Vol 15)' },
  ];
}
