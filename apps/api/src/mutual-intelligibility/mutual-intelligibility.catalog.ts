export function mutualIntelligibilityHonesty() {
  return {
    product: 'mutual-intelligibility',
    shipped: true,
    note: "Shipped corridor routing + meaning-preserving paraphrase bridges over Own AI translate. Not a claim of trained joint speech encoders for every African language pair.",
  };
}

export function mutualIntelligibilityCatalog() {
  return {
    id: 'mutual-intelligibility',
    title: "African Mutual-Intelligibility Fabric",
    blurb: "Corridor models across ECOWAS, EAC, and SADC \u2014 preserve meaning across dialect continua without English as the mandatory middleman.",
    honesty: mutualIntelligibilityHonesty(),
    docs: '/docs/MUTUAL_INTELLIGIBILITY.md',
    capabilities: [
        { id: 'corridors', name: 'List corridors', status: 'shipped' as const, api: 'GET /v1/mutual-intelligibility/corridors' },
        { id: 'bridge', name: 'Bridge utterance across corridor', status: 'shipped' as const, api: 'POST /v1/mutual-intelligibility/bridge' },
        { id: 'score', name: 'Intelligibility score', status: 'shipped' as const, api: 'POST /v1/mutual-intelligibility/score' },
        { id: 'register', name: 'Register corridor locale', status: 'shipped' as const, api: 'POST /v1/mutual-intelligibility/corridors/{id}/locales' }
    ],
  };
}
