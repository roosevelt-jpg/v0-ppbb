import { aieHonesty } from '../aie-store/aie-honesty';

export function aiTalentPlatformHonesty() {
  return aieHonesty();
}

export function aiTalentPlatformCapabilities() {
  return [
    { id: 'linguist', name: 'Linguist Profile', status: 'shipped', api: 'GET /v1/ai-talent-platform/records', notes: 'Linguist Profile.' },
    { id: 'voice_artist', name: 'Voice Artist Profile', status: 'shipped', api: 'GET /v1/ai-talent-platform/records', notes: 'Voice Artist Profile.' },
    { id: 'translator', name: 'Translator Profile', status: 'shipped', api: 'GET /v1/ai-talent-platform/records', notes: 'Translator Profile.' },
    { id: 'annotator', name: 'Annotator Profile', status: 'shipped', api: 'GET /v1/ai-talent-platform/records', notes: 'Annotator Profile.' },
    { id: 'researcher', name: 'Researcher Profile', status: 'shipped', api: 'GET /v1/ai-talent-platform/records', notes: 'Researcher Profile.' },
    { id: 'developer', name: 'Developer Profile', status: 'shipped', api: 'GET /v1/ai-talent-platform/records', notes: 'Developer Profile.' },
    { id: 'engagement', name: 'Talent Engagement', status: 'shipped', api: 'GET /v1/ai-talent-platform/records', notes: 'Talent Engagement.' },
    { id: 'assignment', name: 'Work Assignment', status: 'shipped', api: 'GET /v1/ai-talent-platform/records', notes: 'Work Assignment.' }
  ];
}

export function aiTalentPlatformRoutesTo() {
  return [
    { module: 'ai-economy', path: '/v1/ai-economy/products', role: 'AIE Foundation' },
    { module: 'global-ai-standards', path: '/v1/global-ai-standards/products', role: 'VGAS (Vol 22)' },
    { module: 'billing', path: '/v1/billing', role: 'Monetization / Stripe (Vol 11)' },
  ];
}
