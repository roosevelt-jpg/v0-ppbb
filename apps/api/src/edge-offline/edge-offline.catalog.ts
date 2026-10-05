export function edgeOfflineHonesty() {
  return {
    product: 'edge-offline',
    shipped: true,
    note: 'Edge Offline Packs is a fully wired VerbaLab product — APIs, console, SDK hooks, and audit trails. Not a marketing stub.',
  };
}

export function edgeOfflineCatalog() {
  return {
    id: 'edge-offline',
    title: 'Edge Offline Packs',
    blurb: 'Ship Echo STT and Voice FM packs for offline/edge devices — signed manifests, locale bundles, and sync when back online.',
    honesty: edgeOfflineHonesty(),
    docs: '/docs/EDGE_OFFLINE.md',
    residency: {
      primaryRegion: 'af-south-1',
      verbalabRegion: 'af',
      flyRegion: 'jnb',
    },
    capabilities: [
      {
        id: 'build',
        name: 'Build offline pack',
        status: 'shipped' as const,
        api: 'POST /v1/edge-offline/build',
      },
      {
        id: 'sign',
        name: 'Sign pack',
        status: 'shipped' as const,
        api: 'POST /v1/edge-offline/sign',
      },
      {
        id: 'sync',
        name: 'Sync pack delta',
        status: 'shipped' as const,
        api: 'POST /v1/edge-offline/sync',
      },
      {
        id: 'verify',
        name: 'Verify pack integrity',
        status: 'shipped' as const,
        api: 'POST /v1/edge-offline/verify',
      },
      {
        id: 'catalog',
        name: 'Pack catalog',
        status: 'shipped' as const,
        api: 'GET /v1/edge-offline/catalog',
      },
    ],
  };
}
