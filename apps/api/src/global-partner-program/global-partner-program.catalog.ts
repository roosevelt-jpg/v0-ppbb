import { vgasHonesty } from '../vgas-store/vgas-honesty';

export function globalPartnerProgramHonesty() {
  return vgasHonesty();
}

export function globalPartnerProgramCapabilities() {
  return [
    { id: 'university', name: 'University Partner', status: 'shipped', api: 'GET /v1/global-partner-program/records', notes: 'University Partner.' },
    { id: 'government', name: 'Government Partner', status: 'shipped', api: 'GET /v1/global-partner-program/records', notes: 'Government Partner.' },
    { id: 'ngo', name: 'NGO Partner', status: 'shipped', api: 'GET /v1/global-partner-program/records', notes: 'NGO Partner.' },
    { id: 'research_lab', name: 'Research Lab', status: 'shipped', api: 'GET /v1/global-partner-program/records', notes: 'Research Lab.' },
    { id: 'technology_partner', name: 'Technology Partner', status: 'shipped', api: 'GET /v1/global-partner-program/records', notes: 'Technology Partner.' },
    { id: 'cloud_provider', name: 'Cloud Provider', status: 'shipped', api: 'GET /v1/global-partner-program/records', notes: 'Cloud Provider.' },
    { id: 'language_institute', name: 'Language Institute', status: 'shipped', api: 'GET /v1/global-partner-program/records', notes: 'Language Institute.' }
  ];
}

export function globalPartnerProgramRoutesTo() {
  return [
    { module: 'global-ai-standards', path: '/v1/global-ai-standards/products', role: 'VGAS Foundation' },
    { module: 'corporate-operating-system', path: '/v1/corporate-operating-system/products', role: 'VCOS (Vol 21)' },
    { module: 'ai-governance-platform', path: '/v1/ai-governance-platform/engine', role: 'AI Governance (Vol 15)' },
  ];
}
