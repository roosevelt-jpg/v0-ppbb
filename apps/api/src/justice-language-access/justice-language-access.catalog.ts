export function justiceLanguageAccessHonesty() {
  return {
    product: 'justice-language-access',
    shipped: true,
    note:
      'Justice Language Access helps courts and legal aid defend people facing language barriers — dual-language briefs, rights plain summaries, and interpreter handoffs. Not a substitute for a licensed advocate.',
  };
}

export function justiceLanguageAccessCatalog() {
  return {
    id: 'justice-language-access',
    title: 'Justice Language Access',
    blurb:
      'Give defendants and witnesses a fair hearing — ingest testimony in their language, produce court-language briefs, and plain-language rights summaries.',
    honesty: justiceLanguageAccessHonesty(),
    docs: '/docs/JUSTICE_LANGUAGE_ACCESS.md',
    residency: { primaryRegion: 'af-south-1', verbalabRegion: 'af', flyRegion: 'jnb' },
    capabilities: [
      {
        id: 'ingest',
        name: 'Ingest testimony',
        status: 'shipped' as const,
        api: 'POST /v1/justice-language-access/ingest',
      },
      {
        id: 'brief',
        name: 'Build dual-language defense brief',
        status: 'shipped' as const,
        api: 'POST /v1/justice-language-access/brief',
      },
      {
        id: 'rights',
        name: 'Plain-language rights summary',
        status: 'shipped' as const,
        api: 'POST /v1/justice-language-access/rights',
      },
      {
        id: 'cases',
        name: 'List case dockets',
        status: 'shipped' as const,
        api: 'GET /v1/justice-language-access/cases',
      },
    ],
  };
}
