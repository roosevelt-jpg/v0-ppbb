import { aiInternetHonesty } from '../ai-internet-store/ai-internet-honesty';

export function credentialsreadinessCatalog() {
  return {
    id: 'credentials-readiness',
    title: 'Credentials Readiness',
    vl: 'Shipped.',
    phase: 275,
    domain: 'credentials',
    blurb: 'Production credentials checklist — Stripe, Clerk, VerbaLab model endpoints added later.',
    honesty: aiInternetHonesty(),
  };
}

export function credentialsreadinessCapabilities() {
  return [
    { id: 'stripe', name: 'Stripe keys', status: 'wired', api: 'GET /v1/credentials-readiness/engine', console: '/credentials-readiness' },
    { id: 'clerk', name: 'Clerk keys', status: 'wired', api: 'GET /v1/credentials-readiness/engine', console: '/credentials-readiness' },
    { id: 'verbalab_models', name: 'VerbaLab model endpoints', status: 'wired', api: 'GET /v1/credentials-readiness/engine', console: '/credentials-readiness' },
    { id: 'fly', name: 'Fly deploy token', status: 'wired', api: 'GET /v1/credentials-readiness/engine', console: '/credentials-readiness' },
  ];
}
