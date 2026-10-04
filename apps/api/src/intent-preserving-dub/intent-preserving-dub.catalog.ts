export function intentPreservingDubHonesty() {
  return {
    product: 'intent-preserving-dub',
    shipped: true,
    note: 'Intent-Preserving Dub is a VerbaLab frontier product — fully wired APIs and console, not a marketing façade.',
  };
}

export function intentPreservingDubCatalog() {
  return {
    id: 'intent-preserving-dub',
    title: 'Intent-Preserving Dub',
    blurb: "Dub that preserves joke timing, insult severity, prayer register, gender norms, and power distance — social effect, not word overlap.",
    honesty: intentPreservingDubHonesty(),
    docs: '/docs/INTENT_PRESERVING_DUB.md',
    capabilities: [
        { id: 'analyze', name: 'Pragmatic intent analysis', status: 'shipped' as const, api: 'POST /v1/intent-preserving-dub/analyze' },
        { id: 'dub', name: 'Intent-preserving dub render', status: 'shipped' as const, api: 'POST /v1/intent-preserving-dub/dub' },
        { id: 'score', name: 'Social-effect score', status: 'shipped' as const, api: 'POST /v1/intent-preserving-dub/score' },
        { id: 'profiles', name: 'Register / culture profiles', status: 'shipped' as const, api: 'GET /v1/intent-preserving-dub/profiles' },
    ],
  };
}
