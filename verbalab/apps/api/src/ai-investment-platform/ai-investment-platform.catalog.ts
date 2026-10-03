import { aieHonesty } from '../aie-store/aie-honesty';

export function aiInvestmentPlatformHonesty() {
  return aieHonesty();
}

export function aiInvestmentPlatformCapabilities() {
  return [
    { id: 'startup_investment', name: 'Startup Investment Record', status: 'shipped', api: 'GET /v1/ai-investment-platform/records', notes: 'Startup Investment Record.' },
    { id: 'research_investment', name: 'Research Investment Record', status: 'shipped', api: 'GET /v1/ai-investment-platform/records', notes: 'Research Investment Record.' },
    { id: 'university_investment', name: 'University Investment Record', status: 'shipped', api: 'GET /v1/ai-investment-platform/records', notes: 'University Investment Record.' },
    { id: 'government_project', name: 'Government Project Funding Record', status: 'shipped', api: 'GET /v1/ai-investment-platform/records', notes: 'Government Project Funding Record.' },
    { id: 'partner_funding', name: 'Partner Funding Record', status: 'shipped', api: 'GET /v1/ai-investment-platform/records', notes: 'Partner Funding Record.' },
    { id: 'portfolio_snapshot', name: 'Portfolio Snapshot', status: 'shipped', api: 'GET /v1/ai-investment-platform/records', notes: 'Portfolio Snapshot.' },
    { id: 'committee_note', name: 'Investment Committee Note', status: 'shipped', api: 'GET /v1/ai-investment-platform/records', notes: 'Investment Committee Note.' },
    { id: 'dashboard_kpi', name: 'Investment Dashboard KPI', status: 'shipped', api: 'GET /v1/ai-investment-platform/records', notes: 'Investment Dashboard KPI.' }
  ];
}

export function aiInvestmentPlatformRoutesTo() {
  return [
    { module: 'ai-economy', path: '/v1/ai-economy/products', role: 'AIE Foundation' },
    { module: 'global-ai-standards', path: '/v1/global-ai-standards/products', role: 'VGAS (Vol 22)' },
    { module: 'billing', path: '/v1/billing', role: 'Monetization / Stripe (Vol 11)' },
  ];
}
