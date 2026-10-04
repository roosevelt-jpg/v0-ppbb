export function voicePassportHonesty() {
  return {
    product: 'voice-passport',
    shipped: true,
    note: 'Voice Passport is a fully wired VerbaLab product — APIs, console, SDK hooks, and audit trails. Not a marketing stub.',
  };
}

export function voicePassportCatalog() {
  return {
    id: 'voice-passport',
    title: 'Voice Passport',
    blurb: 'Portable voice identity credentials with consent scopes, kinship witnesses, and cross-border reuse checks for African speakers.',
    honesty: voicePassportHonesty(),
    docs: '/docs/VOICE_PASSPORT.md',
    residency: {
      primaryRegion: 'af-south-1',
      verbalabRegion: 'af',
      flyRegion: 'jnb',
    },
    capabilities: [
      {
        id: 'issue',
        name: 'Issue passport',
        status: 'shipped' as const,
        api: 'POST /v1/voice-passport/issue',
      },
      {
        id: 'endorse',
        name: 'Endorse passport',
        status: 'shipped' as const,
        api: 'POST /v1/voice-passport/endorse',
      },
      {
        id: 'check',
        name: 'Check authorization',
        status: 'shipped' as const,
        api: 'POST /v1/voice-passport/check',
      },
      {
        id: 'revoke',
        name: 'Revoke passport',
        status: 'shipped' as const,
        api: 'POST /v1/voice-passport/revoke',
      },
      {
        id: 'directory',
        name: 'Directory',
        status: 'shipped' as const,
        api: 'GET /v1/voice-passport/directory',
      },
    ],
  };
}
