export function aiObservabilityHonesty() {
  return {
    sharedRequestIds: true,
    auditTrail: true,
    productMonitoringHubs: true,
    datadogOs: false,
    apmOs: false,
    note:
      'AI Observability aggregates health, audits, and Intelligence/Knowledge product monitoring. Not a Datadog/APM OS.',
  };
}

export function aiObservabilityCatalog() {
  return {
    id: 'ai-observability',
    title: 'AI Observability',
    blurb:
      'Request IDs, audits, health, and product monitoring hubs for Intelligence Cloud — not a third-party APM OS.',
    honesty: aiObservabilityHonesty(),
    docs: '/docs/AI_OBSERVABILITY.md',
    surfaces: [
      { id: 'health', api: 'GET /health', console: null },
      { id: 'metrics-translate', api: 'GET /v1/metrics/translate', console: null },
      { id: 'intelligence-analytics', api: 'GET /v1/intelligence-analytics/monitoring', console: '/intelligence-analytics' },
      { id: 'embedding-cloud', api: 'GET /v1/embedding-cloud/monitoring', console: '/embedding-cloud' },
      { id: 'vector-cloud', api: 'GET /v1/vector-cloud/monitoring', console: '/vector-cloud' },
      { id: 'memory-cloud', api: 'GET /v1/memory-cloud/monitoring', console: '/memory-cloud' },
      { id: 'reasoning-cloud', api: 'GET /v1/reasoning-cloud/monitoring', console: '/reasoning-cloud' },
      { id: 'ai-orchestration', api: 'GET /v1/ai-orchestration/monitoring', console: '/ai-orchestration' },
      { id: 'model-runtime', api: 'GET /v1/model-runtime/monitoring', console: '/model-runtime' },
    ],
  };
}
