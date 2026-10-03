import { aiInternetHonesty } from '../ai-internet-store/ai-internet-honesty';

export function aidiscoveryCatalog() {
  return {
    id: 'ai-discovery',
    title: 'AI Discovery',
    vl: 'Shipped.',
    phase: 264,
    domain: 'discovery',
    blurb: 'Service discovery, capability registry, and resource discovery for VerbaLab nodes.',
    honesty: aiInternetHonesty(),
  };
}

export function aidiscoveryCapabilities() {
  return [
    { id: 'service', name: 'Service discovery entry', status: 'wired', api: 'GET /v1/ai-discovery/engine', console: '/ai-discovery' },
    { id: 'capability', name: 'Capability registry entry', status: 'wired', api: 'GET /v1/ai-discovery/engine', console: '/ai-discovery' },
    { id: 'resource', name: 'Resource discovery entry', status: 'wired', api: 'GET /v1/ai-discovery/engine', console: '/ai-discovery' },
    { id: 'announce', name: 'Announce capability', status: 'wired', api: 'GET /v1/ai-discovery/engine', console: '/ai-discovery' },
  ];
}
