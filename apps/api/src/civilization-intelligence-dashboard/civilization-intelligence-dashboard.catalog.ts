import { dcivHonesty } from '../dciv-store/dciv-honesty';

export function civilizationIntelligenceDashboardHonesty() {
  return dcivHonesty();
}

export function civilizationIntelligenceDashboardCapabilities() {
  return [
    { id: 'country_metric', name: 'Country Adoption Metric', status: 'shipped', api: 'GET /v1/civilization-intelligence-dashboard/records', notes: 'Country Adoption Metric.' },
    { id: 'language_metric', name: 'Language Coverage Metric', status: 'shipped', api: 'GET /v1/civilization-intelligence-dashboard/records', notes: 'Language Coverage Metric.' },
    { id: 'dialect_metric', name: 'Dialect Coverage Metric', status: 'shipped', api: 'GET /v1/civilization-intelligence-dashboard/records', notes: 'Dialect Coverage Metric.' },
    { id: 'model_metric', name: 'Model Deployment Metric', status: 'shipped', api: 'GET /v1/civilization-intelligence-dashboard/records', notes: 'Model Deployment Metric.' },
    { id: 'knowledge_metric', name: 'Knowledge Network Metric', status: 'shipped', api: 'GET /v1/civilization-intelligence-dashboard/records', notes: 'Knowledge Network Metric.' },
    { id: 'translation_metric', name: 'Translation Volume Metric', status: 'shipped', api: 'GET /v1/civilization-intelligence-dashboard/records', notes: 'Translation Volume Metric.' },
    { id: 'economic_impact', name: 'Economic Impact Metric', status: 'shipped', api: 'GET /v1/civilization-intelligence-dashboard/records', notes: 'Economic Impact Metric.' },
    { id: 'research_metric', name: 'Research Metric', status: 'shipped', api: 'GET /v1/civilization-intelligence-dashboard/records', notes: 'Research Metric.' },
    { id: 'education_metric', name: 'Education Metric', status: 'shipped', api: 'GET /v1/civilization-intelligence-dashboard/records', notes: 'Education Metric.' },
    { id: 'healthcare_metric', name: 'Healthcare Metric', status: 'shipped', api: 'GET /v1/civilization-intelligence-dashboard/records', notes: 'Healthcare Metric.' }
  ];
}

export function civilizationIntelligenceDashboardRoutesTo() {
  return [
    { module: 'digital-civilization', path: '/v1/digital-civilization/products', role: 'DCIV Foundation' },
    { module: 'ai-economy', path: '/v1/ai-economy/products', role: 'AIE (Vol 23)' },
    { module: 'global-ai-standards', path: '/v1/global-ai-standards/products', role: 'VGAS (Vol 22)' },
  ];
}
