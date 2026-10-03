import { vgasHonesty } from '../vgas-store/vgas-honesty';

export function referenceArchitecturesHonesty() {
  return vgasHonesty();
}

export function referenceArchitecturesCapabilities() {
  return [
    { id: 'government_ai', name: 'Government AI', status: 'shipped', api: 'GET /v1/reference-architectures/records', notes: 'Government AI.' },
    { id: 'banking_ai', name: 'Banking AI', status: 'shipped', api: 'GET /v1/reference-architectures/records', notes: 'Banking AI.' },
    { id: 'healthcare_ai', name: 'Healthcare AI', status: 'shipped', api: 'GET /v1/reference-architectures/records', notes: 'Healthcare AI.' },
    { id: 'insurance_ai', name: 'Insurance AI', status: 'shipped', api: 'GET /v1/reference-architectures/records', notes: 'Insurance AI.' },
    { id: 'education_ai', name: 'Education AI', status: 'shipped', api: 'GET /v1/reference-architectures/records', notes: 'Education AI.' },
    { id: 'telecom_ai', name: 'Telecommunications AI', status: 'shipped', api: 'GET /v1/reference-architectures/records', notes: 'Telecommunications AI.' },
    { id: 'manufacturing_ai', name: 'Manufacturing AI', status: 'shipped', api: 'GET /v1/reference-architectures/records', notes: 'Manufacturing AI.' },
    { id: 'legal_ai', name: 'Legal AI', status: 'shipped', api: 'GET /v1/reference-architectures/records', notes: 'Legal AI.' },
    { id: 'judiciary_ai', name: 'Judiciary AI', status: 'shipped', api: 'GET /v1/reference-architectures/records', notes: 'Judiciary AI.' },
    { id: 'defense_ai', name: 'Defense AI', status: 'shipped', api: 'GET /v1/reference-architectures/records', notes: 'Defense AI.' },
    { id: 'blueprint', name: 'Reference Blueprint', status: 'shipped', api: 'GET /v1/reference-architectures/records', notes: 'Reference Blueprint.' },
    { id: 'deployment_guide', name: 'Deployment Guide', status: 'shipped', api: 'GET /v1/reference-architectures/records', notes: 'Deployment Guide.' }
  ];
}

export function referenceArchitecturesRoutesTo() {
  return [
    { module: 'global-ai-standards', path: '/v1/global-ai-standards/products', role: 'VGAS Foundation' },
    { module: 'corporate-operating-system', path: '/v1/corporate-operating-system/products', role: 'VCOS (Vol 21)' },
    { module: 'ai-governance-platform', path: '/v1/ai-governance-platform/engine', role: 'AI Governance (Vol 15)' },
  ];
}
