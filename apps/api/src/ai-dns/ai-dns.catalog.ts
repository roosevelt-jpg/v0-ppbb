import { aiInternetHonesty } from '../ai-internet-store/ai-internet-honesty';

export function aidnsCatalog() {
  return {
    id: 'ai-dns',
    title: 'AI DNS',
    vl: 'Shipped.',
    phase: 262,
    domain: 'dns',
    blurb: 'Name resolution for AI services, models, and agent endpoints.',
    honesty: aiInternetHonesty(),
  };
}

export function aidnsCapabilities() {
  return [
    { id: 'record', name: 'AI name record', status: 'wired', api: 'GET /v1/ai-dns/engine', console: '/ai-dns' },
    { id: 'resolve', name: 'Resolve AI name', status: 'wired', api: 'GET /v1/ai-dns/engine', console: '/ai-dns' },
    { id: 'zone', name: 'AI zone', status: 'wired', api: 'GET /v1/ai-dns/engine', console: '/ai-dns' },
    { id: 'alias', name: 'Service alias', status: 'wired', api: 'GET /v1/ai-dns/engine', console: '/ai-dns' },
  ];
}
