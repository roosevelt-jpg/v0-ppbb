export function voiceTrustGraphHonesty() {
  return {
    product: 'voice-trust-graph',
    shipped: true,
    note: 'Voice Trust Graph is a VerbaLab frontier product — fully wired APIs and console, not a marketing façade.',
  };
}

export function voiceTrustGraphCatalog() {
  return {
    id: 'voice-trust-graph',
    title: 'Voice Trust Graph',
    blurb: "Living consent graph for who may clone whom, for which use, in which country, with kinship witnesses and auto-revocation.",
    honesty: voiceTrustGraphHonesty(),
    docs: '/docs/VOICE_TRUST_GRAPH.md',
    capabilities: [
        { id: 'graph-nodes', name: 'Person and community nodes', status: 'shipped' as const, api: 'POST /v1/voice-trust-graph/nodes' },
        { id: 'consent-edges', name: 'Consent edges with scope', status: 'shipped' as const, api: 'POST /v1/voice-trust-graph/consent' },
        { id: 'witness', name: 'Kinship / community witnesses', status: 'shipped' as const, api: 'POST /v1/voice-trust-graph/witness' },
        { id: 'revoke', name: 'Auto-revocation & lineage', status: 'shipped' as const, api: 'POST /v1/voice-trust-graph/revoke' },
        { id: 'check', name: 'Clone authorization check', status: 'shipped' as const, api: 'POST /v1/voice-trust-graph/check' },
    ],
  };
}
