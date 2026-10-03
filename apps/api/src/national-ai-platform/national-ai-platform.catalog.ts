import { dcivHonesty } from '../dciv-store/dciv-honesty';

export function nationalAiPlatformHonesty() {
  return dcivHonesty();
}

export function nationalAiPlatformCapabilities() {
  return [
    { id: 'national_language', name: 'National Language Pack', status: 'shipped', api: 'GET /v1/national-ai-platform/records', notes: 'National Language Pack.' },
    { id: 'gov_translation', name: 'Government Translation Service', status: 'shipped', api: 'GET /v1/national-ai-platform/records', notes: 'Government Translation Service.' },
    { id: 'parliament', name: 'Parliament Translation Desk', status: 'shipped', api: 'GET /v1/national-ai-platform/records', notes: 'Parliament Translation Desk.' },
    { id: 'courts', name: 'Courts Translation Desk (demo)', status: 'shipped', api: 'GET /v1/national-ai-platform/records', notes: 'Courts Translation Desk (demo).' },
    { id: 'immigration', name: 'Immigration Services Desk (demo)', status: 'shipped', api: 'GET /v1/national-ai-platform/records', notes: 'Immigration Services Desk (demo).' },
    { id: 'healthcare_public', name: 'Public Healthcare Translation', status: 'shipped', api: 'GET /v1/national-ai-platform/records', notes: 'Public Healthcare Translation.' },
    { id: 'education_public', name: 'Public Education Translation', status: 'shipped', api: 'GET /v1/national-ai-platform/records', notes: 'Public Education Translation.' },
    { id: 'emergency_services', name: 'Emergency Services Desk (demo)', status: 'shipped', api: 'GET /v1/national-ai-platform/records', notes: 'Emergency Services Desk (demo).' },
    { id: 'police', name: 'Police Services Desk (demo)', status: 'shipped', api: 'GET /v1/national-ai-platform/records', notes: 'Police Services Desk (demo).' },
    { id: 'military', name: 'Military Liaison Desk (demo)', status: 'shipped', api: 'GET /v1/national-ai-platform/records', notes: 'Military Liaison Desk (demo).' },
    { id: 'tourism', name: 'Tourism Services', status: 'shipped', api: 'GET /v1/national-ai-platform/records', notes: 'Tourism Services.' },
    { id: 'digital_identity', name: 'Digital Identity Portal (demo)', status: 'shipped', api: 'GET /v1/national-ai-platform/records', notes: 'Digital Identity Portal (demo).' },
    { id: 'citizen_portal', name: 'Citizen Portal (demo)', status: 'shipped', api: 'GET /v1/national-ai-platform/records', notes: 'Citizen Portal (demo).' },
    { id: 'national_archive', name: 'National Archives Connector', status: 'shipped', api: 'GET /v1/national-ai-platform/records', notes: 'National Archives Connector.' }
  ];
}

export function nationalAiPlatformRoutesTo() {
  return [
    { module: 'digital-civilization', path: '/v1/digital-civilization/products', role: 'DCIV Foundation' },
    { module: 'ai-economy', path: '/v1/ai-economy/products', role: 'AIE (Vol 23)' },
    { module: 'global-ai-standards', path: '/v1/global-ai-standards/products', role: 'VGAS (Vol 22)' },
  ];
}
