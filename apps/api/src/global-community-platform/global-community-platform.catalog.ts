import { aieHonesty } from '../aie-store/aie-honesty';

export function globalCommunityPlatformHonesty() {
  return aieHonesty();
}

export function globalCommunityPlatformCapabilities() {
  return [
    { id: 'forum', name: 'Forum', status: 'shipped', api: 'GET /v1/global-community-platform/records', notes: 'Forum.' },
    { id: 'event', name: 'Event', status: 'shipped', api: 'GET /v1/global-community-platform/records', notes: 'Event.' },
    { id: 'hackathon', name: 'Hackathon', status: 'shipped', api: 'GET /v1/global-community-platform/records', notes: 'Hackathon.' },
    { id: 'research_challenge', name: 'Research Challenge', status: 'shipped', api: 'GET /v1/global-community-platform/records', notes: 'Research Challenge.' },
    { id: 'open_source', name: 'Open Source Project', status: 'shipped', api: 'GET /v1/global-community-platform/records', notes: 'Open Source Project.' },
    { id: 'developer_community', name: 'Developer Community', status: 'shipped', api: 'GET /v1/global-community-platform/records', notes: 'Developer Community.' },
    { id: 'language_community', name: 'Language Community', status: 'shipped', api: 'GET /v1/global-community-platform/records', notes: 'Language Community.' },
    { id: 'meetup', name: 'Meetup', status: 'shipped', api: 'GET /v1/global-community-platform/records', notes: 'Meetup.' }
  ];
}

export function globalCommunityPlatformRoutesTo() {
  return [
    { module: 'ai-economy', path: '/v1/ai-economy/products', role: 'AIE Foundation' },
    { module: 'global-ai-standards', path: '/v1/global-ai-standards/products', role: 'VGAS (Vol 22)' },
    { module: 'billing', path: '/v1/billing', role: 'Monetization / Stripe (Vol 11)' },
  ];
}
