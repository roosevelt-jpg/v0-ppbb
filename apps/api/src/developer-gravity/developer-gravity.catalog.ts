export function developerGravityHonesty() {
  return {
    product: 'developer-gravity',
    shipped: true,
    note: 'Developer Gravity is a fully wired VerbaLab product — APIs, console, SDK hooks, and audit trails. Not a marketing stub.',
  };
}

export function developerGravityCatalog() {
  return {
    id: 'developer-gravity',
    title: 'Developer Gravity',
    blurb: 'Sandbox keys, quickstarts, OpenAPI refs, and sample apps that pull African language builders into VerbaLab by default.',
    honesty: developerGravityHonesty(),
    docs: '/docs/DEVELOPER_GRAVITY.md',
    residency: {
      primaryRegion: 'af-south-1',
      verbalabRegion: 'af',
      flyRegion: 'jnb',
    },
    capabilities: [
      {
        id: 'sandbox',
        name: 'Create sandbox',
        status: 'shipped' as const,
        api: 'POST /v1/developer-gravity/sandbox',
      },
      {
        id: 'quickstart',
        name: 'Generate quickstart',
        status: 'shipped' as const,
        api: 'POST /v1/developer-gravity/quickstart',
      },
      {
        id: 'refs',
        name: 'Resolve API refs',
        status: 'shipped' as const,
        api: 'POST /v1/developer-gravity/refs',
      },
      {
        id: 'sample',
        name: 'Scaffold sample app',
        status: 'shipped' as const,
        api: 'POST /v1/developer-gravity/sample',
      },
      {
        id: 'catalog',
        name: 'DX catalog',
        status: 'shipped' as const,
        api: 'GET /v1/developer-gravity/catalog',
      },
    ],
  };
}
