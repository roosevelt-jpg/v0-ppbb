export function oralKnowledgeHonesty() {
  return {
    product: 'oral-knowledge',
    shipped: true,
    note: 'Oral-First Knowledge OS is a VerbaLab frontier product — fully wired APIs and console, not a marketing façade.',
  };
}

export function oralKnowledgeCatalog() {
  return {
    id: 'oral-knowledge',
    title: 'Oral-First Knowledge OS',
    blurb: "Ingest radio, WhatsApp voice notes, market chatter, elders’ speech into citeable oral knowledge without forcing literacy first.",
    honesty: oralKnowledgeHonesty(),
    docs: '/docs/ORAL_KNOWLEDGE.md',
    capabilities: [
        { id: 'ingest-audio', name: 'Oral ingest from audio/text', status: 'shipped' as const, api: 'POST /v1/oral-knowledge/ingest' },
        { id: 'cite', name: 'Cite back to oral source', status: 'shipped' as const, api: 'POST /v1/oral-knowledge/cite' },
        { id: 'query', name: 'Ask oral knowledge', status: 'shipped' as const, api: 'POST /v1/oral-knowledge/query' },
        { id: 'collections', name: 'Community collections', status: 'shipped' as const, api: 'GET /v1/oral-knowledge/collections' },
    ],
  };
}
