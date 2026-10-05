export function interpreterMeshHonesty() {
  return {
    product: 'interpreter-mesh',
    shipped: true,
    note: 'Interpreter Mesh is a VerbaLab frontier product — fully wired APIs and console, not a marketing façade.',
  };
}

export function interpreterMeshCatalog() {
  return {
    id: 'interpreter-mesh',
    title: 'Interpreter Mesh',
    blurb: "One live session, many listeners — each hears a different language/dialect/register from a shared semantic backbone.",
    honesty: interpreterMeshHonesty(),
    docs: '/docs/INTERPRETER_MESH.md',
    capabilities: [
        { id: 'session', name: 'Mesh session create', status: 'shipped' as const, api: 'POST /v1/interpreter-mesh/sessions' },
        { id: 'listen', name: 'Listener dialect channel', status: 'shipped' as const, api: 'POST /v1/interpreter-mesh/listen' },
        { id: 'broadcast', name: 'Speaker utterance ingest', status: 'shipped' as const, api: 'POST /v1/interpreter-mesh/broadcast' },
        { id: 'backbone', name: 'Shared semantic backbone', status: 'shipped' as const, api: 'GET /v1/interpreter-mesh/backbone' },
    ],
  };
}
