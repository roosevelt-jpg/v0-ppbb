export function corporateKnowledgeSystemHonesty() {
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

export function corporateKnowledgeSystemCapabilities() {
  return [
    { id: 'policy', name: 'Policy', status: 'shipped', api: 'GET /v1/corporate-knowledge-system/records?kind=policy', notes: 'Policy records in domain knowledge.' },
    { id: 'sop', name: 'SOP', status: 'shipped', api: 'GET /v1/corporate-knowledge-system/records?kind=sop', notes: 'SOP records in domain knowledge.' },
    { id: 'playbook', name: 'Playbook', status: 'shipped', api: 'GET /v1/corporate-knowledge-system/records?kind=playbook', notes: 'Playbook records in domain knowledge.' },
    { id: 'standard', name: 'Standard', status: 'shipped', api: 'GET /v1/corporate-knowledge-system/records?kind=standard', notes: 'Standard records in domain knowledge.' },
    { id: 'decision_record', name: 'Decision Record', status: 'shipped', api: 'GET /v1/corporate-knowledge-system/records?kind=decision_record', notes: 'Decision Record records in domain knowledge.' },
    { id: 'research_note', name: 'Research Note', status: 'shipped', api: 'GET /v1/corporate-knowledge-system/records?kind=research_note', notes: 'Research Note records in domain knowledge.' },
    { id: 'meeting_note', name: 'Meeting Note', status: 'shipped', api: 'GET /v1/corporate-knowledge-system/records?kind=meeting_note', notes: 'Meeting Note records in domain knowledge.' },
    { id: 'institutional_memory', name: 'Institutional Memory', status: 'shipped', api: 'GET /v1/corporate-knowledge-system/records?kind=institutional_memory', notes: 'Institutional Memory records in domain knowledge.' }
  ];
}

export function corporateKnowledgeSystemRoutesTo() {
  return [
    { module: 'corporate-operating-system', path: '/v1/corporate-operating-system/products', role: 'VCOS Foundation' },
    { module: 'enterprise-engineering-system', path: '/v1/enterprise-engineering-system/products', role: 'EES (Vol 20)' },
    { module: 'ai-governance-platform', path: '/v1/ai-governance-platform/engine', role: 'AI Governance (Vol 15)' },
  ];
}
