import { dcivHonesty } from '../dciv-store/dciv-honesty';

export function globalAiFederationHonesty() {
  return dcivHonesty();
}

export function globalAiFederationCapabilities() {
  return [
    { id: 'federated_ai', name: 'Federated AI Node', status: 'shipped', api: 'GET /v1/global-ai-federation/records', notes: 'Federated AI Node.' },
    { id: 'federated_learning', name: 'Federated Learning Job', status: 'shipped', api: 'GET /v1/global-ai-federation/records', notes: 'Federated Learning Job.' },
    { id: 'federated_knowledge', name: 'Federated Knowledge Share', status: 'shipped', api: 'GET /v1/global-ai-federation/records', notes: 'Federated Knowledge Share.' },
    { id: 'cross_border', name: 'Cross-border Collaboration', status: 'shipped', api: 'GET /v1/global-ai-federation/records', notes: 'Cross-border Collaboration.' },
    { id: 'cross_cloud', name: 'Cross-cloud Collaboration', status: 'shipped', api: 'GET /v1/global-ai-federation/records', notes: 'Cross-cloud Collaboration.' },
    { id: 'ai_collaboration', name: 'AI Collaboration Workspace', status: 'shipped', api: 'GET /v1/global-ai-federation/records', notes: 'AI Collaboration Workspace.' },
    { id: 'national_ai_node', name: 'National AI Node Registry', status: 'shipped', api: 'GET /v1/global-ai-federation/records', notes: 'National AI Node Registry.' }
  ];
}

export function globalAiFederationRoutesTo() {
  return [
    { module: 'digital-civilization', path: '/v1/digital-civilization/products', role: 'DCIV Foundation' },
    { module: 'ai-economy', path: '/v1/ai-economy/products', role: 'AIE (Vol 23)' },
    { module: 'global-ai-standards', path: '/v1/global-ai-standards/products', role: 'VGAS (Vol 22)' },
  ];
}
