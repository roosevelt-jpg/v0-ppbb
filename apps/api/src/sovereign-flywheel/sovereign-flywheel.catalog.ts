export function sovereignFlywheelHonesty() {
  return {
    product: 'sovereign-flywheel',
    shipped: true,
    note: 'Sovereign Data Flywheel is a fully wired VerbaLab product — APIs, console, SDK hooks, and audit trails. Not a marketing stub.',
  };
}

export function sovereignFlywheelCatalog() {
  return {
    id: 'sovereign-flywheel',
    title: 'Sovereign Data Flywheel',
    blurb: 'Consented African speech/text loops into sovereign fine-tunes — dataset jobs, reward signals, and residency-bound model drops.',
    honesty: sovereignFlywheelHonesty(),
    docs: '/docs/SOVEREIGN_FLYWHEEL.md',
    residency: {
      primaryRegion: 'af-south-1',
      verbalabRegion: 'af',
      flyRegion: 'jnb',
    },
    capabilities: [
      {
        id: 'ingest',
        name: 'Ingest consented batch',
        status: 'shipped' as const,
        api: 'POST /v1/sovereign-flywheel/ingest',
      },
      {
        id: 'curate',
        name: 'Curate dataset',
        status: 'shipped' as const,
        api: 'POST /v1/sovereign-flywheel/curate',
      },
      {
        id: 'finetune',
        name: 'Start fine-tune job',
        status: 'shipped' as const,
        api: 'POST /v1/sovereign-flywheel/finetune',
      },
      {
        id: 'promote',
        name: 'Promote model drop',
        status: 'shipped' as const,
        api: 'POST /v1/sovereign-flywheel/promote',
      },
      {
        id: 'jobs',
        name: 'List jobs',
        status: 'shipped' as const,
        api: 'GET /v1/sovereign-flywheel/jobs',
      },
      {
        id: 'datasets',
        name: 'List datasets',
        status: 'shipped' as const,
        api: 'GET /v1/sovereign-flywheel/datasets',
      },
    ],
  };
}
