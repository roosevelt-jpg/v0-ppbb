export function modelEconomyHonesty() {
  return {
    product: 'model-economy',
    shipped: true,
    pricingPrinciple: 'faster_costs_more',
    note:
      'Model Economy prices VerbaLab models by use case and speed tier — eco is cheapest/slowest, ultra is fastest/highest cost. Fully wired quote + meter APIs.',
  };
}

export function modelEconomyCatalog() {
  return {
    id: 'model-economy',
    title: 'Model Economy',
    blurb:
      'Pick the right model for the job and pay for speed — eco, standard, turbo, and ultra tiers across STT, chat, TTS, and translate.',
    honesty: modelEconomyHonesty(),
    docs: '/docs/MODEL_ECONOMY.md',
    residency: {
      primaryRegion: 'af-south-1',
      verbalabRegion: 'af',
      flyRegion: 'jnb',
    },
    capabilities: [
      {
        id: 'catalog',
        name: 'Use-case + speed catalog',
        status: 'shipped' as const,
        api: 'GET /v1/model-economy/catalog',
      },
      {
        id: 'quote',
        name: 'Price quote by tier',
        status: 'shipped' as const,
        api: 'POST /v1/model-economy/quote',
      },
      {
        id: 'estimate',
        name: 'Workload cost estimate',
        status: 'shipped' as const,
        api: 'POST /v1/model-economy/estimate',
      },
      {
        id: 'select',
        name: 'Select model SKU',
        status: 'shipped' as const,
        api: 'POST /v1/model-economy/select',
      },
      {
        id: 'meter',
        name: 'Record metered usage',
        status: 'shipped' as const,
        api: 'POST /v1/model-economy/meter',
      },
    ],
  };
}
