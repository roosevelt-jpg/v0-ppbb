export function civicTruthGuardHonesty() {
  return {
    product: 'civic-truth-guard',
    shipped: true,
    note:
      'Civic Truth Guard helps assess viral voice/news claims for synthetic signals and seal authenticity. It is an integrity assistant — not a ministry of truth or automatic takedown authority.',
  };
}

export function civicTruthGuardCatalog() {
  return {
    id: 'civic-truth-guard',
    title: 'Civic Truth Guard',
    blurb:
      'Fight fake news and deepfake voice online — assess claims, verify civic seals, score synthetic risk, and publish shareable authenticity reports.',
    honesty: civicTruthGuardHonesty(),
    docs: '/docs/CIVIC_TRUTH_GUARD.md',
    residency: { primaryRegion: 'af-south-1', verbalabRegion: 'af', flyRegion: 'jnb' },
    capabilities: [
      {
        id: 'assess',
        name: 'Assess claim / clip risk',
        status: 'shipped' as const,
        api: 'POST /v1/civic-truth-guard/assess',
      },
      {
        id: 'verify-seal',
        name: 'Verify civic voice seal',
        status: 'shipped' as const,
        api: 'POST /v1/civic-truth-guard/verify-seal',
      },
      {
        id: 'report',
        name: 'Publish authenticity report',
        status: 'shipped' as const,
        api: 'POST /v1/civic-truth-guard/report',
      },
      {
        id: 'signals',
        name: 'Integrity signal catalog',
        status: 'shipped' as const,
        api: 'GET /v1/civic-truth-guard/signals',
      },
    ],
  };
}
