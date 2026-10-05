export function strategicPlanningPlatformHonesty() {
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

export function strategicPlanningPlatformCapabilities() {
  return [
    { id: 'strategy_3y', name: '3-Year Strategy', status: 'shipped', api: 'GET /v1/strategic-planning-platform/records?kind=strategy_3y', notes: '3-Year Strategy records in domain strategy.' },
    { id: 'strategy_5y', name: '5-Year Strategy', status: 'shipped', api: 'GET /v1/strategic-planning-platform/records?kind=strategy_5y', notes: '5-Year Strategy records in domain strategy.' },
    { id: 'strategy_10y', name: '10-Year Strategy', status: 'shipped', api: 'GET /v1/strategic-planning-platform/records?kind=strategy_10y', notes: '10-Year Strategy records in domain strategy.' },
    { id: 'vision_20y', name: '20-Year Vision', status: 'shipped', api: 'GET /v1/strategic-planning-platform/records?kind=vision_20y', notes: '20-Year Vision records in domain strategy.' },
    { id: 'okr', name: 'OKR', status: 'shipped', api: 'GET /v1/strategic-planning-platform/records?kind=okr', notes: 'OKR records in domain strategy.' },
    { id: 'roadmap', name: 'Roadmap', status: 'shipped', api: 'GET /v1/strategic-planning-platform/records?kind=roadmap', notes: 'Roadmap records in domain strategy.' },
    { id: 'investment_plan', name: 'Investment Plan', status: 'shipped', api: 'GET /v1/strategic-planning-platform/records?kind=investment_plan', notes: 'Investment Plan records in domain strategy.' },
    { id: 'rd_plan', name: 'R&D Plan', status: 'shipped', api: 'GET /v1/strategic-planning-platform/records?kind=rd_plan', notes: 'R&D Plan records in domain strategy.' }
  ];
}

export function strategicPlanningPlatformRoutesTo() {
  return [
    { module: 'corporate-operating-system', path: '/v1/corporate-operating-system/products', role: 'VCOS Foundation' },
    { module: 'enterprise-engineering-system', path: '/v1/enterprise-engineering-system/products', role: 'EES (Vol 20)' },
    { module: 'ai-governance-platform', path: '/v1/ai-governance-platform/engine', role: 'AI Governance (Vol 15)' },
  ];
}
