export function offlineMeshVoiceHonesty() {
  return {
    product: 'offline-mesh-voice',
    shipped: true,
    note: "Shipped mesh node registry, store-and-forward queue, and sync receipts. On-device model binaries still require Edge Offline packs; this module is the mesh control plane.",
  };
}

export function offlineMeshVoiceCatalog() {
  return {
    id: 'offline-mesh-voice',
    title: "Offline Mesh Voice",
    blurb: "Clinic, border, and disaster kits that STT/TTS locally and sync store-and-forward when back online \u2014 no US cloud required on the critical path.",
    honesty: offlineMeshVoiceHonesty(),
    docs: '/docs/OFFLINE_MESH_VOICE.md',
    capabilities: [
        { id: 'register-node', name: 'Register mesh node', status: 'shipped' as const, api: 'POST /v1/offline-mesh-voice/nodes' },
        { id: 'list-nodes', name: 'List nodes', status: 'shipped' as const, api: 'GET /v1/offline-mesh-voice/nodes' },
        { id: 'enqueue', name: 'Enqueue offline job', status: 'shipped' as const, api: 'POST /v1/offline-mesh-voice/queue' },
        { id: 'sync', name: 'Sync when online', status: 'shipped' as const, api: 'POST /v1/offline-mesh-voice/sync' },
        { id: 'receipt', name: 'Sync receipt', status: 'shipped' as const, api: 'GET /v1/offline-mesh-voice/receipts/{id}' }
    ],
  };
}
