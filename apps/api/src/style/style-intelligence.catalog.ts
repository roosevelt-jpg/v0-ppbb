export type StyleCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type StyleCapability = {
  id: string;
  name: string;
  status: StyleCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Library Phase 11 → VerbaLab Style Intelligence (VL-143). */
export function styleIntelligenceCatalog() {
  return {
    product: 'Style Intelligence',
    note:
      'Bounded tone profiles, detect, transform, and transfer on rules + optional LLM. Not author style cloning or certified vertical writing products.',
    capabilities: [
      {
        id: 'formal',
        name: 'Formal',
        status: 'shipped',
        api: 'POST /v1/style/rewrite profile=formal',
        notes: 'High-formality register transforms.',
      },
      {
        id: 'professional',
        name: 'Professional',
        status: 'shipped',
        api: 'POST /v1/style/rewrite profile=professional',
        notes: 'Business formality.',
      },
      {
        id: 'academic',
        name: 'Academic',
        status: 'shipped',
        api: 'POST /v1/style/rewrite profile=academic',
        notes: 'Formal register — not a citation manager.',
      },
      {
        id: 'legal',
        name: 'Legal',
        status: 'shipped',
        api: 'POST /v1/style/rewrite profile=legal',
        notes: 'Tone e2e — not legal advice or contract drafting.',
      },
      {
        id: 'medical',
        name: 'Medical',
        status: 'shipped',
        api: 'POST /v1/style/rewrite profile=medical',
        notes: 'Tone e2e — not clinical documentation or medical advice.',
      },
      {
        id: 'business',
        name: 'Business',
        status: 'shipped',
        api: 'POST /v1/style/rewrite profile=business',
        notes: 'Workplace clarity transforms.',
      },
      {
        id: 'marketing',
        name: 'Marketing',
        status: 'shipped',
        api: 'POST /v1/style/rewrite profile=marketing',
        notes: 'Light persuasive tone e2e — not a campaign/copywriting OS.',
      },
      {
        id: 'technical',
        name: 'Technical',
        status: 'shipped',
        api: 'POST /v1/style/rewrite profile=technical',
        notes: 'Precise engineering-adjacent wording.',
      },
      {
        id: 'government',
        name: 'Government',
        status: 'shipped',
        api: 'POST /v1/style/rewrite profile=government',
        notes: 'Plain formal tone e2e — not policy/compliance certification.',
      },
      {
        id: 'casual',
        name: 'Casual',
        status: 'shipped',
        api: 'POST /v1/style/rewrite profile=casual',
        notes: 'Relaxed register with normalized spacing.',
      },
      {
        id: 'tone_detection',
        name: 'Tone detection',
        status: 'shipped',
        api: 'POST /v1/style/detect',
        notes: 'Heuristic cue scoring — not a trained tone classifier.',
      },
      {
        id: 'tone_transformation',
        name: 'Tone transformation',
        status: 'shipped',
        api: 'POST /v1/style/transform',
        notes: 'Rewrite into a target profile (alias of style engine).',
      },
      {
        id: 'style_transfer',
        name: 'Style transfer',
        status: 'shipped',
        api: 'POST /v1/style/transfer',
        notes: 'Detect source tone then rewrite to target profile e2e — not author cloning.',
      },
      {
        id: 'african_public_sector',
        name: 'African public sector',
        status: 'shipped',
        api: 'POST /v1/style/rewrite profile=african_public_sector',
        notes: 'Plain formal citizen-services tone for African public-sector copy.',
      },
      {
        id: 'african_plain',
        name: 'African plain language',
        status: 'shipped',
        api: 'POST /v1/style/rewrite profile=african_plain',
        notes: 'Simpler wording for multilingual African product UI / SMS-adjacent copy.',
      },
      {
        id: 'east_african_formal',
        name: 'East African formal',
        status: 'shipped',
        api: 'POST /v1/style/rewrite profile=east_african_formal',
        notes: 'Respectful formal register cues for East African bilingual contexts.',
      },
      {
        id: 'west_african_business',
        name: 'West African business',
        status: 'shipped',
        api: 'POST /v1/style/rewrite profile=west_african_business',
        notes: 'Clear business tone for West African English/French bridge contexts.',
      },
    ] satisfies StyleCapability[],
    engines: {
      style: { status: 'shipped', api: '/v1/style/*' },
      rest: { status: 'shipped' },
      graphql: { status: 'shipped', notes: 'styleIntelligence + detectTone + transformTone + transferStyle' },
      sdk: { status: 'shipped', package: '@verbalab/sdk' },
      analytics: { status: 'shipped', api: 'GET /v1/style/analytics' },
      monitoring: { status: 'shipped', api: 'GET /v1/metrics/translate', notes: 'Shared observability stack' },
    },
    links: {
      dashboard: '/style-intelligence',
      style: '/style',
      grammar: '/grammar-intelligence',
      docs: '/docs/STYLE.md',
    },
  };
}
