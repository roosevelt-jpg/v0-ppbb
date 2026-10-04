export function sovereignVoiceOsHonesty() {
  return {
    product: 'sovereign-voice-os',
    shipped: true,
    note: "Shipped orchestration over five VerbaLab pillars. Not a replacement for national PKI, telecom SBCs, or clinical EHR systems.",
  };
}

export function sovereignVoiceOsCatalog() {
  return {
    id: 'sovereign-voice-os',
    title: "Sovereign Voice OS",
    blurb: "Umbrella operating system for governments and enterprises \u2014 National Runtime, Evidence Chain, Mutual-Intelligibility, Institutional Voice, and Offline Mesh in one control plane.",
    honesty: sovereignVoiceOsHonesty(),
    docs: '/docs/SOVEREIGN_VOICE_OS.md',
    capabilities: [
        { id: 'engine', name: 'OS engine + pillar status', status: 'shipped' as const, api: 'GET /v1/sovereign-voice-os/engine' },
        { id: 'readiness', name: 'Buyer readiness checklist', status: 'shipped' as const, api: 'GET /v1/sovereign-voice-os/readiness' },
        { id: 'compose', name: 'Compose deployment recipe', status: 'shipped' as const, api: 'POST /v1/sovereign-voice-os/compose' },
        { id: 'pillars', name: 'List pillars', status: 'shipped' as const, api: 'GET /v1/sovereign-voice-os/pillars' }
    ],
  };
}
