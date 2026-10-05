export function civicVoiceSealHonesty() {
  return {
    product: 'civic-voice-seal',
    shipped: true,
    note: 'Civic Voice Seal is a VerbaLab frontier product — fully wired APIs and console, not a marketing façade.',
  };
}

export function civicVoiceSealCatalog() {
  return {
    id: 'civic-voice-seal',
    title: 'Civic Voice Seal',
    blurb: "Verifiable seal for public voices — authentic now, or synthetic/revoked — checked in under a second on a listener device.",
    honesty: civicVoiceSealHonesty(),
    docs: '/docs/CIVIC_VOICE_SEAL.md',
    capabilities: [
        { id: 'issue', name: 'Issue civic voice seal', status: 'shipped' as const, api: 'POST /v1/civic-voice-seal/issue' },
        { id: 'verify', name: 'Verify seal in <1s path', status: 'shipped' as const, api: 'POST /v1/civic-voice-seal/verify' },
        { id: 'challenge', name: 'Continuous challenge', status: 'shipped' as const, api: 'POST /v1/civic-voice-seal/challenge' },
        { id: 'revoke-seal', name: 'Revoke public seal', status: 'shipped' as const, api: 'POST /v1/civic-voice-seal/revoke' },
        { id: 'directory', name: 'Public seal directory', status: 'shipped' as const, api: 'GET /v1/civic-voice-seal/directory' },
    ],
  };
}
