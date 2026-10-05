export function industryDropsHonesty() {
  return {
    product: 'industry-drops',
    shipped: true,
    note: 'Industry Drops is a fully wired VerbaLab product — APIs, console, SDK hooks, and audit trails. Not a marketing stub.',
  };
}

export function industryDropsCatalog() {
  return {
    id: 'industry-drops',
    title: 'Industry Drops',
    blurb: 'Ready vertical packs — banking, healthcare, government, telco, agri — with prompts, glossaries, eval gates, and residency defaults.',
    honesty: industryDropsHonesty(),
    docs: '/docs/INDUSTRY_DROPS.md',
    residency: {
      primaryRegion: 'af-south-1',
      verbalabRegion: 'af',
      flyRegion: 'jnb',
    },
    capabilities: [
      {
        id: 'install',
        name: 'Install drop',
        status: 'shipped' as const,
        api: 'POST /v1/industry-drops/install',
      },
      {
        id: 'configure',
        name: 'Configure drop',
        status: 'shipped' as const,
        api: 'POST /v1/industry-drops/configure',
      },
      {
        id: 'evaluate',
        name: 'Run drop eval gate',
        status: 'shipped' as const,
        api: 'POST /v1/industry-drops/evaluate',
      },
      {
        id: 'export',
        name: 'Export drop manifest',
        status: 'shipped' as const,
        api: 'POST /v1/industry-drops/export',
      },
      {
        id: 'packs',
        name: 'List packs',
        status: 'shipped' as const,
        api: 'GET /v1/industry-drops/packs',
      },
    ],
  };
}
