export function institutionalVoiceHonesty() {
  return {
    product: 'institutional-voice',
    shipped: true,
    note: "Shipped policy corpus + constrained answerer with citation anchors. Not a guarantee against all prompt injection; refuses when no corpus span matches.",
  };
}

export function institutionalVoiceCatalog() {
  return {
    id: 'institutional-voice',
    title: "Policy-Bound Institutional Voice",
    blurb: "Ministry/agency voices that may only speak from an approved gazette/law corpus \u2014 constrained generation with refusal when off-policy.",
    honesty: institutionalVoiceHonesty(),
    docs: '/docs/INSTITUTIONAL_VOICE.md',
    capabilities: [
        { id: 'ingest', name: 'Ingest policy document', status: 'shipped' as const, api: 'POST /v1/institutional-voice/corpus' },
        { id: 'list', name: 'List corpus', status: 'shipped' as const, api: 'GET /v1/institutional-voice/corpus' },
        { id: 'speak', name: 'Policy-bound speak', status: 'shipped' as const, api: 'POST /v1/institutional-voice/speak' },
        { id: 'agency', name: 'Register agency voice', status: 'shipped' as const, api: 'POST /v1/institutional-voice/agencies' }
    ],
  };
}
