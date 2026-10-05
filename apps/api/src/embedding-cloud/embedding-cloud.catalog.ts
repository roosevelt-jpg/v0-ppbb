export type EmbeddingCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type EmbeddingCapability = {
  id: string;
  name: string;
  status: EmbeddingCapabilityStatus;
  api: string | null;
  notes: string;
};

export type EmbeddingModality = {
  id: string;
  name: string;
  status: EmbeddingCapabilityStatus;
  notes: string;
};

/** Library Phase 48 → Embedding Cloud (VL-181). Extends VL-063 — not a multimodal embedding OS. */
export function embeddingCloudCatalog() {
  return {
    product: 'VerbaLab Embedding Cloud',
    note:
      'Embeddings via AI Gateway (OpenAI text-embedding-3-small by default). Text/document/code are direct. Speech/image/video/cross-modal use caption→embed paths. Voice biometrics stay on Speaker Intelligence.',
    capabilities: [
      {
        id: 'text-embeddings',
        name: 'Text Embeddings',
        status: 'shipped',
        api: 'POST /v1/embedding-cloud/embed',
        notes: 'OpenAI-shaped string | string[] input.',
      },
      {
        id: 'document-embeddings',
        name: 'Document Embeddings',
        status: 'shipped',
        api: 'POST /v1/embedding-cloud/embed',
        notes: 'Same text path + Knowledge RAG chunk embeds.',
      },
      {
        id: 'code-embeddings',
        name: 'Code Embeddings',
        status: 'shipped',
        api: 'POST /v1/embedding-cloud/embed',
        notes: 'Text model with modality=code metadata.',
      },
      {
        id: 'multilingual-embeddings',
        name: 'Multilingual Embeddings',
        status: 'shipped',
        api: 'POST /v1/embedding-cloud/embed',
        notes: 'Vendor multilingual text model across African languages.',
      },
      {
        id: 'speech-embeddings',
        name: 'Speech Embeddings',
        status: 'shipped',
        api: 'POST /v1/embedding-cloud/embed',
        notes: 'Caption path: STT transcript → text embed.',
      },
      {
        id: 'voice-embeddings',
        name: 'Voice Embeddings',
        status: 'shipped',
        api: 'POST /v1/embedding-cloud/embed',
        notes:
          'modality=voice — speaker-label / voice-descriptor caption → text embed. Biometric speaker vectors remain on Speaker Intelligence.',
      },
      {
        id: 'image-embeddings',
        name: 'Image Embeddings',
        status: 'shipped',
        api: 'POST /v1/embedding-cloud/embed',
        notes: 'Caption path: OCR/caption text → embed.',
      },
      {
        id: 'video-embeddings',
        name: 'Video Embeddings',
        status: 'shipped',
        api: 'POST /v1/embedding-cloud/embed',
        notes: 'Caption/transcript path → text embed. Dedicated video encoders not trained here.',
      },
      {
        id: 'cross-modal',
        name: 'Cross Modal Embeddings',
        status: 'shipped',
        api: 'POST /v1/embedding-cloud/embed',
        notes: 'Joint caption space: describe image+text together, then embed.',
      },
      {
        id: 'hybrid',
        name: 'Hybrid Embeddings',
        status: 'shipped',
        api: 'POST /v1/embedding-cloud/embed',
        notes: 'Dense embed tagged for hybrid retrieval in Vector Cloud.',
      },
      {
        id: 'analytics',
        name: 'Analytics',
        status: 'shipped',
        api: 'GET /v1/embedding-cloud/analytics',
        notes: 'Token/request aggregates from usage_events + audits.',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'GET /v1/embedding-cloud/monitoring',
        notes: 'Snapshot + shared request IDs.',
      },
    ] satisfies EmbeddingCapability[],
    modalities: [
      { id: 'text', name: 'Text', status: 'shipped', notes: 'Default modality.' },
      { id: 'document', name: 'Document', status: 'shipped', notes: 'Text path + RAG chunks.' },
      { id: 'code', name: 'Code', status: 'shipped', notes: 'Text path with modality tag.' },
      {
        id: 'speech',
        name: 'Speech',
        status: 'shipped',
        notes: 'Paste an STT transcript / caption; embeds via text gateway.',
      },
      {
        id: 'voice',
        name: 'Voice',
        status: 'shipped',
        notes:
          'Paste a speaker label / voice descriptor; embeds via text gateway. Biometrics → Speaker Intelligence.',
      },
      {
        id: 'image',
        name: 'Image',
        status: 'shipped',
        notes: 'Paste OCR / image caption text; embeds via text gateway.',
      },
      {
        id: 'video',
        name: 'Video',
        status: 'shipped',
        notes: 'Paste video transcript / scene captions; embeds via text gateway.',
      },
      {
        id: 'cross_modal',
        name: 'Cross Modal',
        status: 'shipped',
        notes: 'Joint caption (image description + text) → one embedding.',
      },
      {
        id: 'hybrid',
        name: 'Hybrid',
        status: 'shipped',
        notes: 'Dense vector tagged for hybrid retrieval workflows.',
      },
    ] satisfies EmbeddingModality[],
    honesty: {
      trainsEmbeddingModels: false,
      multimodalOs: false,
      speechImageVideo: true,
      speechImageVideoPath: 'caption_to_text_embed',
      dedicatedAudioImageEncoders: false,
    },
    links: {
      console: '/embedding-cloud',
      hub: '/intelligence-cloud',
      create: 'POST /v1/embedding-cloud/embed',
      knowledge: '/knowledge',
      speakerIntelligence: '/speaker-intelligence',
      openapi: '/v1/openapi.json',
      docs: '/docs/EMBEDDING_CLOUD.md',
    },
    architecture: {
      rest: true,
      graphql: true,
      sdk: '@verbalab/sdk',
      cli: '@verbalab/cli',
      docker: true,
      terraform: true,
      kubernetes: true,
      primaryRegion: 'af-south-1',
      gateway: true,
      defaultModel: process.env.OPENAI_EMBEDDINGS_MODEL ?? 'text-embedding-3-small',
    },
  };
}

export const SUPPORTED_EMBED_MODALITIES = [
  'text',
  'document',
  'code',
  'speech',
  'voice',
  'image',
  'video',
  'cross_modal',
  'hybrid',
] as const;
export type SupportedEmbedModality = (typeof SUPPORTED_EMBED_MODALITIES)[number];

export const DEFERRED_EMBED_MODALITIES = [] as const;

export function embeddingModelsCatalog() {
  const defaultModel = process.env.OPENAI_EMBEDDINGS_MODEL ?? 'text-embedding-3-small';
  const modalities = [...SUPPORTED_EMBED_MODALITIES];
  return {
    models: [
      {
        id: defaultModel,
        provider: 'openai_embeddings',
        modalities,
        dimensions: defaultModel.includes('large') ? 3072 : 1536,
        default: true,
        status: 'shipped' as const,
        notes: 'Gateway OpenAI embeddings. Live path needs OPENAI_API_KEY.',
      },
      {
        id: 'text-embedding-3-large',
        provider: 'openai_embeddings',
        modalities,
        dimensions: 3072,
        default: false,
        status: 'shipped' as const,
        notes: 'Optional via model= on POST /v1/embeddings.',
      },
    ],
    note: 'Buy embeddings — VerbaLab does not train embedding models.',
  };
}
