export function civicVoiceEvidenceHonesty() {
  return {
    product: 'civic-voice-evidence',
    shipped: true,
    note: "Shipped in-process evidence ledger with SHA-256 chaining and export packages. Not a public blockchain or eIDAS QTSP; durability is process-local unless wired to durable storage.",
  };
}

export function civicVoiceEvidenceCatalog() {
  return {
    id: 'civic-voice-evidence',
    title: "Civic Voice Evidence Chain",
    blurb: "Append-only hash chain for official and contact-center utterances \u2014 consent, watermark tip, and court-exportable provenance.",
    honesty: civicVoiceEvidenceHonesty(),
    docs: '/docs/CIVIC_VOICE_EVIDENCE.md',
    capabilities: [
        { id: 'append', name: 'Append utterance evidence', status: 'shipped' as const, api: 'POST /v1/civic-voice-evidence/append' },
        { id: 'verify', name: 'Verify chain integrity', status: 'shipped' as const, api: 'POST /v1/civic-voice-evidence/verify' },
        { id: 'export', name: 'Court export package', status: 'shipped' as const, api: 'POST /v1/civic-voice-evidence/export' },
        { id: 'get', name: 'Get evidence record', status: 'shipped' as const, api: 'GET /v1/civic-voice-evidence/{id}' },
        { id: 'chain', name: 'List chain tip', status: 'shipped' as const, api: 'GET /v1/civic-voice-evidence/chain' }
    ],
  };
}
