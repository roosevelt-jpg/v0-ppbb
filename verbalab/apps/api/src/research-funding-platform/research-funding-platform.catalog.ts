import { aieHonesty } from '../aie-store/aie-honesty';

export function researchFundingPlatformHonesty() {
  return aieHonesty();
}

export function researchFundingPlatformCapabilities() {
  return [
    { id: 'grant', name: 'Grant', status: 'shipped', api: 'GET /v1/research-funding-platform/records', notes: 'Grant.' },
    { id: 'scholarship', name: 'Scholarship', status: 'shipped', api: 'GET /v1/research-funding-platform/records', notes: 'Scholarship.' },
    { id: 'innovation_fund', name: 'Innovation Funding', status: 'shipped', api: 'GET /v1/research-funding-platform/records', notes: 'Innovation Funding.' },
    { id: 'research_award', name: 'Research Award', status: 'shipped', api: 'GET /v1/research-funding-platform/records', notes: 'Research Award.' },
    { id: 'university_funding', name: 'University Funding', status: 'shipped', api: 'GET /v1/research-funding-platform/records', notes: 'University Funding.' },
    { id: 'startup_funding', name: 'Startup Funding Track', status: 'shipped', api: 'GET /v1/research-funding-platform/records', notes: 'Startup Funding Track.' },
    { id: 'application', name: 'Funding Application', status: 'shipped', api: 'GET /v1/research-funding-platform/records', notes: 'Funding Application.' },
    { id: 'milestone', name: 'Funding Milestone', status: 'shipped', api: 'GET /v1/research-funding-platform/records', notes: 'Funding Milestone.' }
  ];
}

export function researchFundingPlatformRoutesTo() {
  return [
    { module: 'ai-economy', path: '/v1/ai-economy/products', role: 'AIE Foundation' },
    { module: 'global-ai-standards', path: '/v1/global-ai-standards/products', role: 'VGAS (Vol 22)' },
    { module: 'billing', path: '/v1/billing', role: 'Monetization / Stripe (Vol 11)' },
  ];
}
