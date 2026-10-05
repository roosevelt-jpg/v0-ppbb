export function dialectContinuumHonesty() {
  return {
    product: 'dialect-continuum',
    shipped: true,
    note: 'Dialect Continuum Engine is a VerbaLab frontier product — fully wired APIs and console, not a marketing façade.',
  };
}

export function dialectContinuumCatalog() {
  return {
    id: 'dialect-continuum',
    title: 'Dialect Continuum Engine',
    blurb: "Tracks code-switching and dialect drift mid-utterance — Maghrebi Arabic, Pidgin, Sheng, street French — and replies in the right mix.",
    honesty: dialectContinuumHonesty(),
    docs: '/docs/DIALECT_CONTINUUM.md',
    capabilities: [
        { id: 'spectrum-detect', name: 'Dialect spectrum detection', status: 'shipped' as const, api: 'POST /v1/dialect-continuum/detect' },
        { id: 'drift-track', name: 'Mid-turn drift tracking', status: 'shipped' as const, api: 'POST /v1/dialect-continuum/track' },
        { id: 'reply-mix', name: 'Reply-in-mix generation', status: 'shipped' as const, api: 'POST /v1/dialect-continuum/reply' },
        { id: 'continuum-map', name: 'Regional continuum map', status: 'shipped' as const, api: 'GET /v1/dialect-continuum/map' },
    ],
  };
}
