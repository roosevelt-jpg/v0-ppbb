export function nationalVoiceRuntimeHonesty() {
  return {
    product: 'national-voice-runtime',
    shipped: true,
    note: "Shipped control-plane APIs for zone pin, dialect packs, kill-switch, and audit export. Does not migrate historical blobs across islands; pinning without matching VERBALAB_REGION still yields residency_mismatch on live speech routes.",
  };
}

export function nationalVoiceRuntimeCatalog() {
  return {
    id: 'national-voice-runtime',
    title: "National Voice Sovereignty Runtime",
    blurb: "Sealed per-country voice zones \u2014 weights, audio, transcripts, and keys stay in-boundary with ministry kill-switch and audit export.",
    honesty: nationalVoiceRuntimeHonesty(),
    docs: '/docs/NATIONAL_VOICE_RUNTIME.md',
    capabilities: [
        { id: 'create-zone', name: 'Create / pin national zone', status: 'shipped' as const, api: 'POST /v1/national-voice-runtime/zones' },
        { id: 'list-zones', name: 'List zones', status: 'shipped' as const, api: 'GET /v1/national-voice-runtime/zones' },
        { id: 'dialect-pack', name: 'Enable dialect pack', status: 'shipped' as const, api: 'POST /v1/national-voice-runtime/zones/{id}/dialects' },
        { id: 'kill-switch', name: 'Ministry kill-switch', status: 'shipped' as const, api: 'POST /v1/national-voice-runtime/zones/{id}/kill-switch' },
        { id: 'audit-export', name: 'Export sovereignty audit', status: 'shipped' as const, api: 'POST /v1/national-voice-runtime/zones/{id}/audit-export' },
        { id: 'status', name: 'Zone status', status: 'shipped' as const, api: 'GET /v1/national-voice-runtime/zones/{id}' }
    ],
  };
}
