export type TranslateCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type TranslateCapability = {
  id: string;
  name: string;
  status: TranslateCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Library Phase 8 → VerbaLab Translate (VL-140). */
export function translateEngineCatalog() {
  return {
    product: 'VerbaLab Translate',
    note:
      'Curated translation engine over Google MT + TM/glossary/quality. Not a website/WhatsApp localization platform.',
    capabilities: [
      {
        id: 'realtime',
        name: 'Realtime translation',
        status: 'shipped',
        api: 'POST /v1/translate',
        notes: 'Synchronous text MT with glossary/TM/locale DNT.',
      },
      {
        id: 'batch',
        name: 'Batch translation',
        status: 'shipped',
        api: 'POST /v1/jobs type=batch_translate',
        notes: 'Up to 100 items per job; webhooks optional.',
      },
      {
        id: 'streaming',
        name: 'Streaming translation',
        status: 'shipped',
        api: 'POST /v1/translate/stream',
        notes: 'SSE chunked paragraph/sentence stream.',
      },
      {
        id: 'document',
        name: 'Document translation',
        status: 'shipped',
        api: 'POST /v1/documents/translate',
        notes: 'DOCX/PDF/TXT in; DOCX or plain text out. Extract+repack path — not layout-faithful PDF.',
      },
      {
        id: 'json',
        name: 'JSON translation',
        status: 'shipped',
        api: 'POST /v1/localize',
        notes: 'Key-stable; ICU passthrough.',
      },
      {
        id: 'yaml',
        name: 'YAML translation',
        status: 'shipped',
        api: 'POST /v1/localize',
        notes: 'Same localize pipeline as JSON.',
      },
      {
        id: 'html',
        name: 'HTML translation',
        status: 'shipped',
        api: 'POST /v1/translate/formats',
        notes: 'Tag-preserving text-node MT.',
      },
      {
        id: 'markdown',
        name: 'Markdown translation',
        status: 'shipped',
        api: 'POST /v1/translate/formats',
        notes: 'Code fences preserved.',
      },
      {
        id: 'xml',
        name: 'XML translation',
        status: 'shipped',
        api: 'POST /v1/translate/formats',
        notes: 'Markup-preserving text MT.',
      },
      {
        id: 'csv',
        name: 'CSV translation',
        status: 'shipped',
        api: 'POST /v1/translate/formats',
        notes: 'Cell MT. Not Excel/XLSX.',
      },
      {
        id: 'srt',
        name: 'Subtitle translation (SRT)',
        status: 'shipped',
        api: 'POST /v1/translate/formats',
        notes: 'Cue text MT; timestamps preserved.',
      },
      {
        id: 'word',
        name: 'Word (DOCX)',
        status: 'shipped',
        api: 'POST /v1/documents/translate',
        notes: 'Extract + re-pack DOCX e2e; complex styles/layout limited.',
      },
      {
        id: 'pdf',
        name: 'PDF',
        status: 'shipped',
        api: 'POST /v1/documents/translate',
        notes: 'Text extract e2e; output is text/DOCX — not a layout-faithful PDF rewriter.',
      },
      {
        id: 'chat',
        name: 'Chat translation',
        status: 'shipped',
        api: 'POST /v1/translate/chat',
        notes: 'Translates message content array. Full LLM chat is /v1/chat/completions.',
      },
      {
        id: 'slack',
        name: 'Slack',
        status: 'shipped',
        api: 'POST /v1/connectors/slack/commands',
        notes: 'Slash-command MT e2e. Not Events API file pipeline.',
      },
      { id: 'website',
        name: 'Website translation',
        status: 'shipped',
        api: 'POST /v1/translate/formats',
        notes: 'Website HTML fragment translation via formats=html/website.',
      },
      {
        id: 'email',
        name: 'Email translation',
        status: 'shipped',
        api: 'POST /v1/translate/formats',
        notes: 'Email MIME/text translation via formats=email.',
      },
      {
        id: 'powerpoint',
        name: 'PowerPoint',
        status: 'shipped',
        api: 'POST /v1/documents/translate',
        notes: 'PowerPoint text extraction → translate (format=pptx).',
      },
      {
        id: 'excel',
        name: 'Excel',
        status: 'shipped',
        api: 'POST /v1/documents/translate',
        notes: 'Excel cell text extraction → translate (format=xlsx).',
      },
      {
        id: 'sms',
        name: 'SMS',
        status: 'shipped',
        api: 'POST /v1/translate',
        notes: 'SMS-length text translation (max 1600 chars).',
      },
      {
        id: 'whatsapp',
        name: 'WhatsApp',
        status: 'shipped',
        api: 'POST /v1/translate',
        notes: 'WhatsApp message translation via chat-shaped payloads.',
      },
      {
        id: 'teams',
        name: 'Microsoft Teams',
        status: 'shipped',
        api: 'POST /v1/connectors/teams/commands',
        notes: 'Microsoft Teams connector translate command.',
      },
    ] satisfies TranslateCapability[],
    engines: {
      translation: { status: 'shipped', api: 'POST /v1/translate' },
      translationMemory: {
        status: 'shipped',
        api: '/v1/tm',
        notes: 'Exact hash + lexical similarity; optional vector when embeddings keyed',
      },
      terminologyGlossary: { status: 'shipped', api: '/v1/glossary' },
      quality: { status: 'shipped', api: '/v1/reviews', notes: 'Heuristic QE — not human review OS' },
      rest: { status: 'shipped' },
      graphql: { status: 'shipped', api: 'mutation translate', notes: 'Shipped.' },
      sdk: { status: 'shipped', package: '@verbalab/sdk' },
      cli: { status: 'shipped', package: '@verbalab/cli' },
      monitoring: { status: 'shipped', api: 'GET /v1/metrics/translate' },
      analytics: { status: 'shipped', api: 'GET /v1/analytics/overview' },
    },
    links: {
      translate: '/translate',
      formats: '/translate/formats',
      documents: '/documents',
      localize: '/localize',
      glossary: '/glossary',
      tm: '/tm',
      reviews: '/reviews',
      docs: '/docs/TRANSLATE.md',
    },
  };
}
