export function complianceAttestationsHonesty() {
  return {
    product: 'compliance-attestations',
    shipped: true,
    note: 'Compliance Attestations is a fully wired VerbaLab product — APIs, console, SDK hooks, and audit trails. Not a marketing stub.',
  };
}

export function complianceAttestationsCatalog() {
  return {
    id: 'compliance-attestations',
    title: 'Compliance Attestations',
    blurb: 'Industry DPA packs, residency attestations, and auditor-ready evidence exports for African and global regulated buyers.',
    honesty: complianceAttestationsHonesty(),
    docs: '/docs/COMPLIANCE_ATTESTATIONS.md',
    residency: {
      primaryRegion: 'af-south-1',
      verbalabRegion: 'af',
      flyRegion: 'jnb',
    },
    capabilities: [
      {
        id: 'issue',
        name: 'Issue attestation',
        status: 'shipped' as const,
        api: 'POST /v1/compliance-attestations/issue',
      },
      {
        id: 'verify',
        name: 'Verify attestation',
        status: 'shipped' as const,
        api: 'POST /v1/compliance-attestations/verify',
      },
      {
        id: 'dpa',
        name: 'Generate industry DPA',
        status: 'shipped' as const,
        api: 'POST /v1/compliance-attestations/dpa',
      },
      {
        id: 'evidence',
        name: 'Export evidence pack',
        status: 'shipped' as const,
        api: 'POST /v1/compliance-attestations/evidence',
      },
      {
        id: 'frameworks',
        name: 'List frameworks',
        status: 'shipped' as const,
        api: 'GET /v1/compliance-attestations/frameworks',
      },
      {
        id: 'industries',
        name: 'List industries',
        status: 'shipped' as const,
        api: 'GET /v1/compliance-attestations/industries',
      },
    ],
  };
}
