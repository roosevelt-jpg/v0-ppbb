export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'VerbaLab API',
    version: '0.1.0',
    description:
      'Enterprise language-intelligence API. Phase 1 surface: languages, translate, API keys, and usage.',
  },
  servers: [{ url: 'http://localhost:3001', description: 'Local' }],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'vl_live_ | vl_test_',
        description: 'API key from the console (vl_live_… production label, vl_test_… soft sandbox).',
      },
      ClerkAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Clerk session JWT for console routes.',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              request_id: { type: 'string' },
            },
            required: ['code', 'message', 'request_id'],
          },
        },
        required: ['error'],
      },
      TranslateRequest: {
        type: 'object',
        required: ['text', 'source', 'target'],
        properties: {
          text: { type: 'string', minLength: 1 },
          source: {
            type: 'string',
            description: 'Source language code, or "auto" to detect first.',
            example: 'en',
          },
          target: { type: 'string', example: 'sw' },
        },
      },
      DetectRequest: {
        type: 'object',
        required: ['text'],
        properties: {
          text: { type: 'string', minLength: 1 },
        },
      },
      DetectResponse: {
        type: 'object',
        properties: {
          language: { type: 'string' },
          confidence: { type: 'number' },
          provider: { type: 'string' },
        },
        required: ['language', 'confidence', 'provider'],
      },
      TranslateResponse: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          source: { type: 'string' },
          target: { type: 'string' },
          provider: { type: 'string' },
          characters: { type: 'integer' },
          glossaryApplied: { type: 'integer' },
          tmHit: { type: 'boolean' },
          reviewId: { type: 'string' },
          qualityScore: { type: 'integer' },
          needsReview: { type: 'boolean' },
          detection: {
            nullable: true,
            allOf: [{ $ref: '#/components/schemas/DetectResponse' }],
            description: 'Present when source was "auto".',
          },
        },
        required: ['text', 'source', 'target', 'provider', 'characters'],
      },
      ChatMessage: {
        type: 'object',
        required: ['role', 'content'],
        properties: {
          role: { type: 'string', enum: ['system', 'user', 'assistant'] },
          content: { type: 'string' },
        },
      },
      ChatCompletionRequest: {
        type: 'object',
        required: ['messages'],
        properties: {
          messages: {
            type: 'array',
            items: { $ref: '#/components/schemas/ChatMessage' },
            minItems: 1,
          },
          model: { type: 'string', description: 'Optional OpenAI model override' },
          translateReplyTo: {
            type: 'string',
            description: 'Optional registry language to MT the assistant reply into',
          },
        },
      },
      ChatCompletionResponse: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          object: { type: 'string', example: 'chat.completion' },
          model: { type: 'string' },
          provider: { type: 'string' },
          choices: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                index: { type: 'integer' },
                message: { $ref: '#/components/schemas/ChatMessage' },
                finish_reason: { type: 'string' },
              },
            },
          },
          usage: {
            type: 'object',
            properties: {
              prompt_tokens: { type: 'integer' },
              completion_tokens: { type: 'integer' },
              total_tokens: { type: 'integer' },
            },
          },
          translated: { type: 'boolean' },
          translateReplyTo: { type: 'string', nullable: true },
        },
      },
      Job: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          type: { type: 'string', enum: ['batch_translate', 'document_translate', 'workflow'] },
          status: { type: 'string', enum: ['queued', 'running', 'succeeded', 'failed'] },
          input: { type: 'object' },
          result: { type: 'object', nullable: true },
          error: { type: 'string', nullable: true },
          webhookUrl: { type: 'string', nullable: true },
          webhookStatus: { type: 'string', nullable: true },
          attempts: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
          startedAt: { type: 'string', format: 'date-time', nullable: true },
          completedAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      Workflow: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          steps: {
            type: 'array',
            items: { type: 'object' },
            description: 'Directed steps: transcribe | translate | notify',
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Language: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          name: { type: 'string' },
          nativeName: { type: 'string', nullable: true },
          script: { type: 'string', nullable: true },
          rtl: { type: 'boolean' },
          tier: { type: 'string', enum: ['vendor', 'strategic_african'] },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        operationId: 'getHealth',
        responses: {
          '200': {
            description: 'Service is up (includes in-process translate latency snapshot)',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    translateLatency: {
                      type: 'object',
                      properties: {
                        samples: { type: 'integer' },
                        p50Ms: { type: 'number', nullable: true },
                        p95Ms: { type: 'number', nullable: true },
                        p99Ms: { type: 'number', nullable: true },
                        maxMs: { type: 'number', nullable: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/v1/metrics/translate': {
      get: {
        summary: 'Translate latency percentiles (in-process)',
        operationId: 'translateLatencyMetrics',
        responses: {
          '200': {
            description: 'Rolling-window p50/p95/p99 for this API instance',
          },
        },
      },
    },
    '/v1/languages': {
      get: {
        summary: 'List languages',
        operationId: 'listLanguages',
        responses: {
          '200': {
            description: 'Language registry',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Language' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/v1/languages/{code}': {
      get: {
        summary: 'Get language with family, dialects, accents, and linguistic rules',
        operationId: 'getLanguage',
        parameters: [{ name: 'code', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Language detail' },
          '404': { description: 'Not in registry' },
        },
      },
    },
    '/v1/registry': {
      get: {
        summary: 'Enterprise Language Registry overview',
        operationId: 'registryOverview',
        responses: { '200': { description: 'Counts and links' } },
      },
    },
    '/v1/registry/families': {
      get: {
        summary: 'List language families',
        operationId: 'listLanguageFamilies',
        responses: { '200': { description: 'Families' } },
      },
    },
    '/v1/registry/scripts': {
      get: {
        summary: 'List writing systems / scripts',
        operationId: 'listScripts',
        parameters: [
          {
            name: 'kind',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              enum: ['alphabet', 'abjad', 'abugida', 'syllabary', 'logographic', 'other'],
            },
          },
        ],
        responses: { '200': { description: 'ISO 15924 writing systems' } },
      },
    },
    '/v1/registry/alphabets': {
      get: {
        summary: 'List alphabet writing systems',
        operationId: 'listAlphabets',
        responses: { '200': { description: 'kind=alphabet subset' } },
      },
    },
    '/v1/registry/rules': {
      get: {
        summary: 'List linguistic rules (pronunciation/grammar/phonetic/morphology)',
        operationId: 'listLinguisticRules',
        parameters: [
          { name: 'kind', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'language', in: 'query', required: false, schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Curated rule catalog' } },
      },
    },
    '/v1/registry/validate': {
      post: {
        summary: 'Validate registry codes',
        operationId: 'validateRegistry',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  language: { type: 'string' },
                  dialect: { type: 'string' },
                  accent: { type: 'string' },
                  locale: { type: 'string' },
                  script: { type: 'string' },
                  family: { type: 'string' },
                  rule: { type: 'string' },
                  bcp47: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Validation result' } },
      },
    },
    '/v1/registry/analytics': {
      get: {
        summary: 'Registry coverage analytics',
        operationId: 'registryAnalytics',
        responses: { '200': { description: 'Counts by tier/family/script/rule kind' } },
      },
    },
    '/v1/registry/health': {
      get: {
        summary: 'Registry integrity monitoring',
        operationId: 'registryHealth',
        responses: { '200': { description: 'ok or degraded with issues' } },
      },
    },
    '/v1/locales': {
      get: {
        summary: 'List locale / cultural packs',
        operationId: 'listLocales',
        responses: {
          '200': {
            description: 'Seeded packs (date/number/currency notes, honorifics, do-not-translate)',
          },
        },
      },
    },
    '/v1/locales/{code}': {
      get: {
        summary: 'Get locale pack for a language code',
        operationId: 'getLocale',
        parameters: [{ name: 'code', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Locale pack' },
          '404': { description: 'No pack for code' },
        },
      },
    },
    '/v1/locales/{code}/examples': {
      get: {
        summary: 'Intl date/number/currency examples for a locale pack',
        operationId: 'getLocaleExamples',
        parameters: [{ name: 'code', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Formatted samples' } },
      },
    },
    '/v1/finetunes/candidates': {
      get: {
        summary: 'List failed language-pair fine-tune candidates from coverage',
        operationId: 'listFineTuneCandidates',
        security: [{ ClerkAuth: [] }],
        responses: { '200': { description: 'Candidates below coverage thresholds' } },
      },
    },
    '/v1/finetunes/jobs': {
      get: {
        summary: 'List fine-tune jobs for the organization',
        operationId: 'listFineTuneJobs',
        security: [{ ClerkAuth: [] }],
        responses: { '200': { description: 'Jobs' } },
      },
      post: {
        summary: 'Create a fine-tune job from a golden training pack (Pro)',
        operationId: 'createFineTuneJob',
        security: [{ ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['sourceLang', 'targetLang'],
                properties: {
                  sourceLang: { type: 'string' },
                  targetLang: { type: 'string' },
                  launcher: { type: 'string', enum: ['manual', 'modal'] },
                  baseModel: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Created' },
          '402': { description: 'Pro plan required' },
        },
      },
    },
    '/v1/finetunes/jobs/{id}/launch': {
      post: {
        summary: 'Launch or defer a fine-tune job (Pro)',
        operationId: 'launchFineTuneJob',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Status updated (running or awaiting_gpu)' },
          '402': { description: 'Pro plan required' },
        },
      },
    },
    '/v1/finetunes/jobs/{id}/complete': {
      post: {
        summary: 'Attach artifact and optionally promote to model registry (Pro)',
        operationId: 'completeFineTuneJob',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  artifactKind: { type: 'string', enum: ['phrase_map', 'http_endpoint'] },
                  artifactUri: { type: 'string' },
                  useGoldenPhraseMap: { type: 'boolean' },
                  promote: { type: 'boolean' },
                  displayName: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Completed' }, '402': { description: 'Pro plan required' } },
      },
    },
    '/v1/finetunes/models': {
      get: {
        summary: 'List model registry entries',
        operationId: 'listFineTuneModels',
        security: [{ ClerkAuth: [] }],
        responses: { '200': { description: 'Registry' } },
      },
    },
    '/v1/finetunes/models/{id}/retire': {
      post: {
        summary: 'Retire a ready fine-tune model (Pro)',
        operationId: 'retireFineTuneModel',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Retired' }, '402': { description: 'Pro plan required' } },
      },
    },
    '/v1/models/live': {
      get: {
        summary: 'Public live model matrix per gateway feature',
        operationId: 'getModelsLive',
        responses: {
          '200': {
            description: 'Ready vendor + fine-tune entries with configured flags (not MLflow)',
          },
        },
      },
    },
    '/v1/models': {
      get: {
        summary: 'List model registry entries',
        operationId: 'listModels',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'feature', in: 'query', schema: { type: 'string' } }],
        responses: { '200': { description: 'Registry rows' } },
      },
    },
    '/v1/models/{idOrSlug}': {
      get: {
        summary: 'Get a model registry entry',
        operationId: 'getModel',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'idOrSlug', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Entry' }, '404': { description: 'Not found' } },
      },
    },
    '/v1/models/{idOrSlug}/external-url': {
      post: {
        summary: 'Set optional external URL (e.g. W&B) — platform admin',
        operationId: 'setModelExternalUrl',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'idOrSlug', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Updated' }, '403': { description: 'Platform admin required' } },
      },
    },
    '/v1/models/{idOrSlug}/status': {
      post: {
        summary: 'Set registry status ready/retired/draft — platform admin',
        operationId: 'setModelStatus',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'idOrSlug', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Updated' }, '403': { description: 'Platform admin required' } },
      },
    },
    '/v1/training-jobs/launchers': {
      get: {
        summary: 'List training launchers and configuration status',
        operationId: 'listTrainingLaunchers',
        security: [{ ClerkAuth: [] }],
        responses: { '200': { description: 'manual/modal/vertex/fixture configured flags' } },
      },
    },
    '/v1/training-jobs': {
      get: {
        summary: 'List rented-GPU / manual training jobs',
        operationId: 'listTrainingJobs',
        security: [{ ClerkAuth: [] }],
        responses: { '200': { description: 'Jobs' } },
      },
      post: {
        summary: 'Create a training job (Pro)',
        operationId: 'createTrainingJob',
        security: [{ ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['sourceLang', 'targetLang'],
                properties: {
                  sourceLang: { type: 'string' },
                  targetLang: { type: 'string' },
                  launcher: { type: 'string', enum: ['manual', 'modal', 'vertex', 'fixture'] },
                  baseModel: { type: 'string' },
                  datasetAssetId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Created' }, '402': { description: 'Pro required' } },
      },
    },
    '/v1/training-jobs/callback': {
      post: {
        summary: 'Rented-GPU completion callback (token auth)',
        operationId: 'trainingJobCallback',
        responses: {
          '200': { description: 'Job updated / model promoted' },
          '401': { description: 'Invalid callback token' },
        },
      },
    },
    '/v1/training-jobs/{id}/launch': {
      post: {
        summary: 'Launch training on manual/Modal/Vertex/fixture (Pro)',
        operationId: 'launchTrainingJob',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'running or awaiting_gpu; returns callbackToken once' },
          '402': { description: 'Pro required' },
        },
      },
    },
    '/v1/training-jobs/{id}/complete': {
      post: {
        summary: 'Attach artifact and optionally promote (Pro)',
        operationId: 'completeTrainingJob',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Completed' } },
      },
    },
    '/v1/coverage': {
      get: {
        summary: 'Public language coverage matrix and golden-eval status',
        operationId: 'getCoverage',
        responses: {
          '200': {
            description:
              'Focus pairs (EN→sw/yo/am) with golden eval scores when available; honest disclaimer',
          },
        },
      },
    },
    '/v1/datasets': {
      get: {
        summary: 'List dataset assets in the session workspace',
        operationId: 'listDatasets',
        security: [{ ClerkAuth: [] }],
        responses: { '200': { description: 'Dataset assets with versions' } },
      },
      post: {
        summary: 'Create dataset asset with legal metadata + first file version',
        operationId: 'createDataset',
        security: [{ ClerkAuth: [] }],
        responses: {
          '201': { description: 'Created asset' },
          '400': { description: 'Missing license/consent or invalid file' },
        },
      },
    },
    '/v1/datasets/licenses': {
      get: {
        summary: 'List known license tags for dataset intake',
        operationId: 'listDatasetLicenses',
        security: [{ ClerkAuth: [] }],
        responses: { '200': { description: 'License tag enum' } },
      },
    },
    '/v1/datasets/{id}': {
      get: {
        summary: 'Get a dataset asset',
        operationId: 'getDataset',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Asset with versions' } },
      },
      patch: {
        summary: 'Update dataset legal metadata or status',
        operationId: 'updateDataset',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Updated' } },
      },
      delete: {
        summary: 'Archive dataset and unlink stored files',
        operationId: 'archiveDataset',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Archived' } },
      },
    },
    '/v1/datasets/{id}/versions': {
      post: {
        summary: 'Upload a new dataset file version',
        operationId: 'addDatasetVersion',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '201': { description: 'Version added' } },
      },
    },
    '/v1/datasets/{id}/versions/{version}/content': {
      get: {
        summary: 'Download dataset version bytes',
        operationId: 'downloadDatasetVersion',
        security: [{ ClerkAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'version', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: { '200': { description: 'File bytes' } },
      },
    },
    '/v1/eval/run': {
      post: {
        summary: 'Run golden-set eval against the active MT gateway (owner/admin)',
        operationId: 'runEval',
        security: [{ ClerkAuth: [] }],
        parameters: [
          {
            name: 'mode',
            in: 'query',
            schema: { type: 'string', enum: ['fixture', 'live', 'reference_oracle'], default: 'fixture' },
          },
        ],
        responses: {
          '200': { description: 'Eval snapshot written to eval/results/latest.json' },
          '400': { description: 'Live mode disabled without EVAL_LIVE=1' },
        },
      },
    },
    '/v1/detect': {
      post: {
        summary: 'Detect language of text',
        operationId: 'detectLanguage',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/DetectRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Detected language',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DetectResponse' },
              },
            },
          },
          '400': {
            description: 'Validation error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '422': {
            description: 'Detection failed',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/chat/completions': {
      post: {
        summary: 'Language-intelligence chat completion',
        operationId: 'chatCompletions',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ChatCompletionRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Assistant reply',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ChatCompletionResponse' },
              },
            },
          },
          '400': {
            description: 'Validation error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '503': {
            description: 'Provider not configured',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/translate': {
      post: {
        summary: 'Translate text',
        operationId: 'translateText',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TranslateRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Translated text',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TranslateResponse' },
              },
            },
          },
          '400': {
            description: 'Validation or unsupported language',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '429': {
            description: 'Rate limited (Retry-After)',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            headers: {
              'Retry-After': { schema: { type: 'integer' } },
              'X-RateLimit-Limit': { schema: { type: 'string' } },
              'X-RateLimit-Remaining': { schema: { type: 'string' } },
            },
          },
          '503': {
            description: 'Provider or auth not configured',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/translate/engine': {
      get: {
        summary: 'Translation engine capability catalog (Phase 8)',
        operationId: 'translateEngine',
        responses: { '200': { description: 'Shipped / partial / deferred capabilities' } },
      },
    },
    '/v1/translate/formats': {
      post: {
        summary: 'Translate HTML, Markdown, XML, CSV, or SRT content',
        operationId: 'translateFormat',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Format-preserving translation' } },
      },
    },
    '/v1/translate/stream': {
      post: {
        summary: 'Stream translation as SSE chunks',
        operationId: 'translateStream',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'text/event-stream' } },
      },
    },
    '/v1/translate/chat': {
      post: {
        summary: 'Translate chat message contents',
        operationId: 'translateChat',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Translated messages' } },
      },
    },
    '/v1/api-keys': {
      get: {
        summary: 'List API keys',
        operationId: 'listApiKeys',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Key prefixes (secrets never returned)' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
      post: {
        summary: 'Create API key',
        operationId: 'createApiKey',
        security: [{ ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: { name: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Created; includes secret once' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/api-keys/{id}': {
      delete: {
        summary: 'Revoke API key',
        operationId: 'revokeApiKey',
        security: [{ ClerkAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Revoked' },
          '404': {
            description: 'Not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/usage/summary': {
      get: {
        summary: 'Month-to-date usage summary',
        operationId: 'getUsageSummary',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': {
            description: 'Usage summary',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    periodStart: { type: 'string', format: 'date-time' },
                    requests: { type: 'integer' },
                    characters: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/v1/analytics/overview': {
      get: {
        summary: 'Org analytics overview (volume, estimated cost, job error rate)',
        operationId: 'getAnalyticsOverview',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [
          {
            name: 'from',
            in: 'query',
            schema: { type: 'string', format: 'date-time' },
            description: 'Period start (default: first day of current UTC month)',
          },
          {
            name: 'to',
            in: 'query',
            schema: { type: 'string', format: 'date-time' },
            description: 'Period end exclusive (default: now)',
          },
        ],
        responses: {
          '200': {
            description: 'Aggregates from usage_events, translation_requests, and jobs',
          },
          '400': {
            description: 'Invalid period',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/prompts': {
      get: {
        summary: 'List managed prompt keys and active versions',
        operationId: 'listPrompts',
        security: [{ ClerkAuth: [] }],
        responses: { '200': { description: 'chat, rag, voice_faq summaries' } },
      },
    },
    '/v1/prompts/{key}/versions': {
      get: {
        summary: 'List versions for a prompt key',
        operationId: 'listPromptVersions',
        security: [{ ClerkAuth: [] }],
        parameters: [
          {
            name: 'key',
            in: 'path',
            required: true,
            schema: { type: 'string', enum: ['chat', 'rag', 'voice_faq'] },
          },
        ],
        responses: { '200': { description: 'Version history' } },
      },
      post: {
        summary: 'Create a prompt version (activates by default)',
        operationId: 'createPromptVersion',
        security: [{ ClerkAuth: [] }],
        parameters: [
          {
            name: 'key',
            in: 'path',
            required: true,
            schema: { type: 'string', enum: ['chat', 'rag', 'voice_faq'] },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['body'],
                properties: {
                  body: { type: 'string' },
                  note: { type: 'string' },
                  activate: { type: 'boolean', default: true },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Created' } },
      },
    },
    '/v1/prompts/{key}/activate': {
      post: {
        summary: 'Activate a prompt version (rollback)',
        operationId: 'activatePromptVersion',
        security: [{ ClerkAuth: [] }],
        parameters: [
          {
            name: 'key',
            in: 'path',
            required: true,
            schema: { type: 'string', enum: ['chat', 'rag', 'voice_faq'] },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['version'],
                properties: { version: { type: 'integer' } },
              },
            },
          },
        },
        responses: { '200': { description: 'Activated' } },
      },
    },
    '/v1/prompts/{key}/fallback': {
      post: {
        summary: 'Clear active version and use code fallback',
        operationId: 'restorePromptFallback',
        security: [{ ClerkAuth: [] }],
        parameters: [
          {
            name: 'key',
            in: 'path',
            required: true,
            schema: { type: 'string', enum: ['chat', 'rag', 'voice_faq'] },
          },
        ],
        responses: { '200': { description: 'Using fallback' } },
      },
    },
    '/v1/marketplace/listings': {
      get: {
        summary: 'List published marketplace listings (Pro)',
        operationId: 'listMarketplaceListings',
        security: [{ ClerkAuth: [] }],
        parameters: [
          {
            name: 'mine',
            in: 'query',
            schema: { type: 'string', enum: ['1', 'true'] },
            description: 'When set, return listings published by the current org',
          },
          {
            name: 'kind',
            in: 'query',
            schema: { type: 'string', enum: ['glossary', 'prompt', 'dataset'] },
            description: 'Filter by listing kind',
          },
        ],
        responses: {
          '200': { description: 'Listings (glossary, prompt, or dataset)' },
          '402': { description: 'Pro plan required' },
        },
      },
      post: {
        summary: 'Publish a marketplace listing from the workspace (Pro, owner/admin)',
        operationId: 'publishMarketplaceListing',
        security: [{ ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  kind: {
                    type: 'string',
                    enum: ['glossary', 'prompt', 'dataset'],
                    default: 'glossary',
                    description:
                      'glossary = terms; prompt = active managed prompts; dataset = approved TM pairs',
                  },
                  priceCents: {
                    type: 'integer',
                    minimum: 0,
                    description: '0 = free; paid listings require Connect when Stripe is live',
                  },
                  currency: { type: 'string', default: 'usd' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Published listing with frozen snapshot' },
          '402': { description: 'Pro plan required' },
        },
      },
    },
    '/v1/marketplace/listings/{id}/install': {
      post: {
        summary: 'Install a listing into the session workspace (copy-on-install)',
        operationId: 'installMarketplaceListing',
        security: [{ ClerkAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description:
              'Install receipt, or { requiresPayment, checkoutUrl } for paid listings when Stripe is configured',
          },
          '402': { description: 'Pro plan required' },
          '409': { description: 'Already installed' },
        },
      },
    },
    '/v1/marketplace/listings/{id}': {
      delete: {
        summary: 'Unpublish a listing (publisher org only)',
        operationId: 'unpublishMarketplaceListing',
        security: [{ ClerkAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Unpublished' } },
      },
    },
    '/v1/marketplace/installs': {
      get: {
        summary: 'List marketplace installs for the session workspace',
        operationId: 'listMarketplaceInstalls',
        security: [{ ClerkAuth: [] }],
        responses: { '200': { description: 'Installs' } },
      },
    },
    '/v1/marketplace/sales': {
      get: {
        summary: 'List marketplace sales for the current org (buyer or publisher)',
        operationId: 'listMarketplaceSales',
        security: [{ ClerkAuth: [] }],
        responses: { '200': { description: 'Sales with platform fee' } },
      },
    },
    '/v1/marketplace/connect/status': {
      get: {
        summary: 'Stripe Connect payout status for the current org',
        operationId: 'getMarketplaceConnectStatus',
        security: [{ ClerkAuth: [] }],
        responses: { '200': { description: 'Connect status' } },
      },
    },
    '/v1/marketplace/connect/onboard': {
      post: {
        summary: 'Start Stripe Connect Express onboarding',
        operationId: 'startMarketplaceConnectOnboarding',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Account Link URL' },
          '503': { description: 'Connect not configured' },
        },
      },
    },
    '/v1/audit-events': {
      get: {
        summary: 'List audit events',
        operationId: 'listAuditEvents',
        security: [{ ClerkAuth: [] }],
        parameters: [
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 50, maximum: 200 },
          },
        ],
        responses: {
          '200': { description: 'Recent audit events for the organization' },
          '403': {
            description: 'Forbidden for members',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/billing/summary': {
      get: {
        summary: 'Billing and quota summary',
        operationId: 'getBillingSummary',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Plan, quota, and usage' },
        },
      },
    },
    '/v1/billing/checkout': {
      post: {
        summary: 'Create Stripe Checkout session for Pro',
        operationId: 'createBillingCheckout',
        security: [{ ClerkAuth: [] }],
        responses: {
          '201': { description: 'Checkout URL' },
          '503': {
            description: 'Stripe not configured',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/billing/portal': {
      post: {
        summary: 'Create Stripe Customer Portal session',
        operationId: 'createBillingPortal',
        security: [{ ClerkAuth: [] }],
        responses: {
          '201': { description: 'Portal URL' },
        },
      },
    },
    '/v1/billing/webhook': {
      post: {
        summary: 'Stripe webhook receiver',
        operationId: 'stripeWebhook',
        responses: {
          '201': { description: 'Acknowledged' },
          '400': {
            description: 'Invalid signature',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/connectors/slack/commands': {
      post: {
        summary: 'Slack slash command webhook',
        operationId: 'slackSlashCommand',
        responses: {
          '200': { description: 'Slack message payload' },
          '401': { description: 'Invalid signature' },
        },
      },
    },
    '/v1/connectors/slack/events': {
      post: {
        summary: 'Slack Events API (url_verification)',
        operationId: 'slackEvents',
        responses: {
          '200': { description: 'Challenge or ack' },
        },
      },
    },
    '/v1/organization/members': {
      get: {
        summary: 'List organization members',
        operationId: 'listOrganizationMembers',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Members with role and profile fields' },
        },
      },
    },
    '/v1/admin/status': {
      get: {
        summary: 'Whether the current user is a platform admin',
        operationId: 'getAdminStatus',
        security: [{ ClerkAuth: [] }],
        responses: { '200': { description: '{ admin: boolean }' } },
      },
    },
    '/v1/admin/organizations': {
      get: {
        summary: 'Search organizations (platform admin)',
        operationId: 'adminSearchOrganizations',
        security: [{ ClerkAuth: [] }],
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', maximum: 100 } },
        ],
        responses: {
          '200': { description: 'Matching organizations' },
          '403': { description: 'Not a platform admin' },
        },
      },
    },
    '/v1/admin/organizations/{id}': {
      get: {
        summary: 'Organization detail for platform admin',
        operationId: 'adminGetOrganization',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Usage, keys, members' } },
      },
    },
    '/v1/admin/organizations/{id}/revoke-keys': {
      post: {
        summary: 'Revoke all API keys for an organization',
        operationId: 'adminRevokeOrganizationKeys',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '201': { description: 'Revoke count' } },
      },
    },
    '/v1/admin/organizations/{id}/disable': {
      post: {
        summary: 'Disable or re-enable an organization',
        operationId: 'adminDisableOrganization',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  disabled: { type: 'boolean', default: true },
                  reason: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Updated org' } },
      },
    },
    '/v1/organization/data-settings': {
      get: {
        summary: 'Get organization data governance settings',
        operationId: 'getDataSettings',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Retention and persistence flags' },
        },
      },
      patch: {
        summary: 'Update data governance settings',
        operationId: 'updateDataSettings',
        security: [{ ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  retentionDays: { type: 'integer', nullable: true, minimum: 1, maximum: 3650 },
                  persistSourceText: { type: 'boolean' },
                  allowVendorTraining: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Updated settings' },
          '403': {
            description: 'Forbidden for members',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/regions': {
      get: {
        summary: 'List residency islands (public)',
        operationId: 'listRegions',
        responses: {
          '200': {
            description:
              'Catalog of US/EU islands; each is a separate deploy + database (not a mesh)',
          },
        },
      },
    },
    '/v1/organization/residency': {
      get: {
        summary: 'Get organization data residency pin',
        operationId: 'getOrganizationResidency',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Pinned region vs current deploy' },
        },
      },
      patch: {
        summary: 'Set organization data residency pin (owner only)',
        description:
          'Pinning does not migrate data. A pin that mismatches VERBALAB_REGION yields residency_mismatch on authenticated routes.',
        operationId: 'setOrganizationResidency',
        security: [{ ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['dataRegion'],
                properties: {
                  dataRegion: {
                    type: 'string',
                    nullable: true,
                    enum: ['us', 'eu'],
                    description: 'Residency island code, or null to clear the pin',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Updated residency' },
          '400': {
            description: 'validation_error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '403': {
            description: 'forbidden (non-owner) or residency_mismatch on wrong island',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/organization/export': {
      post: {
        summary: 'Export current workspace data (JSON)',
        operationId: 'exportOrganizationWorkspace',
        security: [{ ClerkAuth: [] }],
        responses: {
          '201': { description: 'Workspace export payload' },
          '403': {
            description: 'Forbidden for members',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/organization': {
      delete: {
        summary: 'Delete organization (cascade; owner only)',
        operationId: 'deleteOrganization',
        security: [{ ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['confirmName'],
                properties: {
                  confirmName: {
                    type: 'string',
                    description: 'Must exactly match the organization name',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Organization deleted' },
          '403': {
            description: 'Only owners can delete',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/voice/status': {
      get: {
        summary: 'Voice FAQ / Twilio configuration status',
        operationId: 'getVoiceStatus',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Config flags and webhook URLs' },
        },
      },
    },
    '/v1/voice/simulate': {
      post: {
        summary: 'Simulate a bilingual FAQ voice turn (text or audio)',
        operationId: 'simulateVoiceTurn',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  text: { type: 'string' },
                  voice: { type: 'string' },
                  format: { type: 'string', enum: ['mp3', 'wav', 'opus', 'aac', 'flac'] },
                },
              },
            },
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: { type: 'string', format: 'binary' },
                  text: { type: 'string' },
                  voice: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'FAQ reply + audioBase64' },
          '503': { description: 'Voice agent disabled or providers missing' },
        },
      },
    },
    '/v1/voice/calls': {
      post: {
        summary: 'Place an outbound Twilio demo call',
        operationId: 'createVoiceCall',
        security: [{ ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['to'],
                properties: { to: { type: 'string', description: 'E.164 phone number' } },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Call queued' },
          '503': { description: 'Twilio not configured' },
        },
      },
    },
    '/v1/voice/twilio/inbound': {
      post: {
        summary: 'Twilio inbound webhook (signed) — returns TwiML',
        operationId: 'twilioVoiceInbound',
        responses: {
          '200': { description: 'TwiML' },
          '401': { description: 'Invalid signature' },
        },
      },
    },
    '/v1/voice/twilio/turn': {
      post: {
        summary: 'Twilio recording callback — STT → FAQ → TTS → TwiML',
        operationId: 'twilioVoiceTurn',
        responses: {
          '200': { description: 'TwiML' },
          '401': { description: 'Invalid signature' },
        },
      },
    },
    '/v1/workflows': {
      get: {
        summary: 'List saved workflow definitions',
        operationId: 'listWorkflows',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': {
            description: 'Workflows for the current workspace',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Workflow' } },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create a workflow definition',
        operationId: 'createWorkflow',
        security: [{ ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'steps'],
                properties: {
                  name: { type: 'string' },
                  steps: {
                    type: 'array',
                    description: 'transcribe (documentId), translate (source/target/text), notify (channel/message)',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Created',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Workflow' } },
            },
          },
        },
      },
    },
    '/v1/workflows/{id}': {
      get: {
        summary: 'Get a workflow definition',
        operationId: 'getWorkflow',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'Workflow',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Workflow' } },
            },
          },
        },
      },
      delete: {
        summary: 'Delete a workflow definition',
        operationId: 'deleteWorkflow',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Deleted' },
          '404': {
            description: 'Not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/workflows/{id}/run': {
      post: {
        summary: 'Enqueue a workflow job from a saved definition',
        operationId: 'runWorkflow',
        security: [{ ApiKeyAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { webhookUrl: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Job queued',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Job' } },
            },
          },
        },
      },
    },
    '/v1/jobs': {
      post: {
        summary: 'Create an async job (batch_translate, document_translate, or workflow)',
        operationId: 'createJob',
        security: [{ ApiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['type', 'input'],
                properties: {
                  type: { type: 'string', enum: ['batch_translate', 'document_translate', 'workflow'] },
                  input: {
                    type: 'object',
                    description:
                      'batch_translate: source/target/items; document_translate: documentId/source/target; workflow: steps[] (transcribe|translate|notify) or workflowId',
                  },
                  webhookUrl: {
                    type: 'string',
                    description: 'Optional HTTPS endpoint for signed job.succeeded / job.failed events',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Job queued',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Job' } },
            },
          },
          '400': {
            description: 'Validation error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
      get: {
        summary: 'List recent jobs',
        operationId: 'listJobs',
        security: [{ ApiKeyAuth: [] }],
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50, maximum: 100 } },
        ],
        responses: {
          '200': {
            description: 'Jobs for the API key organization',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Job' },
                },
              },
            },
          },
        },
      },
    },
    '/v1/jobs/{id}': {
      get: {
        summary: 'Get job status and result',
        operationId: 'getJob',
        security: [{ ApiKeyAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'Job',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Job' } },
            },
          },
          '404': {
            description: 'Not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/documents/translate': {
      post: {
        summary: 'Upload DOCX/PDF and enqueue document translation',
        operationId: 'translateDocument',
        security: [{ ApiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file', 'source', 'target'],
                properties: {
                  file: { type: 'string', format: 'binary' },
                  source: { type: 'string' },
                  target: { type: 'string' },
                  webhookUrl: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'document_translate job queued',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Job' } },
            },
          },
        },
      },
    },
    '/v1/documents/{id}': {
      get: {
        summary: 'Document metadata',
        operationId: 'getDocument',
        security: [{ ApiKeyAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Document metadata' } },
      },
    },
    '/v1/documents/{id}/content': {
      get: {
        summary: 'Download document bytes',
        operationId: 'downloadDocument',
        security: [{ ApiKeyAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'File bytes' } },
      },
    },
    '/v1/knowledge/documents': {
      get: {
        summary: 'List knowledge documents',
        operationId: 'listKnowledgeDocuments',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: {
          '200': { description: 'Workspace knowledge documents' },
        },
      },
      post: {
        summary: 'Upload and embed a knowledge document',
        operationId: 'uploadKnowledgeDocument',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Document ingested (status ready or failed)' },
          '503': {
            description: 'Embeddings provider not configured',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge/documents/{id}': {
      get: {
        summary: 'Get knowledge document',
        operationId: 'getKnowledgeDocument',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Document' }, '404': { description: 'Not found' } },
      },
      delete: {
        summary: 'Delete knowledge document',
        operationId: 'deleteKnowledgeDocument',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Deleted' }, '404': { description: 'Not found' } },
      },
    },
    '/v1/knowledge/query': {
      post: {
        summary: 'Query knowledge base (RAG)',
        operationId: 'queryKnowledge',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['question'],
                properties: {
                  question: { type: 'string' },
                  k: { type: 'integer', minimum: 1, maximum: 10 },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Answer with citations',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    answer: { type: 'string' },
                    citations: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          index: { type: 'integer' },
                          documentId: { type: 'string' },
                          chunkId: { type: 'string' },
                          filename: { type: 'string' },
                          snippet: { type: 'string' },
                          score: { type: 'number' },
                        },
                      },
                    },
                    model: { type: 'string', nullable: true },
                    provider: { type: 'string', nullable: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/v1/embeddings': {
      post: {
        summary: 'Create embeddings',
        operationId: 'createEmbeddings',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['input'],
                properties: {
                  input: {
                    oneOf: [
                      { type: 'string' },
                      { type: 'array', items: { type: 'string' }, minItems: 1 },
                    ],
                  },
                  model: {
                    type: 'string',
                    description: 'Optional model override (default text-embedding-3-small)',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Embedding vectors',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    object: { type: 'string', example: 'list' },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          object: { type: 'string' },
                          index: { type: 'integer' },
                          embedding: { type: 'array', items: { type: 'number' } },
                        },
                      },
                    },
                    model: { type: 'string' },
                    provider: { type: 'string' },
                    usage: {
                      type: 'object',
                      properties: {
                        prompt_tokens: { type: 'integer' },
                        total_tokens: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Validation error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '503': {
            description: 'OPENAI_API_KEY not configured',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/interpret': {
      post: {
        summary: 'Live interpreter (STT → MT → TTS)',
        operationId: 'interpretAudio',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file', 'target', 'voice'],
                properties: {
                  file: { type: 'string', format: 'binary' },
                  target: { type: 'string', description: 'Target language code' },
                  source: {
                    type: 'string',
                    description: 'Source language or "auto" (default: STT language / auto)',
                  },
                  language: {
                    type: 'string',
                    description: 'Optional STT language hint',
                  },
                  voice: { type: 'string', example: 'alloy' },
                  format: { type: 'string', enum: ['mp3', 'wav', 'opus', 'aac', 'flac'] },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Transcript, translation, and synthesized audio',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    sourceText: { type: 'string' },
                    targetText: { type: 'string' },
                    source: { type: 'string' },
                    target: { type: 'string' },
                    durationSeconds: { type: 'number' },
                    durationMinutes: { type: 'number' },
                    voice: { type: 'string' },
                    format: { type: 'string' },
                    mimeType: { type: 'string' },
                    audioBase64: { type: 'string' },
                    skippedMt: { type: 'boolean' },
                    providers: {
                      type: 'object',
                      properties: {
                        stt: { type: 'string' },
                        mt: { type: 'string', nullable: true },
                        tts: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Validation error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          '503': {
            description: 'Provider not configured',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/speech/products': {
      get: {
        summary: 'Speech Cloud product catalog',
        operationId: 'listSpeechProducts',
        responses: {
          '200': {
            description: 'Speech products and architecture honesty notes',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    products: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          status: { type: 'string', enum: ['shipped', 'partial', 'deferred'] },
                          api: { type: 'string', nullable: true },
                          console: { type: 'string', nullable: true },
                          notes: { type: 'string' },
                        },
                      },
                    },
                    architecture: { type: 'object' },
                    docs: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/v1/speech/engine': {
      get: {
        summary: 'Speech Recognition Engine catalog',
        operationId: 'getSpeechEngine',
        responses: {
          '200': {
            description: 'Capabilities, engines, and deployment honesty notes',
          },
        },
      },
    },
    '/v1/speakers/engine': {
      get: {
        summary: 'Speaker Intelligence engine catalog',
        operationId: 'getSpeakerEngine',
        responses: {
          '200': {
            description: 'Speaker capabilities and honesty notes',
          },
        },
      },
    },
    '/v1/accents/engine': {
      get: {
        summary: 'Accent Intelligence engine catalog',
        operationId: 'getAccentEngine',
        responses: {
          '200': { description: 'Accent capabilities and honesty notes' },
        },
      },
    },
    '/v1/accents/classify': {
      post: {
        summary: 'Classify spoken accent (ranked candidates)',
        operationId: 'classifyAccent',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Classification with confidence band' } },
      },
    },
    '/v1/accents/analytics': {
      get: {
        summary: 'Accent Intelligence analytics',
        operationId: 'getAccentAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Org accent detect/classify usage' } },
      },
    },
    '/v1/emotion/engine': {
      get: {
        summary: 'Emotion Intelligence engine catalog',
        operationId: 'getEmotionEngine',
        responses: { '200': { description: 'Emotion labels and capabilities' } },
      },
    },
    '/v1/emotion/detect': {
      post: {
        summary: 'Detect speech emotion from text or audio',
        operationId: 'detectEmotion',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Emotion label, confidence, ranked scores' } },
      },
    },
    '/v1/audio-intelligence/engine': {
      get: {
        summary: 'Audio Intelligence engine catalog',
        operationId: 'getAudioEngine',
        responses: { '200': { description: 'Noise/silence/enhance capabilities' } },
      },
    },
    '/v1/audio-intelligence/echo': {
      get: {
        summary: 'Echo cancellation status (deferred)',
        operationId: 'getAudioEchoStatus',
        responses: { '200': { description: 'AEC deferred status' } },
      },
    },
    '/v1/audio-intelligence/analyze': {
      post: {
        summary: 'Analyze audio for noise and silence',
        operationId: 'analyzeAudioIntelligence',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Noise/silence metrics' } },
      },
    },
    '/v1/audio-intelligence/silence': {
      post: {
        summary: 'Detect silence regions',
        operationId: 'detectAudioSilence',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Silence regions' } },
      },
    },
    '/v1/audio-intelligence/enhance': {
      post: {
        summary: 'Enhance audio (noise gate)',
        operationId: 'enhanceAudioIntelligence',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Enhanced WAV base64' } },
      },
    },
    '/v1/audio-intelligence/upscale': {
      post: {
        summary: 'Upscale audio sample rate (linear)',
        operationId: 'upscaleAudioIntelligence',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Upsampled WAV base64' } },
      },
    },
    '/v1/audio-intelligence/isolate': {
      post: {
        summary: 'Isolate voice via energy VAD',
        operationId: 'isolateAudioVoice',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Isolated WAV base64' } },
      },
    },
    '/v1/audio-intelligence/analyze/stream': {
      post: {
        summary: 'Stream audio analysis progress (SSE)',
        operationId: 'streamAudioAnalyze',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'SSE analysis events' } },
      },
    },
    '/v1/audio-intelligence/analytics': {
      get: {
        summary: 'Audio Intelligence analytics',
        operationId: 'getAudioIntelligenceAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Org audit-derived usage' } },
      },
    },
    '/v1/pronunciation/engine': {
      get: {
        summary: 'Pronunciation Intelligence engine catalog',
        operationId: 'getPronunciationEngine',
        responses: { '200': { description: 'Assessment capabilities' } },
      },
    },
    '/v1/pronunciation/assess': {
      post: {
        summary: 'Assess pronunciation vs reference',
        operationId: 'assessPronunciation',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Scores, alignment, coaching' } },
      },
    },
    '/v1/pronunciation/score': {
      post: {
        summary: 'Pronunciation scores only',
        operationId: 'scorePronunciation',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Overall/accuracy/fluency/stress' } },
      },
    },
    '/v1/pronunciation/coach': {
      post: {
        summary: 'Accent/pronunciation coaching tips',
        operationId: 'coachPronunciation',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Coaching tips + scores' } },
      },
    },
    '/v1/pronunciation/phonemes': {
      post: {
        summary: 'Approximate phonemes and word stress',
        operationId: 'pronunciationPhonemes',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Grapheme/dictionary phonemes' } },
      },
    },
    '/v1/pronunciation/fluency': {
      post: {
        summary: 'Sentence fluency from audio',
        operationId: 'pronunciationFluency',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Speaking rate + silence proxies' } },
      },
    },
    '/v1/pronunciation/assess/stream': {
      post: {
        summary: 'Stream pronunciation assessment (SSE)',
        operationId: 'streamPronunciationAssess',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'SSE assessment events' } },
      },
    },
    '/v1/pronunciation/analytics': {
      get: {
        summary: 'Pronunciation Intelligence analytics',
        operationId: 'getPronunciationAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Org audit-derived usage' } },
      },
    },
    '/v1/wake-word/engine': {
      get: {
        summary: 'Wake Word engine catalog',
        operationId: 'getWakeWordEngine',
        responses: { '200': { description: 'Wake/keyword capabilities' } },
      },
    },
    '/v1/wake-word/keywords': {
      get: {
        summary: 'List custom wake/keyword/trigger phrases',
        operationId: 'listWakeKeywords',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Workspace phrases' } },
      },
      post: {
        summary: 'Add custom wake/keyword/trigger phrase',
        operationId: 'addWakeKeyword',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '201': { description: 'Created phrase' } },
      },
    },
    '/v1/wake-word/detect': {
      post: {
        summary: 'Detect wake words in text or audio',
        operationId: 'detectWakeWord',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Wake detection hits' } },
      },
    },
    '/v1/wake-word/spot': {
      post: {
        summary: 'Spot keywords in text or audio',
        operationId: 'spotWakeKeywords',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Keyword hits' } },
      },
    },
    '/v1/wake-word/triggers': {
      post: {
        summary: 'Evaluate enterprise trigger phrases',
        operationId: 'evaluateWakeTriggers',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Fired triggers' } },
      },
    },
    '/v1/wake-word/detect/stream': {
      post: {
        summary: 'Stream wake detection (SSE)',
        operationId: 'streamWakeDetect',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'SSE wake events' } },
      },
    },
    '/v1/wake-word/analytics': {
      get: {
        summary: 'Wake Word analytics',
        operationId: 'getWakeWordAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Org audit-derived usage' } },
      },
    },
    '/v1/call-intelligence/engine': {
      get: {
        summary: 'Call Intelligence engine catalog',
        operationId: 'getCallIntelligenceEngine',
        responses: { '200': { description: 'Call analytics capabilities' } },
      },
    },
    '/v1/call-intelligence/calls': {
      get: {
        summary: 'List call records',
        operationId: 'listCallRecords',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Workspace calls' } },
      },
      post: {
        summary: 'Ingest call (transcript and/or recording)',
        operationId: 'createCallRecord',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '201': { description: 'Created call with optional analysis' } },
      },
    },
    '/v1/call-intelligence/calls/{id}/analyze': {
      post: {
        summary: 'Analyze an existing call',
        operationId: 'analyzeCallRecord',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Updated call analysis' } },
      },
    },
    '/v1/call-intelligence/report': {
      get: {
        summary: 'Call Intelligence workspace report',
        operationId: 'getCallIntelligenceReport',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Aggregated call metrics' } },
      },
    },
    '/v1/call-intelligence/analytics': {
      get: {
        summary: 'Call Intelligence analytics',
        operationId: 'getCallIntelligenceAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Org audit-derived usage' } },
      },
    },
    '/v1/call-intelligence/analyze/stream': {
      post: {
        summary: 'Stream call ingest/analyze (SSE)',
        operationId: 'streamCallAnalyze',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'SSE call events' } },
      },
    },
    '/v1/speech-analytics/engine': {
      get: {
        summary: 'Speech Analytics engine catalog',
        operationId: 'getSpeechAnalyticsEngine',
        responses: { '200': { description: 'Speech analytics capabilities' } },
      },
    },
    '/v1/speech-analytics/overview': {
      get: {
        summary: 'Speech Analytics overview',
        operationId: 'getSpeechAnalyticsOverview',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Usage + cost snapshot' } },
      },
    },
    '/v1/speech-analytics/usage': {
      get: {
        summary: 'Speech STT/TTS usage',
        operationId: 'getSpeechAnalyticsUsage',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'STT/TTS usage aggregates' } },
      },
    },
    '/v1/speech-analytics/report': {
      get: {
        summary: 'Bundled Speech Analytics report',
        operationId: 'getSpeechAnalyticsReport',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Enterprise speech report JSON' } },
      },
    },
    '/v1/speech-analytics/monitoring': {
      get: {
        summary: 'Speech Analytics monitoring snapshot',
        operationId: 'getSpeechAnalyticsMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/speakers/profiles': {
      get: {
        summary: 'List speaker profiles',
        operationId: 'listSpeakerProfiles',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Workspace speaker profiles' } },
      },
      post: {
        summary: 'Create speaker profile',
        operationId: 'createSpeakerProfile',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '201': { description: 'Created profile' } },
      },
    },
    '/v1/speakers/verify': {
      post: {
        summary: 'Verify speaker (1:1)',
        operationId: 'verifySpeaker',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Match score and decision' } },
      },
    },
    '/v1/speakers/identify': {
      post: {
        summary: 'Identify speaker (1:N)',
        operationId: 'identifySpeaker',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Top candidates and decision' } },
      },
    },
    '/v1/speakers/diarize': {
      post: {
        summary: 'Diarize speakers (gap-based over Whisper segments)',
        operationId: 'diarizeSpeech',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Speaker turns and labels' } },
      },
    },
    '/v1/speech/recognize': {
      post: {
        summary: 'Recognize speech (batch STT with segments)',
        operationId: 'recognizeSpeech',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: { type: 'string', format: 'binary' },
                  language: { type: 'string', description: 'Optional ISO-639-1; omit to auto-detect' },
                  industryPacks: {
                    type: 'string',
                    description: 'Comma-separated: medical,legal,financial,government',
                  },
                  vocabulary: { type: 'string', description: 'Comma-separated custom phrases' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Transcript with segments, timestamps, confidence' },
        },
      },
    },
    '/v1/speech/stream': {
      post: {
        summary: 'Stream speech recognition events (SSE segment stream)',
        operationId: 'streamSpeechRecognition',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: { type: 'string', format: 'binary' },
                  language: { type: 'string' },
                  industryPacks: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'text/event-stream with start, segment, done events',
          },
        },
      },
    },
    '/v1/speech/subtitles': {
      post: {
        summary: 'Generate SRT or WebVTT subtitles from audio',
        operationId: 'createSpeechSubtitles',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: {
          '200': { description: 'Subtitle file content + metadata' },
        },
      },
    },
    '/v1/speech/overview': {
      get: {
        summary: 'Speech Cloud org overview',
        operationId: 'getSpeechOverview',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': {
            description: 'Session usage, products, deferred flags, and console links',
          },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/voice-cloud/products': {
      get: {
        summary: 'Voice Cloud product catalog',
        operationId: 'listVoiceProducts',
        responses: {
          '200': {
            description: 'Voice products and architecture honesty notes',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    products: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          status: { type: 'string', enum: ['shipped', 'partial', 'deferred'] },
                          api: { type: 'string', nullable: true },
                          console: { type: 'string', nullable: true },
                          notes: { type: 'string' },
                        },
                      },
                    },
                    architecture: { type: 'object' },
                    docs: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/v1/voice-cloud/overview': {
      get: {
        summary: 'Voice Cloud org overview',
        operationId: 'getVoiceOverview',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': {
            description: 'Session TTS usage, products, deferred flags, and console links',
          },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/intelligence-cloud/products': {
      get: {
        summary: 'Intelligence Cloud product catalog',
        operationId: 'listIntelligenceProducts',
        responses: {
          '200': {
            description: 'Intelligence products and architecture honesty notes',
          },
        },
      },
    },
    '/v1/intelligence-cloud/overview': {
      get: {
        summary: 'Intelligence Cloud org overview',
        operationId: 'getIntelligenceOverview',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': {
            description: 'Session chat/embeddings usage, products, deferred flags, and console links',
          },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge-cloud/products': {
      get: {
        summary: 'Knowledge Cloud product catalog',
        operationId: 'listKnowledgeProducts',
        responses: {
          '200': {
            description: 'Knowledge products and architecture honesty notes',
          },
        },
      },
    },
    '/v1/knowledge-cloud/overview': {
      get: {
        summary: 'Knowledge Cloud org overview',
        operationId: 'getKnowledgeOverview',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': {
            description: 'Session knowledge doc/chunk counts, products, deferred flags, and console links',
          },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/inference-cloud/products': {
      get: {
        summary: 'Inference Cloud product catalog',
        operationId: 'listInferenceProducts',
        responses: {
          '200': {
            description: 'Inference products and architecture honesty notes',
          },
        },
      },
    },
    '/v1/ai-kernel/products': {
      get: {
        summary: 'AI Kernel runtime catalog',
        operationId: 'listAiKernelRuntimes',
        responses: {
          '200': {
            description: 'Internal kernel runtimes, architecture, and safety notes',
          },
        },
      },
    },
    '/v1/ai-kernel/engine': {
      get: {
        summary: 'AI Kernel engine (alias of products)',
        operationId: 'getAiKernelEngine',
        responses: {
          '200': { description: 'Kernel catalog + honesty' },
        },
      },
    },
    '/v1/ai-kernel/overview': {
      get: {
        summary: 'AI Kernel org overview',
        operationId: 'getAiKernelOverview',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': {
            description: 'Session usage, deferred runtimes, safety notes',
          },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/ai-kernel/monitoring': {
      get: {
        summary: 'AI Kernel foundation monitoring',
        operationId: 'getAiKernelMonitoring',
        responses: {
          '200': { description: 'Runtime status snapshot + safety honesty' },
        },
      },
    },
    '/v1/foundation-model-cloud/products': {
      get: {
        summary: 'Foundation Model Cloud product catalog',
        operationId: 'listFoundationModelCloudProducts',
        responses: {
          '200': {
            description:
              'Model-family catalog, architecture, and honesty (no trained competitive weights)',
          },
        },
      },
    },
    '/v1/foundation-model-cloud/engine': {
      get: {
        summary: 'Foundation Model Cloud engine (alias of products)',
        operationId: 'getFoundationModelCloudEngine',
        responses: {
          '200': { description: 'FMC catalog + honesty' },
        },
      },
    },
    '/v1/foundation-model-cloud/overview': {
      get: {
        summary: 'Foundation Model Cloud org overview',
        operationId: 'getFoundationModelCloudOverview',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': {
            description: 'Session usage, deferred model families, honesty notes',
          },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/foundation-model-cloud/monitoring': {
      get: {
        summary: 'Foundation Model Cloud foundation monitoring',
        operationId: 'getFoundationModelCloudMonitoring',
        responses: {
          '200': { description: 'Product status snapshot + honesty' },
        },
      },
    },
    '/v1/model-training-platform/engine': {
      get: {
        summary: 'Model Training Platform engine catalog',
        operationId: 'getModelTrainingPlatformEngine',
        responses: {
          '200': {
            description:
              'Training methods, ceilings, launchers, honesty (no distributed/RLHF lab)',
          },
        },
      },
    },
    '/v1/model-training-platform/methods': {
      get: {
        summary: 'Model Training Platform methods',
        operationId: 'listModelTrainingMethods',
        responses: {
          '200': { description: 'LoRA/instruction launchable; RLHF/DPO deferred' },
        },
      },
    },
    '/v1/model-training-platform/overview': {
      get: {
        summary: 'Model Training Platform org overview',
        operationId: 'getModelTrainingPlatformOverview',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Session usage, experiments, deferred methods' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/model-training-platform/experiments': {
      get: {
        summary: 'List training experiment plans',
        operationId: 'listModelTrainingExperiments',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Org-scoped sandbox experiments' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
      post: {
        summary: 'Create training experiment plan',
        operationId: 'createModelTrainingExperiment',
        security: [{ ClerkAuth: [] }],
        responses: {
          '201': { description: 'Experiment plan created' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/model-training-platform/monitoring': {
      get: {
        summary: 'Model Training Platform monitoring',
        operationId: 'getModelTrainingPlatformMonitoring',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Experiment status snapshot + honesty' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/model-evaluation-platform/engine': {
      get: {
        summary: 'Model Evaluation Platform engine catalog',
        operationId: 'getModelEvaluationPlatformEngine',
        responses: {
          '200': {
            description:
              'Eval suites, ceilings, coverage link, honesty (no global leaderboard/SOTA)',
          },
        },
      },
    },
    '/v1/model-evaluation-platform/suites': {
      get: {
        summary: 'Model Evaluation Platform suites',
        operationId: 'listModelEvaluationSuites',
        responses: {
          '200': {
            description: 'Translation/bias/safety/latency runnable; MMLU/HumanEval deferred',
          },
        },
      },
    },
    '/v1/model-evaluation-platform/overview': {
      get: {
        summary: 'Model Evaluation Platform org overview',
        operationId: 'getModelEvaluationPlatformOverview',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Session usage, runs, deferred suites' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/model-evaluation-platform/runs': {
      get: {
        summary: 'List evaluation runs',
        operationId: 'listModelEvaluationRuns',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Org-scoped sandbox/handoff runs' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
      post: {
        summary: 'Create evaluation run',
        operationId: 'createModelEvaluationRun',
        security: [{ ClerkAuth: [] }],
        responses: {
          '201': { description: 'Run created (and executed unless execute=false)' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/model-evaluation-platform/leaderboard': {
      get: {
        summary: 'Org-scoped evaluation leaderboard',
        operationId: 'getModelEvaluationLeaderboard',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Local ranks only — not public SOTA board' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/model-evaluation-platform/reports': {
      get: {
        summary: 'Evaluation reports aggregate',
        operationId: 'getModelEvaluationReports',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Run aggregates + coverage snapshot' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/model-evaluation-platform/monitoring': {
      get: {
        summary: 'Model Evaluation Platform monitoring',
        operationId: 'getModelEvaluationPlatformMonitoring',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Run status snapshot + honesty' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/model-registry/engine': {
      get: {
        summary: 'Model Registry hub engine',
        operationId: 'getModelRegistryEngine',
        responses: {
          '200': {
            description:
              'Cards/versions/deploy capabilities + VL-110 live summary (not MLflow/mesh OS)',
          },
        },
      },
    },
    '/v1/model-registry/capabilities': {
      get: {
        summary: 'Model Registry capabilities',
        operationId: 'listModelRegistryCapabilities',
        responses: {
          '200': { description: 'Registry governance capabilities + honesty' },
        },
      },
    },
    '/v1/model-registry/cards': {
      get: {
        summary: 'Model cards from VL-110 entries',
        operationId: 'listModelRegistryCards',
        responses: {
          '200': { description: 'Lightweight cards derived from registry metadata' },
        },
      },
    },
    '/v1/model-registry/overview': {
      get: {
        summary: 'Model Registry org overview',
        operationId: 'getModelRegistryOverview',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Session usage, versions, deployments' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/model-registry/versions': {
      get: {
        summary: 'List sandbox model versions',
        operationId: 'listModelRegistryVersions',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Org-scoped sandbox versions' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
      post: {
        summary: 'Create sandbox model version',
        operationId: 'createModelRegistryVersion',
        security: [{ ClerkAuth: [] }],
        responses: {
          '201': { description: 'Version created' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/model-registry/deployments': {
      get: {
        summary: 'List sandbox deployment plans',
        operationId: 'listModelRegistryDeployments',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Org-scoped deploy plans' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
      post: {
        summary: 'Create sandbox deployment plan',
        operationId: 'createModelRegistryDeployment',
        security: [{ ClerkAuth: [] }],
        responses: {
          '201': { description: 'Deploy plan + Model Serving handoff' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/model-registry/monitoring': {
      get: {
        summary: 'Model Registry monitoring',
        operationId: 'getModelRegistryMonitoring',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Version/deploy status snapshot + honesty' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/atlas/engine': {
      get: {
        summary: 'Atlas family scaffold engine',
        operationId: 'getAtlasEngine',
        responses: {
          '200': {
            description:
              'Atlas capability map + honesty (scaffold only — no trained weights)',
          },
        },
      },
    },
    '/v1/atlas/capabilities': {
      get: {
        summary: 'Atlas capabilities',
        operationId: 'listAtlasCapabilities',
        responses: {
          '200': { description: 'Reasoning/planning handoffs; specialists deferred' },
        },
      },
    },
    '/v1/atlas/overview': {
      get: {
        summary: 'Atlas org overview',
        operationId: 'getAtlasOverview',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Session usage, deferred specialists, links' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/atlas/monitoring': {
      get: {
        summary: 'Atlas scaffold monitoring',
        operationId: 'getAtlasMonitoring',
        responses: {
          '200': { description: 'Capability status snapshot + honesty' },
        },
      },
    },
    '/v1/ai-fabric/products': {
      get: {
        summary: 'AI Fabric bus catalog',
        operationId: 'listAiFabricBuses',
        responses: {
          '200': {
            description:
              'Internal fabric buses, architecture, and policy hard-gate honesty',
          },
        },
      },
    },
    '/v1/ai-fabric/engine': {
      get: {
        summary: 'AI Fabric engine (alias of products)',
        operationId: 'getAiFabricEngine',
        responses: {
          '200': { description: 'Fabric catalog + honesty' },
        },
      },
    },
    '/v1/ai-fabric/routing': {
      get: {
        summary: 'AI Fabric service-discovery routing table',
        operationId: 'getAiFabricRouting',
        responses: {
          '200': { description: 'Static cloud/runtime route catalog' },
        },
      },
    },
    '/v1/ai-fabric/overview': {
      get: {
        summary: 'AI Fabric org overview',
        operationId: 'getAiFabricOverview',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Session usage, deferred buses, safety notes' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/ai-fabric/monitoring': {
      get: {
        summary: 'AI Fabric foundation monitoring',
        operationId: 'getAiFabricMonitoring',
        responses: {
          '200': { description: 'Bus status snapshot + honesty' },
        },
      },
    },
    '/v1/event-fabric/products': {
      get: {
        summary: 'Event Fabric capability catalog',
        operationId: 'listEventFabricProducts',
        responses: {
          '200': {
            description:
              'Event bus capabilities, brokers, Redis Streams honesty, deferred Kafka/NATS/Rabbit',
          },
        },
      },
    },
    '/v1/event-fabric/engine': {
      get: {
        summary: 'Event Fabric engine (alias of products)',
        operationId: 'getEventFabricEngine',
        responses: { '200': { description: 'Catalog + honesty' } },
      },
    },
    '/v1/event-fabric/brokers': {
      get: {
        summary: 'Event Fabric broker catalog',
        operationId: 'listEventFabricBrokers',
        responses: { '200': { description: 'Active Redis Streams + deferred adapters' } },
      },
    },
    '/v1/event-fabric/events': {
      get: {
        summary: 'Poll / consume CloudEvents from a topic',
        operationId: 'pollEventFabricEvents',
        parameters: [
          { name: 'topic', in: 'query', schema: { type: 'string' } },
          { name: 'count', in: 'query', schema: { type: 'integer' } },
          { name: 'eventVersion', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'CloudEvents batch' } },
      },
      post: {
        summary: 'Publish a CloudEvent',
        operationId: 'publishEventFabricEvent',
        responses: { '201': { description: 'Published CloudEvent' } },
      },
    },
    '/v1/event-fabric/events/{streamId}/fail': {
      post: {
        summary: 'Mark event failed (retry or DLQ)',
        operationId: 'failEventFabricEvent',
        parameters: [
          { name: 'streamId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'retry or dlq action' } },
      },
    },
    '/v1/event-fabric/dlq': {
      get: {
        summary: 'List dead-letter events',
        operationId: 'listEventFabricDlq',
        parameters: [{ name: 'topic', in: 'query', schema: { type: 'string' } }],
        responses: { '200': { description: 'DLQ events' } },
      },
    },
    '/v1/event-fabric/dlq/retry': {
      post: {
        summary: 'Requeue an event from DLQ',
        operationId: 'retryEventFabricDlq',
        responses: { '200': { description: 'Republished event' } },
      },
    },
    '/v1/event-fabric/replay': {
      post: {
        summary: 'Replay events from a stream offset',
        operationId: 'replayEventFabric',
        responses: { '200': { description: 'Replayed CloudEvents' } },
      },
    },
    '/v1/event-fabric/snapshots': {
      get: {
        summary: 'Consumer-group cursor snapshots',
        operationId: 'listEventFabricSnapshots',
        responses: { '200': { description: 'Snapshots' } },
      },
    },
    '/v1/event-fabric/analytics': {
      get: {
        summary: 'Event Fabric analytics',
        operationId: 'getEventFabricAnalytics',
        responses: { '200': { description: 'Per-topic publish/consume/DLQ counts' } },
      },
    },
    '/v1/event-fabric/overview': {
      get: {
        summary: 'Event Fabric org overview',
        operationId: 'getEventFabricOverview',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Session + brokers + analytics' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/event-fabric/monitoring': {
      get: {
        summary: 'Event Fabric monitoring',
        operationId: 'getEventFabricMonitoring',
        responses: { '200': { description: 'Backend + counters + honesty' } },
      },
    },
    '/v1/context-fabric/products': {
      get: {
        summary: 'Context Fabric capability catalog',
        operationId: 'listContextFabricProducts',
        responses: {
          '200': {
            description:
              'Context kinds, router routes, honesty (extends Context Runtime)',
          },
        },
      },
    },
    '/v1/context-fabric/engine': {
      get: {
        summary: 'Context Fabric engine (alias of products)',
        operationId: 'getContextFabricEngine',
        responses: { '200': { description: 'Catalog + honesty' } },
      },
    },
    '/v1/context-fabric/routes': {
      get: {
        summary: 'Context Fabric routing table',
        operationId: 'listContextFabricRoutes',
        responses: { '200': { description: 'kind → cloud/runtime handoffs' } },
      },
    },
    '/v1/context-fabric/route': {
      post: {
        summary: 'Plan context routing for selected kinds',
        operationId: 'planContextFabricRoute',
        responses: { '200': { description: 'Router plan + include map' } },
      },
    },
    '/v1/context-fabric/propagate': {
      post: {
        summary: 'Propagate context via Context Runtime assemble',
        operationId: 'propagateContextFabric',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Assembled context + optional Event Fabric event' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/context-fabric/stream': {
      get: {
        summary: 'Context Fabric SSE realtime ticks',
        operationId: 'streamContextFabric',
        responses: { '200': { description: 'text/event-stream ticks (not WebSocket OS)' } },
      },
    },
    '/v1/context-fabric/overview': {
      get: {
        summary: 'Context Fabric org overview',
        operationId: 'getContextFabricOverview',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Session + routes + counters' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/context-fabric/monitoring': {
      get: {
        summary: 'Context Fabric monitoring',
        operationId: 'getContextFabricMonitoring',
        responses: { '200': { description: 'Counters + honesty' } },
      },
    },
    '/v1/knowledge-fabric/products': {
      get: {
        summary: 'Knowledge Fabric capability catalog',
        operationId: 'listKnowledgeFabricProducts',
        responses: {
          '200': {
            description:
              'Knowledge router capabilities, routes, Knowledge Cloud handoff honesty',
          },
        },
      },
    },
    '/v1/knowledge-fabric/engine': {
      get: {
        summary: 'Knowledge Fabric engine (alias of products)',
        operationId: 'getKnowledgeFabricEngine',
        responses: { '200': { description: 'Catalog + honesty' } },
      },
    },
    '/v1/knowledge-fabric/routes': {
      get: {
        summary: 'Knowledge Fabric routing table',
        operationId: 'listKnowledgeFabricRoutes',
        responses: { '200': { description: 'kind → Knowledge Cloud/Search/RAG handoffs' } },
      },
    },
    '/v1/knowledge-fabric/route': {
      post: {
        summary: 'Plan knowledge routing for selected kinds',
        operationId: 'planKnowledgeFabricRoute',
        responses: { '200': { description: 'Router plan' } },
      },
    },
    '/v1/knowledge-fabric/distribute': {
      post: {
        summary: 'Plan knowledge distribution to same-org workspaces',
        operationId: 'distributeKnowledgeFabric',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Distribution plan + optional Event Fabric event' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge-fabric/sync': {
      post: {
        summary: 'Plan knowledge sync between same-org workspaces',
        operationId: 'syncKnowledgeFabric',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Sync cursor/plan + optional Event Fabric event' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge-fabric/federate': {
      post: {
        summary: 'List knowledge federation handoff targets',
        operationId: 'federateKnowledgeFabric',
        responses: { '200': { description: 'Federation handoff catalog' } },
      },
    },
    '/v1/knowledge-fabric/overview': {
      get: {
        summary: 'Knowledge Fabric org overview',
        operationId: 'getKnowledgeFabricOverview',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Session + routes + peer workspaces' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge-fabric/monitoring': {
      get: {
        summary: 'Knowledge Fabric monitoring',
        operationId: 'getKnowledgeFabricMonitoring',
        responses: { '200': { description: 'Counters + recent plans + honesty' } },
      },
    },
    '/v1/prompt-fabric/products': {
      get: {
        summary: 'Prompt Fabric capability catalog',
        operationId: 'listPromptFabricProducts',
        responses: {
          '200': {
            description:
              'Prompt router capabilities, Prompt Runtime handoff, policy honesty',
          },
        },
      },
    },
    '/v1/prompt-fabric/engine': {
      get: {
        summary: 'Prompt Fabric engine (alias of products)',
        operationId: 'getPromptFabricEngine',
        responses: { '200': { description: 'Catalog + honesty' } },
      },
    },
    '/v1/prompt-fabric/routes': {
      get: {
        summary: 'Prompt Fabric routing table',
        operationId: 'listPromptFabricRoutes',
        responses: { '200': { description: 'kind → Prompt Runtime / cloud handoffs' } },
      },
    },
    '/v1/prompt-fabric/route': {
      post: {
        summary: 'Plan prompt routing for kinds/features',
        operationId: 'planPromptFabricRoute',
        responses: { '200': { description: 'Router plan + optional runtime route' } },
      },
    },
    '/v1/prompt-fabric/versions': {
      get: {
        summary: 'List prompt versions via Prompt Runtime',
        operationId: 'listPromptFabricVersions',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        parameters: [{ name: 'key', in: 'query', schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Version list' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/prompt-fabric/validate': {
      post: {
        summary: 'Validate a prompt via Prompt Runtime',
        operationId: 'validatePromptFabric',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Validation findings' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/prompt-fabric/policies': {
      get: {
        summary: 'Prompt policy handoff (Policy Runtime)',
        operationId: 'getPromptFabricPolicies',
        responses: { '200': { description: 'Policy Runtime discovery + Policy Fabric deferral' } },
      },
    },
    '/v1/prompt-fabric/distribute': {
      post: {
        summary: 'Plan prompt distribution to same-org workspaces',
        operationId: 'distributePromptFabric',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Distribution plan + optional Event Fabric event' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/prompt-fabric/sync': {
      post: {
        summary: 'Plan prompt sync between same-org workspaces',
        operationId: 'syncPromptFabric',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Sync cursor/plan + optional Event Fabric event' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/prompt-fabric/overview': {
      get: {
        summary: 'Prompt Fabric org overview',
        operationId: 'getPromptFabricOverview',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Session + routes + counters' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/prompt-fabric/monitoring': {
      get: {
        summary: 'Prompt Fabric monitoring',
        operationId: 'getPromptFabricMonitoring',
        responses: { '200': { description: 'Counters + recent plans + honesty' } },
      },
    },
    '/v1/reasoning-fabric/products': {
      get: {
        summary: 'Reasoning Fabric capability catalog',
        operationId: 'listReasoningFabricProducts',
        responses: {
          '200': {
            description:
              'Reasoning router capabilities, pipelines, Runtime handoff honesty',
          },
        },
      },
    },
    '/v1/reasoning-fabric/engine': {
      get: {
        summary: 'Reasoning Fabric engine (alias of products)',
        operationId: 'getReasoningFabricEngine',
        responses: { '200': { description: 'Catalog + honesty' } },
      },
    },
    '/v1/reasoning-fabric/routes': {
      get: {
        summary: 'Reasoning Fabric routing table',
        operationId: 'listReasoningFabricRoutes',
        responses: { '200': { description: 'kind → Runtime/Cloud handoffs' } },
      },
    },
    '/v1/reasoning-fabric/route': {
      post: {
        summary: 'Plan reasoning routing for selected kinds',
        operationId: 'planReasoningFabricRoute',
        responses: { '200': { description: 'Router plan' } },
      },
    },
    '/v1/reasoning-fabric/pipeline': {
      post: {
        summary: 'Plan a reasoning pipeline (ordered Runtime handoffs)',
        operationId: 'planReasoningFabricPipeline',
        responses: { '200': { description: 'Pipeline + routed steps' } },
      },
    },
    '/v1/reasoning-fabric/versions': {
      get: {
        summary: 'Reasoning Fabric version catalog',
        operationId: 'listReasoningFabricVersions',
        responses: { '200': { description: 'Pipeline/router/strategy versions' } },
      },
    },
    '/v1/reasoning-fabric/cache': {
      get: {
        summary: 'Reasoning cache handoff (Intelligent Cache)',
        operationId: 'getReasoningFabricCache',
        responses: { '200': { description: 'Intelligent Cache discovery' } },
      },
    },
    '/v1/reasoning-fabric/federate': {
      post: {
        summary: 'List reasoning federation handoff targets',
        operationId: 'federateReasoningFabric',
        responses: { '200': { description: 'Federation handoff catalog' } },
      },
    },
    '/v1/reasoning-fabric/history': {
      get: {
        summary: 'Reasoning history via Reasoning Runtime',
        operationId: 'listReasoningFabricHistory',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'History runs' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/reasoning-fabric/replay/{id}': {
      get: {
        summary: 'Replay a reasoning run via Reasoning Runtime',
        operationId: 'replayReasoningFabric',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Replayed run' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/reasoning-fabric/distribute': {
      post: {
        summary: 'Plan reasoning distribution to same-org workspaces',
        operationId: 'distributeReasoningFabric',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Distribution plan + optional Event Fabric event' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/reasoning-fabric/overview': {
      get: {
        summary: 'Reasoning Fabric org overview',
        operationId: 'getReasoningFabricOverview',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Session + pipelines + counters' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/reasoning-fabric/monitoring': {
      get: {
        summary: 'Reasoning Fabric monitoring',
        operationId: 'getReasoningFabricMonitoring',
        responses: { '200': { description: 'Counters + honesty' } },
      },
    },
    '/v1/agent-fabric/products': {
      get: {
        summary: 'Agent Fabric capability catalog',
        operationId: 'listAgentFabricProducts',
        responses: {
          '200': {
            description:
              'Agent router capabilities, pipelines, Runtime handoff honesty',
          },
        },
      },
    },
    '/v1/agent-fabric/engine': {
      get: {
        summary: 'Agent Fabric engine (alias of products)',
        operationId: 'getAgentFabricEngine',
        responses: { '200': { description: 'Catalog + honesty' } },
      },
    },
    '/v1/agent-fabric/routes': {
      get: {
        summary: 'Agent Fabric routing table',
        operationId: 'listAgentFabricRoutes',
        responses: { '200': { description: 'kind → Runtime/Policy handoffs' } },
      },
    },
    '/v1/agent-fabric/route': {
      post: {
        summary: 'Plan agent routing for selected kinds',
        operationId: 'planAgentFabricRoute',
        responses: { '200': { description: 'Router plan' } },
      },
    },
    '/v1/agent-fabric/pipeline': {
      post: {
        summary: 'Plan an agent pipeline (ordered Runtime handoffs)',
        operationId: 'planAgentFabricPipeline',
        responses: { '200': { description: 'Pipeline + routed steps' } },
      },
    },
    '/v1/agent-fabric/versions': {
      get: {
        summary: 'Agent Fabric version catalog',
        operationId: 'listAgentFabricVersions',
        responses: { '200': { description: 'Router/pipeline/sandbox versions' } },
      },
    },
    '/v1/agent-fabric/federate': {
      post: {
        summary: 'List agent federation handoff targets',
        operationId: 'federateAgentFabric',
        responses: { '200': { description: 'Federation handoff catalog' } },
      },
    },
    '/v1/agent-fabric/discover': {
      get: {
        summary: 'Discover workspace agents via Agent Runtime',
        operationId: 'discoverAgentFabric',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Agent list' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/agent-fabric/collaborate': {
      post: {
        summary: 'Sandbox agent collaboration via Agent Runtime',
        operationId: 'collaborateAgentFabric',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Collaboration session' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/agent-fabric/schedule': {
      post: {
        summary: 'Schedule stub via Agent Runtime',
        operationId: 'scheduleAgentFabric',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Schedule record' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/agent-fabric/marketplace': {
      get: {
        summary: 'Agent marketplace listing counts',
        operationId: 'marketplaceAgentFabric',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Listing counts' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/agent-fabric/distribute': {
      post: {
        summary: 'Plan agent distribution to same-org workspaces',
        operationId: 'distributeAgentFabric',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Distribution plan + optional Event Fabric event' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/agent-fabric/stream': {
      get: {
        summary: 'Agent Fabric SSE realtime ticks',
        operationId: 'streamAgentFabric',
        responses: { '200': { description: 'text/event-stream ticks' } },
      },
    },
    '/v1/agent-fabric/overview': {
      get: {
        summary: 'Agent Fabric org overview',
        operationId: 'getAgentFabricOverview',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Session + pipelines + counters' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/agent-fabric/monitoring': {
      get: {
        summary: 'Agent Fabric monitoring',
        operationId: 'getAgentFabricMonitoring',
        responses: { '200': { description: 'Counters + honesty' } },
      },
    },
    '/v1/memory-fabric/products': {
      get: {
        summary: 'Memory Fabric capability catalog',
        operationId: 'listMemoryFabricProducts',
        responses: {
          '200': {
            description:
              'Memory router capabilities, pipelines, Runtime handoff honesty',
          },
        },
      },
    },
    '/v1/memory-fabric/engine': {
      get: {
        summary: 'Memory Fabric engine (alias of products)',
        operationId: 'getMemoryFabricEngine',
        responses: { '200': { description: 'Catalog + honesty' } },
      },
    },
    '/v1/memory-fabric/routes': {
      get: {
        summary: 'Memory Fabric routing table',
        operationId: 'listMemoryFabricRoutes',
        responses: { '200': { description: 'kind → Runtime/Cloud handoffs' } },
      },
    },
    '/v1/memory-fabric/route': {
      post: {
        summary: 'Plan memory routing for selected kinds',
        operationId: 'planMemoryFabricRoute',
        responses: { '200': { description: 'Router plan' } },
      },
    },
    '/v1/memory-fabric/pipeline': {
      post: {
        summary: 'Plan a memory pipeline (ordered Runtime handoffs)',
        operationId: 'planMemoryFabricPipeline',
        responses: { '200': { description: 'Pipeline + routed steps' } },
      },
    },
    '/v1/memory-fabric/versions': {
      get: {
        summary: 'Memory Fabric version catalog',
        operationId: 'listMemoryFabricVersions',
        responses: { '200': { description: 'Router/pipeline/sync versions' } },
      },
    },
    '/v1/memory-fabric/cache': {
      get: {
        summary: 'Memory cache handoff (Intelligent Cache)',
        operationId: 'getMemoryFabricCache',
        responses: { '200': { description: 'Intelligent Cache discovery' } },
      },
    },
    '/v1/memory-fabric/federate': {
      post: {
        summary: 'List memory federation handoff targets',
        operationId: 'federateMemoryFabric',
        responses: { '200': { description: 'Federation handoff catalog' } },
      },
    },
    '/v1/memory-fabric/sync': {
      post: {
        summary: 'Sandbox memory sync via Memory Runtime',
        operationId: 'syncMemoryFabric',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Sync stamp result' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/memory-fabric/memories': {
      get: {
        summary: 'List memories via Memory Runtime',
        operationId: 'listMemoryFabricMemories',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Memory list' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/memory-fabric/search': {
      post: {
        summary: 'Search memories via Memory Runtime',
        operationId: 'searchMemoryFabric',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Search hits' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/memory-fabric/replicate': {
      post: {
        summary: 'Plan same-org memory replication',
        operationId: 'replicateMemoryFabric',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Replication plan' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/memory-fabric/distribute': {
      post: {
        summary: 'Plan memory distribution to same-org workspaces',
        operationId: 'distributeMemoryFabric',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Distribution plan + optional Event Fabric event' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/memory-fabric/overview': {
      get: {
        summary: 'Memory Fabric org overview',
        operationId: 'getMemoryFabricOverview',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': { description: 'Session + pipelines + counters' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/memory-fabric/monitoring': {
      get: {
        summary: 'Memory Fabric monitoring',
        operationId: 'getMemoryFabricMonitoring',
        responses: { '200': { description: 'Counters + honesty' } },
      },
    },
    '/v1/memory-runtime/engine': {
      get: {
        summary: 'Memory Runtime catalog',
        operationId: 'getMemoryRuntimeEngine',
        responses: {
          '200': { description: 'Kernel memory capabilities and honesty' },
        },
      },
    },
    '/v1/memory-runtime/scopes': {
      get: {
        summary: 'Memory Runtime scopes/kinds',
        operationId: 'listMemoryRuntimeScopes',
        responses: { '200': { description: 'Kernel scopes and kinds' } },
      },
    },
    '/v1/memory-runtime/ceilings': {
      get: {
        summary: 'Memory Runtime entry ceilings',
        operationId: 'getMemoryRuntimeCeilings',
        responses: { '200': { description: 'maxEntriesPerWorkspace' } },
      },
    },
    '/v1/memory-runtime/memories': {
      get: {
        summary: 'List kernel memories',
        operationId: 'listMemoryRuntimeMemories',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Kernel-layer MemoryRecords' } },
      },
    },
    '/v1/memory-runtime/put': {
      post: {
        summary: 'Put kernel memory',
        operationId: 'putMemoryRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: {
          '201': { description: 'Memory stored' },
          '402': { description: 'Hard entry ceiling exceeded' },
        },
      },
    },
    '/v1/memory-runtime/search': {
      post: {
        summary: 'Search kernel memories',
        operationId: 'searchMemoryRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Text search results' } },
      },
    },
    '/v1/memory-runtime/revise': {
      post: {
        summary: 'Revise kernel memory (version bump)',
        operationId: 'reviseMemoryRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Revised memory' } },
      },
    },
    '/v1/memory-runtime/compress': {
      post: {
        summary: 'Heuristic compress kernel memory',
        operationId: 'compressMemoryRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Compressed memory' } },
      },
    },
    '/v1/memory-runtime/evict': {
      post: {
        summary: 'Evict kernel memories (TTL + ceiling)',
        operationId: 'evictMemoryRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Eviction counts' } },
      },
    },
    '/v1/memory-runtime/sync': {
      post: {
        summary: 'Sandbox sync stamp',
        operationId: 'syncMemoryRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Sync stamp applied' } },
      },
    },
    '/v1/memory-runtime/snapshots': {
      get: {
        summary: 'List kernel memory snapshots',
        operationId: 'listMemoryRuntimeSnapshots',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Snapshots' } },
      },
      post: {
        summary: 'Create kernel memory snapshot',
        operationId: 'createMemoryRuntimeSnapshot',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '201': { description: 'Snapshot created' } },
      },
    },
    '/v1/memory-runtime/analytics': {
      get: {
        summary: 'Memory Runtime analytics',
        operationId: 'getMemoryRuntimeAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Aggregates' } },
      },
    },
    '/v1/memory-runtime/monitoring': {
      get: {
        summary: 'Memory Runtime monitoring',
        operationId: 'getMemoryRuntimeMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring + honesty' } },
      },
    },
    '/v1/prompt-runtime/engine': {
      get: {
        summary: 'Prompt Runtime catalog',
        operationId: 'getPromptRuntimeEngine',
        responses: {
          '200': { description: 'Kernel prompt capabilities and honesty' },
        },
      },
    },
    '/v1/prompt-runtime/keys': {
      get: {
        summary: 'Prompt Runtime keys',
        operationId: 'listPromptRuntimeKeys',
        responses: { '200': { description: 'Managed prompt keys' } },
      },
    },
    '/v1/prompt-runtime/routes': {
      get: {
        summary: 'Prompt Runtime feature routes',
        operationId: 'listPromptRuntimeRoutes',
        responses: { '200': { description: 'Sandbox feature→key map' } },
      },
    },
    '/v1/prompt-runtime/registry': {
      get: {
        summary: 'Prompt Runtime registry façade',
        operationId: 'getPromptRuntimeRegistry',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'VL-086 registry rows' } },
      },
    },
    '/v1/prompt-runtime/templates': {
      get: {
        summary: 'Prompt Runtime templates',
        operationId: 'listPromptRuntimeTemplates',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Templates + variables' } },
      },
    },
    '/v1/prompt-runtime/versions': {
      get: {
        summary: 'Prompt Runtime versions',
        operationId: 'listPromptRuntimeVersions',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Version list for key' } },
      },
    },
    '/v1/prompt-runtime/route': {
      post: {
        summary: 'Route feature to prompt key',
        operationId: 'routePromptRuntime',
        responses: { '200': { description: 'Sandbox route result' } },
      },
    },
    '/v1/prompt-runtime/render': {
      post: {
        summary: 'Render prompt variables',
        operationId: 'renderPromptRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Rendered body' } },
      },
    },
    '/v1/prompt-runtime/validate': {
      post: {
        summary: 'Validate rendered prompt',
        operationId: 'validatePromptRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Heuristic validation' } },
      },
    },
    '/v1/prompt-runtime/security-scan': {
      post: {
        summary: 'Security-scan prompt',
        operationId: 'securityScanPromptRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Pattern scan via Prompt Intelligence' } },
      },
    },
    '/v1/prompt-runtime/optimize': {
      post: {
        summary: 'Heuristic optimize prompt',
        operationId: 'optimizePromptRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Trim/tips stub' } },
      },
    },
    '/v1/prompt-runtime/execute': {
      post: {
        summary: 'Execute prompt (resolve/render/validate)',
        operationId: 'executePromptRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: {
          '200': { description: 'Rendered prompt (no LLM call)' },
          '400': { description: 'Validation or security failure' },
        },
      },
    },
    '/v1/prompt-runtime/analytics': {
      get: {
        summary: 'Prompt Runtime analytics',
        operationId: 'getPromptRuntimeAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Aggregates' } },
      },
    },
    '/v1/prompt-runtime/monitoring': {
      get: {
        summary: 'Prompt Runtime monitoring',
        operationId: 'getPromptRuntimeMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring + honesty' } },
      },
    },
    '/v1/context-runtime/engine': {
      get: {
        summary: 'Context Runtime catalog',
        operationId: 'getContextRuntimeEngine',
        responses: {
          '200': { description: 'Kernel context capabilities and honesty' },
        },
      },
    },
    '/v1/context-runtime/scopes': {
      get: {
        summary: 'Context Runtime scopes/priorities',
        operationId: 'listContextRuntimeScopes',
        responses: { '200': { description: 'Context kinds and priorities' } },
      },
    },
    '/v1/context-runtime/assemble': {
      post: {
        summary: 'Assemble kernel context',
        operationId: 'assembleContextRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Assembled promptContext + blocks' } },
      },
    },
    '/v1/context-runtime/retrieve': {
      post: {
        summary: 'Retrieve kernel context',
        operationId: 'retrieveContextRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Retrieve façade over assemble' } },
      },
    },
    '/v1/context-runtime/prioritize': {
      post: {
        summary: 'Prioritize context blocks',
        operationId: 'prioritizeContextRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Reordered blocks' } },
      },
    },
    '/v1/context-runtime/compress': {
      post: {
        summary: 'Compress context blocks',
        operationId: 'compressContextRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Char-budget truncation' } },
      },
    },
    '/v1/context-runtime/analytics': {
      get: {
        summary: 'Context Runtime analytics',
        operationId: 'getContextRuntimeAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Aggregates' } },
      },
    },
    '/v1/context-runtime/monitoring': {
      get: {
        summary: 'Context Runtime monitoring',
        operationId: 'getContextRuntimeMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring + honesty' } },
      },
    },
    '/v1/reasoning-runtime/engine': {
      get: {
        summary: 'Reasoning Runtime catalog',
        operationId: 'getReasoningRuntimeEngine',
        responses: {
          '200': { description: 'Kernel reasoning capabilities and honesty' },
        },
      },
    },
    '/v1/reasoning-runtime/reason': {
      post: {
        summary: 'Run kernel reasoning',
        operationId: 'reasonReasoningRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Reasoned answer + eval/confidence' } },
      },
    },
    '/v1/reasoning-runtime/plan': {
      post: {
        summary: 'Plan via Reasoning Runtime',
        operationId: 'planReasoningRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Plan steps' } },
      },
    },
    '/v1/reasoning-runtime/reflect': {
      post: {
        summary: 'Reflect on an answer',
        operationId: 'reflectReasoningRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Heuristic critiques' } },
      },
    },
    '/v1/reasoning-runtime/select-tools': {
      post: {
        summary: 'Select tools (no execution)',
        operationId: 'selectToolsReasoningRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Suggested tool ids' } },
      },
    },
    '/v1/reasoning-runtime/select-model': {
      post: {
        summary: 'Select model via AI Router',
        operationId: 'selectModelReasoningRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Model selection' } },
      },
    },
    '/v1/reasoning-runtime/decision-tree': {
      post: {
        summary: 'Sandbox decision tree',
        operationId: 'decisionTreeReasoningRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Decision tree façade' } },
      },
    },
    '/v1/reasoning-runtime/evaluate': {
      post: {
        summary: 'Self-evaluate answer',
        operationId: 'evaluateReasoningRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Heuristic evaluation' } },
      },
    },
    '/v1/reasoning-runtime/confidence': {
      post: {
        summary: 'Confidence score',
        operationId: 'confidenceReasoningRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Blended confidence' } },
      },
    },
    '/v1/reasoning-runtime/history': {
      get: {
        summary: 'Reasoning history',
        operationId: 'listReasoningRuntimeHistory',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Stored runs' } },
      },
    },
    '/v1/reasoning-runtime/history/{id}': {
      get: {
        summary: 'Replay reasoning run',
        operationId: 'replayReasoningRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: { '200': { description: 'Stored run payload' } },
      },
    },
    '/v1/reasoning-runtime/analytics': {
      get: {
        summary: 'Reasoning Runtime analytics',
        operationId: 'getReasoningRuntimeAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Aggregates' } },
      },
    },
    '/v1/reasoning-runtime/monitoring': {
      get: {
        summary: 'Reasoning Runtime monitoring',
        operationId: 'getReasoningRuntimeMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring + honesty' } },
      },
    },
    '/v1/agent-runtime/engine': {
      get: {
        summary: 'Agent Runtime catalog',
        operationId: 'getAgentRuntimeEngine',
        responses: {
          '200': { description: 'Agent sandbox capabilities, permissions, honesty' },
        },
      },
    },
    '/v1/agent-runtime/permissions': {
      get: {
        summary: 'Agent Runtime grantable permissions',
        operationId: 'listAgentRuntimePermissions',
        responses: { '200': { description: 'Allowlist + denied actions' } },
      },
    },
    '/v1/agent-runtime/agents': {
      get: {
        summary: 'List agents',
        operationId: 'listAgentRuntimeAgents',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Workspace agents' } },
      },
      post: {
        summary: 'Create agent',
        operationId: 'createAgentRuntimeAgent',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '201': { description: 'Agent created (draft)' } },
      },
    },
    '/v1/agent-runtime/agents/{id}': {
      get: {
        summary: 'Get agent',
        operationId: 'getAgentRuntimeAgent',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Agent' } },
      },
    },
    '/v1/agent-runtime/agents/{id}/lifecycle': {
      post: {
        summary: 'Update agent lifecycle',
        operationId: 'lifecycleAgentRuntimeAgent',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Lifecycle updated' } },
      },
    },
    '/v1/agent-runtime/run': {
      post: {
        summary: 'Run agent (sandbox + hard permissions)',
        operationId: 'runAgentRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: {
          '200': { description: 'Sandbox run result' },
          '403': { description: 'Permission/policy hard deny' },
        },
      },
    },
    '/v1/agent-runtime/collaborate': {
      post: {
        summary: 'Sandbox multi-agent collaboration',
        operationId: 'collaborateAgentRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Collaboration session' } },
      },
    },
    '/v1/agent-runtime/schedule': {
      post: {
        summary: 'Schedule agent run (record only)',
        operationId: 'scheduleAgentRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Schedule recorded' } },
      },
    },
    '/v1/agent-runtime/memory': {
      post: {
        summary: 'Put agent memory',
        operationId: 'putAgentRuntimeMemory',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '201': { description: 'Memory stored via Memory Runtime' } },
      },
    },
    '/v1/agent-runtime/marketplace': {
      get: {
        summary: 'Agent marketplace counts',
        operationId: 'getAgentRuntimeMarketplace',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Listing counts' } },
      },
    },
    '/v1/agent-runtime/analytics': {
      get: {
        summary: 'Agent Runtime analytics',
        operationId: 'getAgentRuntimeAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Aggregates' } },
      },
    },
    '/v1/agent-runtime/monitoring': {
      get: {
        summary: 'Agent Runtime monitoring',
        operationId: 'getAgentRuntimeMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring + safety' } },
      },
    },
    '/v1/workflow-runtime/engine': {
      get: {
        summary: 'Workflow Runtime catalog',
        operationId: 'getWorkflowRuntimeEngine',
        responses: { '200': { description: 'Catalog + honesty + ceilings' } },
      },
    },
    '/v1/workflow-runtime/permissions': {
      get: {
        summary: 'Workflow Runtime grantable/denied permissions',
        operationId: 'listWorkflowRuntimePermissions',
        responses: { '200': { description: 'Permission lists' } },
      },
    },
    '/v1/workflow-runtime/workflows': {
      get: {
        summary: 'List kernel workflows',
        operationId: 'listWorkflowRuntimeWorkflows',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Workflows' } },
      },
      post: {
        summary: 'Create kernel workflow',
        operationId: 'createWorkflowRuntimeWorkflow',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '201': { description: 'Created' } },
      },
    },
    '/v1/workflow-runtime/workflows/{id}': {
      get: {
        summary: 'Get kernel workflow',
        operationId: 'getWorkflowRuntimeWorkflow',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Workflow' } },
      },
    },
    '/v1/workflow-runtime/workflows/{id}/lifecycle': {
      post: {
        summary: 'Update workflow lifecycle',
        operationId: 'lifecycleWorkflowRuntimeWorkflow',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Updated' } },
      },
    },
    '/v1/workflow-runtime/workflows/{id}/version': {
      post: {
        summary: 'Bump workflow version',
        operationId: 'versionWorkflowRuntimeWorkflow',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Versioned' } },
      },
    },
    '/v1/workflow-runtime/run': {
      post: {
        summary: 'Run sandbox workflow',
        operationId: 'runWorkflowRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Sandbox run result' } },
      },
    },
    '/v1/workflow-runtime/approve': {
      post: {
        summary: 'Record sandbox human approval',
        operationId: 'approveWorkflowRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Approval' } },
      },
    },
    '/v1/workflow-runtime/schedule': {
      post: {
        summary: 'Schedule sandbox workflow',
        operationId: 'scheduleWorkflowRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Schedule' } },
      },
    },
    '/v1/workflow-runtime/rollback': {
      post: {
        summary: 'Rollback sandbox workflow run',
        operationId: 'rollbackWorkflowRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Rolled back' } },
      },
    },
    '/v1/workflow-runtime/replay': {
      post: {
        summary: 'Replay sandbox workflow run',
        operationId: 'replayWorkflowRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Replay' } },
      },
    },
    '/v1/workflow-runtime/analytics': {
      get: {
        summary: 'Workflow Runtime analytics',
        operationId: 'getWorkflowRuntimeAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Aggregates' } },
      },
    },
    '/v1/workflow-runtime/monitoring': {
      get: {
        summary: 'Workflow Runtime monitoring',
        operationId: 'getWorkflowRuntimeMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring + safety' } },
      },
    },
    '/v1/plugin-runtime/engine': {
      get: {
        summary: 'Plugin Runtime catalog',
        operationId: 'getPluginRuntimeEngine',
        responses: { '200': { description: 'Catalog + honesty + ceilings' } },
      },
    },
    '/v1/plugin-runtime/permissions': {
      get: {
        summary: 'Plugin Runtime grantable/denied permissions',
        operationId: 'listPluginRuntimePermissions',
        responses: { '200': { description: 'Permission lists' } },
      },
    },
    '/v1/plugin-runtime/plugins': {
      get: {
        summary: 'List registered plugins',
        operationId: 'listPluginRuntimePlugins',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Plugins' } },
      },
      post: {
        summary: 'Register a sandbox plugin',
        operationId: 'registerPluginRuntimePlugin',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '201': { description: 'Registered' } },
      },
    },
    '/v1/plugin-runtime/plugins/{id}': {
      get: {
        summary: 'Get plugin',
        operationId: 'getPluginRuntimePlugin',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Plugin' } },
      },
    },
    '/v1/plugin-runtime/plugins/{id}/lifecycle': {
      post: {
        summary: 'Update plugin lifecycle',
        operationId: 'lifecyclePluginRuntimePlugin',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Updated' } },
      },
    },
    '/v1/plugin-runtime/plugins/{id}/version': {
      post: {
        summary: 'Bump plugin version',
        operationId: 'versionPluginRuntimePlugin',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Versioned' } },
      },
    },
    '/v1/plugin-runtime/invoke': {
      post: {
        summary: 'Invoke sandbox plugin',
        operationId: 'invokePluginRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Sandbox invoke result' } },
      },
    },
    '/v1/plugin-runtime/marketplace': {
      get: {
        summary: 'Plugin marketplace counts',
        operationId: 'getPluginRuntimeMarketplace',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Listing counts' } },
      },
    },
    '/v1/plugin-runtime/analytics': {
      get: {
        summary: 'Plugin Runtime analytics',
        operationId: 'getPluginRuntimeAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Aggregates' } },
      },
    },
    '/v1/plugin-runtime/monitoring': {
      get: {
        summary: 'Plugin Runtime monitoring',
        operationId: 'getPluginRuntimeMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring + safety' } },
      },
    },
    '/v1/policy-runtime/engine': {
      get: {
        summary: 'Policy Runtime catalog',
        operationId: 'getPolicyRuntimeEngine',
        responses: { '200': { description: 'Catalog + honesty + ceilings' } },
      },
    },
    '/v1/policy-runtime/kinds': {
      get: {
        summary: 'Policy kinds and global denies',
        operationId: 'listPolicyRuntimeKinds',
        responses: { '200': { description: 'Kinds' } },
      },
    },
    '/v1/policy-runtime/policies': {
      get: {
        summary: 'List workspace policies',
        operationId: 'listPolicyRuntimePolicies',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Policies' } },
      },
      post: {
        summary: 'Create workspace policy',
        operationId: 'createPolicyRuntimePolicy',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '201': { description: 'Created' } },
      },
    },
    '/v1/policy-runtime/policies/{id}': {
      get: {
        summary: 'Get policy',
        operationId: 'getPolicyRuntimePolicy',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Policy' } },
      },
    },
    '/v1/policy-runtime/policies/{id}/enabled': {
      post: {
        summary: 'Enable or disable policy',
        operationId: 'enablePolicyRuntimePolicy',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Updated' } },
      },
    },
    '/v1/policy-runtime/evaluate': {
      post: {
        summary: 'Evaluate policy hard-gate decision',
        operationId: 'evaluatePolicyRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Allow/deny decision (hardGate)' } },
      },
    },
    '/v1/policy-runtime/analytics': {
      get: {
        summary: 'Policy Runtime analytics',
        operationId: 'getPolicyRuntimeAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Aggregates' } },
      },
    },
    '/v1/policy-runtime/monitoring': {
      get: {
        summary: 'Policy Runtime monitoring',
        operationId: 'getPolicyRuntimeMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring + wiring' } },
      },
    },
    '/v1/inference-cloud/overview': {
      get: {
        summary: 'Inference Cloud org overview',
        operationId: 'getInferenceOverview',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': {
            description: 'Session chat/embeddings usage, products, deferred flags, spend-safety notes',
          },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/gpu-platform/engine': {
      get: {
        summary: 'GPU Platform catalog',
        operationId: 'getGpuPlatformEngine',
        responses: {
          '200': {
            description: 'Capabilities, ceilings, and spend-safety honesty',
          },
        },
      },
    },
    '/v1/gpu-platform/vendors': {
      get: {
        summary: 'GPU vendors',
        operationId: 'listGpuVendors',
        responses: { '200': { description: 'NVIDIA/AMD/Intel sandbox vendor tags' } },
      },
    },
    '/v1/gpu-platform/pools': {
      get: {
        summary: 'Sandbox GPU pools',
        operationId: 'listGpuPools',
        responses: { '200': { description: 'Logical sandbox pool catalog' } },
      },
    },
    '/v1/gpu-platform/ceilings': {
      get: {
        summary: 'Hard GPU instance/spend ceilings',
        operationId: 'getGpuCeilings',
        responses: { '200': { description: 'maxInstances + maxSpendUsd + provisionMode' } },
      },
    },
    '/v1/gpu-platform/allocations': {
      get: {
        summary: 'List sandbox GPU allocations',
        operationId: 'listGpuAllocations',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Org/workspace allocations' } },
      },
      post: {
        summary: 'Create sandbox GPU allocation (ceiling-enforced)',
        operationId: 'createGpuAllocation',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: {
          '201': { description: 'Logical allocation created' },
          '402': { description: 'Hard instance or spend ceiling exceeded' },
          '403': { description: 'Provision mode disabled' },
        },
      },
    },
    '/v1/gpu-platform/allocations/{id}/scale': {
      post: {
        summary: 'Scale allocation toward target (hard-clamped)',
        operationId: 'scaleGpuAllocation',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Scaled or clamped to ceiling' },
          '402': { description: 'Hard ceiling prevents scale' },
        },
      },
    },
    '/v1/gpu-platform/allocations/{id}/release': {
      post: {
        summary: 'Release sandbox GPU allocation',
        operationId: 'releaseGpuAllocation',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Released' } },
      },
    },
    '/v1/gpu-platform/health': {
      get: {
        summary: 'GPU Platform health',
        operationId: 'getGpuPlatformHealth',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Sandbox health snapshot' } },
      },
    },
    '/v1/gpu-platform/costs': {
      get: {
        summary: 'Estimated GPU costs',
        operationId: 'getGpuPlatformCosts',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Estimated USD from sandbox rates' } },
      },
    },
    '/v1/gpu-platform/analytics': {
      get: {
        summary: 'GPU Platform analytics',
        operationId: 'getGpuPlatformAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Allocation aggregates' } },
      },
    },
    '/v1/gpu-platform/monitoring': {
      get: {
        summary: 'GPU Platform monitoring',
        operationId: 'getGpuPlatformMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring + spend-safety snapshot' } },
      },
    },
    '/v1/model-serving/engine': {
      get: {
        summary: 'Model Serving catalog',
        operationId: 'getModelServingEngine',
        responses: {
          '200': {
            description: 'Capabilities, honesty, and sandbox deployment ceilings',
          },
        },
      },
    },
    '/v1/model-serving/kinds': {
      get: {
        summary: 'Serving model kinds',
        operationId: 'listModelServingKinds',
        responses: {
          '200': {
            description: 'LLM/speech/voice/OCR/embedding/vision/reasoning map',
          },
        },
      },
    },
    '/v1/model-serving/modes': {
      get: {
        summary: 'Serving modes',
        operationId: 'listModelServingModes',
        responses: {
          '200': {
            description: 'Streaming/batch/realtime/canary/blue-green/rollback/versioning',
          },
        },
      },
    },
    '/v1/model-serving/ceilings': {
      get: {
        summary: 'Model Serving active-deployment ceilings',
        operationId: 'getModelServingCeilings',
        responses: { '200': { description: 'maxActiveDeployments + mode' } },
      },
    },
    '/v1/model-serving/endpoints': {
      get: {
        summary: 'Discoverable Gateway serving endpoints',
        operationId: 'listModelServingEndpoints',
        responses: { '200': { description: 'Gateway API + registry model map' } },
      },
    },
    '/v1/model-serving/deployments': {
      get: {
        summary: 'List sandbox model deployments',
        operationId: 'listModelServingDeployments',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Org/workspace deployments' } },
      },
      post: {
        summary: 'Create sandbox model deployment',
        operationId: 'createModelServingDeployment',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: {
          '201': { description: 'Logical deployment created' },
          '402': { description: 'Hard active-deployment ceiling exceeded' },
          '403': { description: 'Serving mode disabled' },
        },
      },
    },
    '/v1/model-serving/deployments/{id}/traffic': {
      post: {
        summary: 'Update sandbox canary traffic percent',
        operationId: 'setModelServingTraffic',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Traffic percent updated' } },
      },
    },
    '/v1/model-serving/deployments/{id}/promote': {
      post: {
        summary: 'Promote canary/blue-green deployment to active',
        operationId: 'promoteModelServingDeployment',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Promoted to active@100%' } },
      },
    },
    '/v1/model-serving/deployments/{id}/rollback': {
      post: {
        summary: 'Rollback to previous sandbox version',
        operationId: 'rollbackModelServingDeployment',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Prior version activated' } },
      },
    },
    '/v1/model-serving/deployments/{id}/release': {
      post: {
        summary: 'Release sandbox model deployment',
        operationId: 'releaseModelServingDeployment',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Released' } },
      },
    },
    '/v1/model-serving/deployments/{id}/redeploy': {
      post: {
        summary: 'Deploy a new version with previousVersion pointer',
        operationId: 'redeployModelServingDeployment',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { '201': { description: 'New version created' } },
      },
    },
    '/v1/model-serving/health': {
      get: {
        summary: 'Model Serving health',
        operationId: 'getModelServingHealth',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Sandbox health snapshot' } },
      },
    },
    '/v1/model-serving/analytics': {
      get: {
        summary: 'Model Serving analytics',
        operationId: 'getModelServingAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Deployment aggregates' } },
      },
    },
    '/v1/model-serving/monitoring': {
      get: {
        summary: 'Model Serving monitoring',
        operationId: 'getModelServingMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring + honesty snapshot' } },
      },
    },
    '/v1/ai-router/engine': {
      get: {
        summary: 'AI Router catalog',
        operationId: 'getAiRouterEngine',
        responses: {
          '200': {
            description: 'Capabilities, honesty, and spend-safety notes',
          },
        },
      },
    },
    '/v1/ai-router/features': {
      get: {
        summary: 'Routable inference features',
        operationId: 'listAiRouterFeatures',
        responses: { '200': { description: 'Feature → gateway API map' } },
      },
    },
    '/v1/ai-router/providers': {
      get: {
        summary: 'Router provider IDs',
        operationId: 'listAiRouterProviders',
        responses: { '200': { description: 'Gateway provider IDs used by router' } },
      },
    },
    '/v1/ai-router/policies': {
      get: {
        summary: 'Workspace AI Router policy',
        operationId: 'getAiRouterPolicy',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Org/workspace policy or defaults' } },
      },
      put: {
        summary: 'Upsert workspace AI Router policy',
        operationId: 'upsertAiRouterPolicy',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: {
          '200': { description: 'Policy saved' },
          '403': { description: 'Router mode disabled' },
        },
      },
    },
    '/v1/ai-router/resolve': {
      post: {
        summary: 'Dry-run resolve model/provider route',
        operationId: 'resolveAiRouter',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: {
          '200': { description: 'Selected candidate + ordered fallback chain' },
          '503': { description: 'No candidates available' },
        },
      },
    },
    '/v1/ai-router/decisions': {
      get: {
        summary: 'Recent dry-run route decisions',
        operationId: 'listAiRouterDecisions',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Decision log' } },
      },
    },
    '/v1/ai-router/analytics': {
      get: {
        summary: 'AI Router analytics',
        operationId: 'getAiRouterAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Decision aggregates' } },
      },
    },
    '/v1/ai-router/monitoring': {
      get: {
        summary: 'AI Router monitoring',
        operationId: 'getAiRouterMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring + honesty snapshot' } },
      },
    },
    '/v1/streaming-runtime/engine': {
      get: {
        summary: 'Streaming Runtime catalog',
        operationId: 'getStreamingRuntimeEngine',
        responses: {
          '200': {
            description: 'Capabilities, transports, and honesty flags',
          },
        },
      },
    },
    '/v1/streaming-runtime/surfaces': {
      get: {
        summary: 'Streaming surfaces',
        operationId: 'listStreamingRuntimeSurfaces',
        responses: {
          '200': {
            description: 'Speech/voice/translation/LLM/video/realtime surface map',
          },
        },
      },
    },
    '/v1/streaming-runtime/transports': {
      get: {
        summary: 'Streaming transports',
        operationId: 'listStreamingRuntimeTransports',
        responses: { '200': { description: 'SSE shipped; WebSocket/gRPC deferred' } },
      },
    },
    '/v1/streaming-runtime/sessions': {
      get: {
        summary: 'List sandbox streaming sessions',
        operationId: 'listStreamingSessions',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Org/workspace sessions' } },
      },
      post: {
        summary: 'Create sandbox streaming session',
        operationId: 'createStreamingSession',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '201': { description: 'Session created' } },
      },
    },
    '/v1/streaming-runtime/sessions/{id}/close': {
      post: {
        summary: 'Close sandbox streaming session',
        operationId: 'closeStreamingSession',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Session closed' } },
      },
    },
    '/v1/streaming-runtime/stream': {
      post: {
        summary: 'Sandbox SSE chunk stream (or redirect to existing product SSE)',
        operationId: 'streamStreamingRuntime',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: {
          '200': { description: 'text/event-stream chunk/redirect/done events' },
        },
      },
    },
    '/v1/streaming-runtime/analytics': {
      get: {
        summary: 'Streaming Runtime analytics',
        operationId: 'getStreamingRuntimeAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Session aggregates' } },
      },
    },
    '/v1/streaming-runtime/monitoring': {
      get: {
        summary: 'Streaming Runtime monitoring',
        operationId: 'getStreamingRuntimeMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring + honesty snapshot' } },
      },
    },
    '/v1/batch-runtime/engine': {
      get: {
        summary: 'Batch Runtime catalog',
        operationId: 'getBatchRuntimeEngine',
        responses: {
          '200': {
            description: 'Capabilities, ceilings, and honesty flags',
          },
        },
      },
    },
    '/v1/batch-runtime/kinds': {
      get: {
        summary: 'Batch job kinds',
        operationId: 'listBatchRuntimeKinds',
        responses: {
          '200': {
            description: 'Translation/speech/OCR/embedding/training/video map',
          },
        },
      },
    },
    '/v1/batch-runtime/runs': {
      get: {
        summary: 'List batch runs',
        operationId: 'listBatchRuns',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Org/workspace runs (priority-ordered)' } },
      },
      post: {
        summary: 'Create batch run',
        operationId: 'createBatchRun',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: {
          '201': { description: 'Run created (translation may delegate to BullMQ)' },
          '402': { description: 'Hard item ceiling exceeded' },
        },
      },
    },
    '/v1/batch-runtime/runs/{id}': {
      get: {
        summary: 'Get batch run',
        operationId: 'getBatchRun',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Run detail' } },
      },
    },
    '/v1/batch-runtime/runs/{id}/start': {
      post: {
        summary: 'Start a scheduled batch run',
        operationId: 'startBatchRun',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Scheduled run started' } },
      },
    },
    '/v1/batch-runtime/runs/{id}/checkpoint': {
      post: {
        summary: 'Update sandbox checkpoint cursor',
        operationId: 'checkpointBatchRun',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Checkpoint updated' } },
      },
    },
    '/v1/batch-runtime/runs/{id}/retry': {
      post: {
        summary: 'Retry batch run within hard budget',
        operationId: 'retryBatchRun',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Retried' },
          '402': { description: 'Retry budget exhausted' },
        },
      },
    },
    '/v1/batch-runtime/analytics': {
      get: {
        summary: 'Batch Runtime analytics',
        operationId: 'getBatchRuntimeAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Run aggregates' } },
      },
    },
    '/v1/batch-runtime/monitoring': {
      get: {
        summary: 'Batch Runtime monitoring',
        operationId: 'getBatchRuntimeMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring + honesty snapshot' } },
      },
    },
    '/v1/intelligent-cache/engine': {
      get: {
        summary: 'Intelligent Cache catalog',
        operationId: 'getIntelligentCacheEngine',
        responses: {
          '200': {
            description: 'Namespaces, ceilings, and honesty flags',
          },
        },
      },
    },
    '/v1/intelligent-cache/namespaces': {
      get: {
        summary: 'Cache namespaces',
        operationId: 'listIntelligentCacheNamespaces',
        responses: {
          '200': {
            description: 'Semantic/translation/embedding/speech/voice/document/prompt/context',
          },
        },
      },
    },
    '/v1/intelligent-cache/ceilings': {
      get: {
        summary: 'Cache entry/TTL ceilings',
        operationId: 'getIntelligentCacheCeilings',
        responses: { '200': { description: 'maxEntriesPerWorkspace + defaultTtlSec' } },
      },
    },
    '/v1/intelligent-cache/entries': {
      get: {
        summary: 'List active cache entries',
        operationId: 'listIntelligentCacheEntries',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Org/workspace entries (values omitted)' } },
      },
    },
    '/v1/intelligent-cache/put': {
      post: {
        summary: 'Put cache entry',
        operationId: 'putIntelligentCacheEntry',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: {
          '201': { description: 'Entry stored' },
          '402': { description: 'Hard entry ceiling exceeded' },
        },
      },
    },
    '/v1/intelligent-cache/lookup': {
      post: {
        summary: 'Lookup cache entry (exact key / normalized hash)',
        operationId: 'lookupIntelligentCacheEntry',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Hit or miss' } },
      },
    },
    '/v1/intelligent-cache/invalidate': {
      post: {
        summary: 'Invalidate cache entries',
        operationId: 'invalidateIntelligentCache',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Deleted count' } },
      },
    },
    '/v1/intelligent-cache/analytics': {
      get: {
        summary: 'Intelligent Cache analytics',
        operationId: 'getIntelligentCacheAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Hit/entry aggregates' } },
      },
    },
    '/v1/intelligent-cache/monitoring': {
      get: {
        summary: 'Intelligent Cache monitoring',
        operationId: 'getIntelligentCacheMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring + honesty snapshot' } },
      },
    },
    '/v1/cost-optimization/engine': {
      get: {
        summary: 'Cost Optimization Engine catalog',
        operationId: 'getCostOptimizationEngine',
        responses: {
          '200': {
            description: 'Ceilings, honesty, and spend-enforcement flags',
          },
        },
      },
    },
    '/v1/cost-optimization/ceilings': {
      get: {
        summary: 'Default hard spend ceilings',
        operationId: 'getCostOptimizationCeilings',
        responses: { '200': { description: 'Daily/monthly default caps' } },
      },
    },
    '/v1/cost-optimization/budgets': {
      get: {
        summary: 'Get workspace cost budget',
        operationId: 'getCostOptimizationBudget',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Org/workspace budget' } },
      },
      put: {
        summary: 'Upsert workspace cost budget',
        operationId: 'upsertCostOptimizationBudget',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Budget persisted' } },
      },
    },
    '/v1/cost-optimization/check': {
      post: {
        summary: 'Check spend against hard caps',
        operationId: 'checkCostOptimizationSpend',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: {
          '200': { description: 'Gate result' },
          '402': { description: 'Hard spend ceiling exceeded' },
        },
      },
    },
    '/v1/cost-optimization/record': {
      post: {
        summary: 'Record spend (enforces caps)',
        operationId: 'recordCostOptimizationSpend',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: {
          '201': { description: 'Spend recorded' },
          '402': { description: 'Hard spend ceiling exceeded' },
        },
      },
    },
    '/v1/cost-optimization/optimize': {
      post: {
        summary: 'Cost-preferring route plan',
        operationId: 'optimizeCostOptimizationRoute',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Cheapest candidates + spend gate' } },
      },
    },
    '/v1/cost-optimization/gpu': {
      get: {
        summary: 'GPU cost view + scale advice',
        operationId: 'getCostOptimizationGpu',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'GPU ceilings + workspace spend' } },
      },
    },
    '/v1/cost-optimization/predictions': {
      get: {
        summary: 'Spend predictions + spot/reserved plans',
        operationId: 'getCostOptimizationPredictions',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Linear projection + sandbox plans' } },
      },
    },
    '/v1/cost-optimization/reports': {
      get: {
        summary: 'Spend reports',
        operationId: 'getCostOptimizationReports',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Ledger-backed reports' } },
      },
    },
    '/v1/cost-optimization/analytics': {
      get: {
        summary: 'Cost analytics',
        operationId: 'getCostOptimizationAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Utilization aggregates' } },
      },
    },
    '/v1/cost-optimization/monitoring': {
      get: {
        summary: 'Cost Optimization monitoring',
        operationId: 'getCostOptimizationMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring + honesty snapshot' } },
      },
    },
    '/v1/ai-runtime-analytics/engine': {
      get: {
        summary: 'AI Runtime Analytics catalog',
        operationId: 'getAiRuntimeAnalyticsEngine',
        responses: {
          '200': { description: 'Capabilities and honesty flags' },
        },
      },
    },
    '/v1/ai-runtime-analytics/overview': {
      get: {
        summary: 'Runtime analytics overview',
        operationId: 'getAiRuntimeAnalyticsOverview',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Bundled Inference Cloud aggregates' } },
      },
    },
    '/v1/ai-runtime-analytics/latency': {
      get: {
        summary: 'Runtime latency proxies',
        operationId: 'getAiRuntimeAnalyticsLatency',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'p50/p95 latency proxies' } },
      },
    },
    '/v1/ai-runtime-analytics/throughput': {
      get: {
        summary: 'Runtime throughput',
        operationId: 'getAiRuntimeAnalyticsThroughput',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Decisions/usage/batch/streaming rates' } },
      },
    },
    '/v1/ai-runtime-analytics/gpu': {
      get: {
        summary: 'GPU usage aggregates',
        operationId: 'getAiRuntimeAnalyticsGpu',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Sandbox GPU allocation aggregates' } },
      },
    },
    '/v1/ai-runtime-analytics/cpu': {
      get: {
        summary: 'CPU host/process snapshot',
        operationId: 'getAiRuntimeAnalyticsCpu',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Nest host/process CPU snapshot' } },
      },
    },
    '/v1/ai-runtime-analytics/cache': {
      get: {
        summary: 'Cache hit/miss aggregates',
        operationId: 'getAiRuntimeAnalyticsCache',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Intelligent Cache hit rates' } },
      },
    },
    '/v1/ai-runtime-analytics/requests': {
      get: {
        summary: 'Request counts',
        operationId: 'getAiRuntimeAnalyticsRequests',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Request aggregates' } },
      },
    },
    '/v1/ai-runtime-analytics/errors': {
      get: {
        summary: 'Error proxies',
        operationId: 'getAiRuntimeAnalyticsErrors',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Failed batch/streaming + audit proxies' } },
      },
    },
    '/v1/ai-runtime-analytics/cost': {
      get: {
        summary: 'Runtime cost aggregates',
        operationId: 'getAiRuntimeAnalyticsCost',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Ledger + GPU hourly (report-only)' } },
      },
    },
    '/v1/ai-runtime-analytics/customers': {
      get: {
        summary: 'Customer/workspace activity',
        operationId: 'getAiRuntimeAnalyticsCustomers',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Org/workspace activity counts' } },
      },
    },
    '/v1/ai-runtime-analytics/models': {
      get: {
        summary: 'Model selection aggregates',
        operationId: 'getAiRuntimeAnalyticsModels',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Router + serving model aggregates' } },
      },
    },
    '/v1/ai-runtime-analytics/streaming': {
      get: {
        summary: 'Streaming session aggregates',
        operationId: 'getAiRuntimeAnalyticsStreaming',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Streaming Runtime aggregates' } },
      },
    },
    '/v1/ai-runtime-analytics/report': {
      get: {
        summary: 'Bundled runtime analytics report',
        operationId: 'getAiRuntimeAnalyticsReport',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Full JSON report' } },
      },
    },
    '/v1/ai-runtime-analytics/monitoring': {
      get: {
        summary: 'Runtime analytics monitoring',
        operationId: 'getAiRuntimeAnalyticsMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring + honesty snapshot' } },
      },
    },
    '/v1/knowledge-base/engine': {
      get: {
        summary: 'Enterprise Knowledge Base engine catalog',
        operationId: 'getKnowledgeBaseEngine',
        responses: { '200': { description: 'EKB capabilities and honesty flags' } },
      },
    },
    '/v1/knowledge-base/content-kinds': {
      get: {
        summary: 'Knowledge Base content kinds',
        operationId: 'listKnowledgeBaseContentKinds',
        responses: { '200': { description: 'Shipped and deferred content kinds' } },
      },
    },
    '/v1/knowledge-base/collections': {
      get: {
        summary: 'Workspace knowledge collections',
        operationId: 'listKnowledgeBaseCollections',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Collections for the authenticated workspace' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge-base/documents': {
      get: {
        summary: 'List Knowledge Base documents (workspace-scoped)',
        operationId: 'listKnowledgeBaseDocuments',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Documents filtered by collection/tag/contentKind' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge-base/analytics': {
      get: {
        summary: 'Knowledge Base analytics',
        operationId: 'getKnowledgeBaseAnalytics',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Workspace document/chunk counts' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge-base/monitoring': {
      get: {
        summary: 'Knowledge Base monitoring',
        operationId: 'getKnowledgeBaseMonitoring',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Analytics + honesty + deferred capability ids' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/enterprise-search/engine': {
      get: {
        summary: 'Enterprise Search engine catalog',
        operationId: 'getEnterpriseSearchEngine',
        responses: { '200': { description: 'Search capabilities and honesty flags' } },
      },
    },
    '/v1/enterprise-search/modes': {
      get: {
        summary: 'Enterprise Search modes',
        operationId: 'listEnterpriseSearchModes',
        responses: { '200': { description: 'keyword / semantic / hybrid' } },
      },
    },
    '/v1/enterprise-search/search': {
      post: {
        summary: 'Search knowledge chunks',
        operationId: 'enterpriseSearch',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Ranked hits for the authenticated workspace' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/enterprise-search/suggest': {
      get: {
        summary: 'Search suggestions',
        operationId: 'enterpriseSearchSuggest',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Filename/tag/collection suggestions' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/enterprise-search/analytics': {
      get: {
        summary: 'Enterprise Search analytics',
        operationId: 'getEnterpriseSearchAnalytics',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Workspace search counts' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/enterprise-search/monitoring': {
      get: {
        summary: 'Enterprise Search monitoring',
        operationId: 'getEnterpriseSearchMonitoring',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Analytics + honesty + deferred ids' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/ontology/engine': {
      get: {
        summary: 'Ontology Platform engine catalog',
        operationId: 'getOntologyEngine',
        responses: { '200': { description: 'Ontology capabilities and honesty flags' } },
      },
    },
    '/v1/ontology/domains': {
      get: {
        summary: 'Ontology domains',
        operationId: 'listOntologyDomains',
        responses: { '200': { description: 'General + deferred vertical domain tags' } },
      },
    },
    '/v1/ontology/concepts': {
      get: {
        summary: 'List ontology concepts',
        operationId: 'listOntologyConcepts',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Workspace-scoped concepts' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
      post: {
        summary: 'Create ontology concept',
        operationId: 'createOntologyConcept',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '201': { description: 'Created concept' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/ontology/hierarchies': {
      post: {
        summary: 'Create is_a hierarchy edge',
        operationId: 'createOntologyHierarchy',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '201': { description: 'Created hierarchy edge' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/ontology/synonyms': {
      post: {
        summary: 'Add synonym alias or synonym_of edge',
        operationId: 'createOntologySynonym',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '201': { description: 'Updated concept / edge' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/taxonomy/engine': {
      get: {
        summary: 'Taxonomy Platform engine catalog',
        operationId: 'getTaxonomyEngine',
        responses: { '200': { description: 'Taxonomy capabilities and honesty flags' } },
      },
    },
    '/v1/taxonomy/content-types': {
      get: {
        summary: 'Taxonomy content types',
        operationId: 'listTaxonomyContentTypes',
        responses: { '200': { description: 'EKB-aligned content kinds' } },
      },
    },
    '/v1/taxonomy/terms': {
      get: {
        summary: 'List taxonomy terms',
        operationId: 'listTaxonomyTerms',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Workspace-scoped terms' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
      post: {
        summary: 'Create taxonomy term',
        operationId: 'createTaxonomyTerm',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '201': { description: 'Created term' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/taxonomy/trees': {
      get: {
        summary: 'Taxonomy trees (roots + one child level)',
        operationId: 'listTaxonomyTrees',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Knowledge trees for workspace' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/taxonomy/assign': {
      post: {
        summary: 'Assign taxonomy term to knowledge document',
        operationId: 'assignTaxonomyTerm',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '201': { description: 'Assignment created' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/taxonomy/classify': {
      post: {
        summary: 'Heuristic classify document against taxonomy terms',
        operationId: 'classifyTaxonomyDocument',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Matched terms (optional apply)' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/enterprise-rag/engine': {
      get: {
        summary: 'Enterprise RAG Platform engine catalog',
        operationId: 'getEnterpriseRagEngine',
        responses: { '200': { description: 'RAG capabilities and honesty flags' } },
      },
    },
    '/v1/enterprise-rag/chunk': {
      post: {
        summary: 'Preview RAG chunking windows',
        operationId: 'previewEnterpriseRagChunk',
        responses: { '200': { description: 'Chunk preview (not persisted)' } },
      },
    },
    '/v1/enterprise-rag/retrieve': {
      post: {
        summary: 'Enterprise RAG retrieve with citations',
        operationId: 'retrieveEnterpriseRag',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Ranked passages + citations + context optimization' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/enterprise-rag/query': {
      post: {
        summary: 'Grounded Enterprise RAG query',
        operationId: 'queryEnterpriseRag',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Grounded answer with citations' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/enterprise-rag/analytics': {
      get: {
        summary: 'Enterprise RAG analytics',
        operationId: 'getEnterpriseRagAnalytics',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Workspace RAG analytics' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/enterprise-rag/monitoring': {
      get: {
        summary: 'Enterprise RAG monitoring',
        operationId: 'getEnterpriseRagMonitoring',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Honesty + deferred flags' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge-memory/engine': {
      get: {
        summary: 'Knowledge Memory engine catalog',
        operationId: 'getKnowledgeMemoryEngine',
        responses: { '200': { description: 'Knowledge Memory capabilities and honesty flags' } },
      },
    },
    '/v1/knowledge-memory/scopes': {
      get: {
        summary: 'Knowledge Memory scopes',
        operationId: 'listKnowledgeMemoryScopes',
        responses: { '200': { description: 'Scope map onto VL-183 Memory Cloud' } },
      },
    },
    '/v1/knowledge-memory/memories': {
      get: {
        summary: 'List knowledge-layer memories',
        operationId: 'listKnowledgeMemories',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Workspace knowledge memories' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
      post: {
        summary: 'Create knowledge-layer memory',
        operationId: 'createKnowledgeMemory',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '201': { description: 'Created knowledge memory' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge-memory/search': {
      post: {
        summary: 'Search knowledge-layer memories',
        operationId: 'searchKnowledgeMemory',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Matching knowledge memories' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge-memory/analytics': {
      get: {
        summary: 'Knowledge Memory analytics',
        operationId: 'getKnowledgeMemoryAnalytics',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Workspace analytics' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge-memory/monitoring': {
      get: {
        summary: 'Knowledge Memory monitoring',
        operationId: 'getKnowledgeMemoryMonitoring',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Honesty + deferred flags' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge-intelligence/engine': {
      get: {
        summary: 'Knowledge Intelligence engine catalog',
        operationId: 'getKnowledgeIntelligenceEngine',
        responses: { '200': { description: 'Capabilities and honesty flags' } },
      },
    },
    '/v1/knowledge-intelligence/insight': {
      get: {
        summary: 'Knowledge Intelligence insight snapshot',
        operationId: 'getKnowledgeIntelligenceInsight',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Workspace knowledge insight' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge-intelligence/discover': {
      post: {
        summary: 'Discover docs/terms/concepts',
        operationId: 'discoverKnowledgeIntelligence',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Discovery hits' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge-intelligence/link': {
      post: {
        summary: 'Suggest related knowledge documents',
        operationId: 'linkKnowledgeIntelligence',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Related document links' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge-intelligence/recommend': {
      post: {
        summary: 'Recommend knowledge documents',
        operationId: 'recommendKnowledgeIntelligence',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Ranked recommendations' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge-intelligence/validate': {
      post: {
        summary: 'Validate knowledge documents',
        operationId: 'validateKnowledgeIntelligence',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Validation results' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge-intelligence/duplicates': {
      post: {
        summary: 'Detect duplicate knowledge documents',
        operationId: 'duplicatesKnowledgeIntelligence',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Duplicate pairs' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge-intelligence/confidence': {
      post: {
        summary: 'Heuristic knowledge confidence scores',
        operationId: 'confidenceKnowledgeIntelligence',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Confidence scores' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge-intelligence/analytics': {
      get: {
        summary: 'Knowledge Intelligence analytics',
        operationId: 'getKnowledgeIntelligenceAnalytics',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Analytics snapshot' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge-intelligence/monitoring': {
      get: {
        summary: 'Knowledge Intelligence monitoring',
        operationId: 'getKnowledgeIntelligenceMonitoring',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Honesty + deferred flags' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge-apis/engine': {
      get: {
        summary: 'Enterprise Knowledge APIs pack catalog',
        operationId: 'getKnowledgeApisEngine',
        responses: { '200': { description: 'API pack capabilities and honesty flags' } },
      },
    },
    '/v1/knowledge-apis/surfaces': {
      get: {
        summary: 'Knowledge Cloud REST/GraphQL surfaces',
        operationId: 'listKnowledgeApisSurfaces',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Surface catalog' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge-apis/graphql': {
      get: {
        summary: 'Knowledge Cloud GraphQL query catalog',
        operationId: 'listKnowledgeApisGraphql',
        responses: { '200': { description: 'GraphQL engine queries' } },
      },
    },
    '/v1/knowledge-apis/openapi': {
      get: {
        summary: 'Knowledge OpenAPI path index',
        operationId: 'getKnowledgeApisOpenapi',
        responses: { '200': { description: 'OpenAPI pointer + knowledge paths' } },
      },
    },
    '/v1/knowledge-apis/sdk': {
      get: {
        summary: 'Knowledge SDK method catalog',
        operationId: 'getKnowledgeApisSdk',
        responses: { '200': { description: 'SDK install + methods' } },
      },
    },
    '/v1/knowledge-apis/cli': {
      get: {
        summary: 'Knowledge CLI command catalog',
        operationId: 'getKnowledgeApisCli',
        responses: { '200': { description: 'CLI commands' } },
      },
    },
    '/v1/knowledge-apis/webhooks': {
      get: {
        summary: 'Knowledge webhook event catalog',
        operationId: 'getKnowledgeApisWebhooks',
        responses: { '200': { description: 'Webhook events + signing' } },
      },
    },
    '/v1/knowledge-apis/events/stream': {
      get: {
        summary: 'SSE knowledge audit event tail',
        operationId: 'streamKnowledgeApisEvents',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'text/event-stream' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge-apis/analytics': {
      get: {
        summary: 'Knowledge APIs pack analytics',
        operationId: 'getKnowledgeApisAnalytics',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Pack analytics' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge-apis/monitoring': {
      get: {
        summary: 'Knowledge APIs pack monitoring',
        operationId: 'getKnowledgeApisMonitoring',
        security: [{ ClerkAuth: [] }, { ApiKeyAuth: [] }],
        responses: {
          '200': { description: 'Honesty + deferred flags' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/knowledge-analytics/engine': {
      get: {
        summary: 'Knowledge Analytics catalog',
        operationId: 'getKnowledgeAnalyticsEngine',
        responses: {
          '200': {
            description: 'Capabilities and Language/Speech/Voice/Intelligence separation honesty',
          },
        },
      },
    },
    '/v1/knowledge-analytics/overview': {
      get: {
        summary: 'Knowledge Analytics overview',
        operationId: 'getKnowledgeAnalyticsOverview',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Growth/usage/quality/search/gaps snapshot' } },
      },
    },
    '/v1/knowledge-analytics/growth': {
      get: {
        summary: 'Knowledge growth metrics',
        operationId: 'getKnowledgeAnalyticsGrowth',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Document/chunk growth' } },
      },
    },
    '/v1/knowledge-analytics/usage': {
      get: {
        summary: 'Knowledge Cloud surface usage',
        operationId: 'getKnowledgeAnalyticsUsage',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Per-surface audit counts' } },
      },
    },
    '/v1/knowledge-analytics/quality': {
      get: {
        summary: 'Knowledge quality proxies',
        operationId: 'getKnowledgeAnalyticsQuality',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Ready/failed/chunk coverage' } },
      },
    },
    '/v1/knowledge-analytics/search': {
      get: {
        summary: 'Search success metrics',
        operationId: 'getKnowledgeAnalyticsSearch',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Enterprise search hit rates' } },
      },
    },
    '/v1/knowledge-analytics/gaps': {
      get: {
        summary: 'Knowledge gap heuristics',
        operationId: 'getKnowledgeAnalyticsGaps',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Unchunked/failed/unassigned gaps' } },
      },
    },
    '/v1/knowledge-analytics/confidence': {
      get: {
        summary: 'Knowledge confidence averages',
        operationId: 'getKnowledgeAnalyticsConfidence',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Heuristic confidence bands' } },
      },
    },
    '/v1/knowledge-analytics/relationships': {
      get: {
        summary: 'Knowledge relationship counts',
        operationId: 'getKnowledgeAnalyticsRelationships',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'KG/taxonomy/ontology counts' } },
      },
    },
    '/v1/knowledge-analytics/report': {
      get: {
        summary: 'Bundled Knowledge Analytics report',
        operationId: 'getKnowledgeAnalyticsReport',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Full JSON report' } },
      },
    },
    '/v1/knowledge-analytics/monitoring': {
      get: {
        summary: 'Knowledge Analytics monitoring snapshot',
        operationId: 'getKnowledgeAnalyticsMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/embedding-cloud/engine': {
      get: {
        summary: 'Embedding Cloud engine catalog',
        operationId: 'getEmbeddingCloudEngine',
        responses: { '200': { description: 'Embedding modalities and capabilities' } },
      },
    },
    '/v1/embedding-cloud/models': {
      get: {
        summary: 'Embedding models catalog',
        operationId: 'listEmbeddingCloudModels',
        responses: { '200': { description: 'Available embedding models' } },
      },
    },
    '/v1/embedding-cloud/modalities': {
      get: {
        summary: 'Embedding modalities',
        operationId: 'listEmbeddingCloudModalities',
        responses: { '200': { description: 'Modality statuses' } },
      },
    },
    '/v1/embedding-cloud/embed': {
      post: {
        summary: 'Create embeddings (Embedding Cloud)',
        operationId: 'createEmbeddingCloudEmbed',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'OpenAI-shaped embedding list + modality' } },
      },
    },
    '/v1/embedding-cloud/analytics': {
      get: {
        summary: 'Embedding Cloud analytics',
        operationId: 'getEmbeddingCloudAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Token/request aggregates' } },
      },
    },
    '/v1/embedding-cloud/monitoring': {
      get: {
        summary: 'Embedding Cloud monitoring snapshot',
        operationId: 'getEmbeddingCloudMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/vector-cloud/engine': {
      get: {
        summary: 'Vector Cloud engine catalog',
        operationId: 'getVectorCloudEngine',
        responses: { '200': { description: 'Vector capabilities and honesty notes' } },
      },
    },
    '/v1/vector-cloud/collections': {
      get: {
        summary: 'Vector collections inventory',
        operationId: 'listVectorCloudCollections',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Workspace knowledge collection' } },
      },
    },
    '/v1/vector-cloud/namespaces': {
      get: {
        summary: 'Vector namespaces',
        operationId: 'listVectorCloudNamespaces',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Workspace as vector namespace' } },
      },
    },
    '/v1/vector-cloud/indexes': {
      get: {
        summary: 'Vector indexes',
        operationId: 'listVectorCloudIndexes',
        responses: { '200': { description: 'pgvector HNSW index catalog' } },
      },
    },
    '/v1/vector-cloud/stats': {
      get: {
        summary: 'Vector inventory stats',
        operationId: 'getVectorCloudStats',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Document/vector counts' } },
      },
    },
    '/v1/vector-cloud/search': {
      post: {
        summary: 'Nearest-neighbor vector search',
        operationId: 'searchVectorCloud',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Ranked cosine hits over knowledge_chunks' } },
      },
    },
    '/v1/vector-cloud/analytics': {
      get: {
        summary: 'Vector Cloud analytics',
        operationId: 'getVectorCloudAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Search audit + inventory aggregates' } },
      },
    },
    '/v1/vector-cloud/monitoring': {
      get: {
        summary: 'Vector Cloud monitoring snapshot',
        operationId: 'getVectorCloudMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/memory-cloud/engine': {
      get: {
        summary: 'Memory Cloud engine catalog',
        operationId: 'getMemoryCloudEngine',
        responses: { '200': { description: 'Memory capabilities and GDPR honesty notes' } },
      },
    },
    '/v1/memory-cloud/scopes': {
      get: {
        summary: 'Memory scopes and kinds',
        operationId: 'listMemoryCloudScopes',
        responses: { '200': { description: 'Supported scopes/kinds' } },
      },
    },
    '/v1/memory-cloud/memories': {
      get: {
        summary: 'List memory records',
        operationId: 'listMemoryCloudMemories',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Active memories' } },
      },
      post: {
        summary: 'Create memory record',
        operationId: 'createMemoryCloudMemory',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '201': { description: 'Created memory' } },
      },
    },
    '/v1/memory-cloud/search': {
      post: {
        summary: 'Search memories',
        operationId: 'searchMemoryCloud',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Text search hits' } },
      },
    },
    '/v1/memory-cloud/export': {
      post: {
        summary: 'GDPR export memories',
        operationId: 'exportMemoryCloud',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Subject/workspace memory export' } },
      },
    },
    '/v1/memory-cloud/erase': {
      post: {
        summary: 'GDPR erase memories',
        operationId: 'eraseMemoryCloud',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Erased memory count' } },
      },
    },
    '/v1/memory-cloud/analytics': {
      get: {
        summary: 'Memory Cloud analytics',
        operationId: 'getMemoryCloudAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Counts and audit aggregates' } },
      },
    },
    '/v1/memory-cloud/monitoring': {
      get: {
        summary: 'Memory Cloud monitoring snapshot',
        operationId: 'getMemoryCloudMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/knowledge-graph/engine': {
      get: {
        summary: 'Knowledge Graph engine catalog',
        operationId: 'getKnowledgeGraphEngine',
        responses: { '200': { description: 'Capabilities and Neo4j/ontology honesty notes' } },
      },
    },
    '/v1/knowledge-graph/domains': {
      get: {
        summary: 'Knowledge Graph domains',
        operationId: 'listKnowledgeGraphDomains',
        responses: { '200': { description: 'General shipped; vertical packs deferred' } },
      },
    },
    '/v1/knowledge-graph/entities': {
      get: {
        summary: 'List graph entities',
        operationId: 'listKnowledgeGraphEntities',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Entity list' } },
      },
      post: {
        summary: 'Create graph entity',
        operationId: 'createKnowledgeGraphEntity',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '201': { description: 'Created entity' } },
      },
    },
    '/v1/knowledge-graph/relationships': {
      get: {
        summary: 'List graph relationships',
        operationId: 'listKnowledgeGraphRelationships',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Edge list' } },
      },
      post: {
        summary: 'Create graph relationship',
        operationId: 'createKnowledgeGraphRelationship',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '201': { description: 'Created edge' } },
      },
    },
    '/v1/knowledge-graph/analytics': {
      get: {
        summary: 'Knowledge Graph analytics',
        operationId: 'getKnowledgeGraphAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Entity/edge counts' } },
      },
    },
    '/v1/knowledge-graph/monitoring': {
      get: {
        summary: 'Knowledge Graph monitoring snapshot',
        operationId: 'getKnowledgeGraphMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/context-engine/engine': {
      get: {
        summary: 'Context Engine catalog',
        operationId: 'getContextEngine',
        responses: { '200': { description: 'Capabilities and infinite-context honesty notes' } },
      },
    },
    '/v1/context-engine/sources': {
      get: {
        summary: 'Context sources catalog',
        operationId: 'listContextEngineSources',
        responses: { '200': { description: 'Assemblable context sources' } },
      },
    },
    '/v1/context-engine/assemble': {
      post: {
        summary: 'Assemble AI request context',
        operationId: 'assembleContextEngine',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Compressed multi-source promptContext' } },
      },
    },
    '/v1/context-engine/analytics': {
      get: {
        summary: 'Context Engine analytics',
        operationId: 'getContextEngineAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Assemble audit aggregates' } },
      },
    },
    '/v1/context-engine/monitoring': {
      get: {
        summary: 'Context Engine monitoring snapshot',
        operationId: 'getContextEngineMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/reasoning-cloud/engine': {
      get: {
        summary: 'Reasoning Cloud engine catalog',
        operationId: 'getReasoningCloudEngine',
        responses: { '200': { description: 'Strategies and reasoner-kernel honesty notes' } },
      },
    },
    '/v1/reasoning-cloud/strategies': {
      get: {
        summary: 'Reasoning strategies catalog',
        operationId: 'listReasoningCloudStrategies',
        responses: { '200': { description: 'Prompt strategies + tool catalog' } },
      },
    },
    '/v1/reasoning-cloud/reason': {
      post: {
        summary: 'Run multi-step reasoning',
        operationId: 'reasonReasoningCloud',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Steps, answer, optional branches/tools' } },
      },
    },
    '/v1/reasoning-cloud/analytics': {
      get: {
        summary: 'Reasoning Cloud analytics',
        operationId: 'getReasoningCloudAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Reason audits + chat token proxy' } },
      },
    },
    '/v1/reasoning-cloud/monitoring': {
      get: {
        summary: 'Reasoning Cloud monitoring snapshot',
        operationId: 'getReasoningCloudMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/recommendation-engine/engine': {
      get: {
        summary: 'Recommendation Engine catalog',
        operationId: 'getRecommendationEngine',
        responses: { '200': { description: 'Kinds and retail-recommender honesty notes' } },
      },
    },
    '/v1/recommendation-engine/kinds': {
      get: {
        summary: 'Recommendable kinds',
        operationId: 'listRecommendationEngineKinds',
        responses: { '200': { description: 'Supported recommendation kinds' } },
      },
    },
    '/v1/recommendation-engine/recommend': {
      post: {
        summary: 'Rank recommendations',
        operationId: 'recommendRecommendationEngine',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Scored items from light rankers' } },
      },
    },
    '/v1/recommendation-engine/analytics': {
      get: {
        summary: 'Recommendation Engine analytics',
        operationId: 'getRecommendationEngineAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Recommend audit aggregates' } },
      },
    },
    '/v1/recommendation-engine/monitoring': {
      get: {
        summary: 'Recommendation Engine monitoring snapshot',
        operationId: 'getRecommendationEngineMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/prompt-intelligence/engine': {
      get: {
        summary: 'Prompt Intelligence catalog',
        operationId: 'getPromptIntelligenceEngine',
        responses: { '200': { description: 'Capabilities and auto-prompt-lab honesty notes' } },
      },
    },
    '/v1/prompt-intelligence/keys': {
      get: {
        summary: 'Managed prompt keys',
        operationId: 'listPromptIntelligenceKeys',
        responses: { '200': { description: 'chat/rag/voice_faq keys' } },
      },
    },
    '/v1/prompt-intelligence/registry': {
      get: {
        summary: 'Workspace prompt registry',
        operationId: 'getPromptIntelligenceRegistry',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Active/fallback status per key' } },
      },
    },
    '/v1/prompt-intelligence/preview': {
      post: {
        summary: 'Preview/resolve a prompt body',
        operationId: 'previewPromptIntelligence',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Resolved body without LLM call' } },
      },
    },
    '/v1/prompt-intelligence/evaluate': {
      post: {
        summary: 'Heuristic prompt evaluation',
        operationId: 'evaluatePromptIntelligence',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Score + findings (not LLM-as-judge)' } },
      },
    },
    '/v1/prompt-intelligence/security-scan': {
      post: {
        summary: 'Prompt security pattern scan',
        operationId: 'securityScanPromptIntelligence',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Injection/secret pattern findings' } },
      },
    },
    '/v1/prompt-intelligence/marketplace': {
      get: {
        summary: 'Prompt marketplace listing counts',
        operationId: 'getPromptIntelligenceMarketplace',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Publisher prompt listing counts' } },
      },
    },
    '/v1/prompt-intelligence/analytics': {
      get: {
        summary: 'Prompt Intelligence analytics',
        operationId: 'getPromptIntelligenceAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Prompt audit aggregates' } },
      },
    },
    '/v1/prompt-intelligence/monitoring': {
      get: {
        summary: 'Prompt Intelligence monitoring snapshot',
        operationId: 'getPromptIntelligenceMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/decision-engine/engine': {
      get: {
        summary: 'AI Decision Engine catalog',
        operationId: 'getDecisionEngine',
        responses: { '200': { description: 'Kinds and BRMS honesty notes' } },
      },
    },
    '/v1/decision-engine/kinds': {
      get: {
        summary: 'Decision kinds',
        operationId: 'listDecisionEngineKinds',
        responses: { '200': { description: 'Supported decision kinds' } },
      },
    },
    '/v1/decision-engine/decide': {
      post: {
        summary: 'Make a bounded decision',
        operationId: 'decideDecisionEngine',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Decision + confidence from light rules' } },
      },
    },
    '/v1/decision-engine/analytics': {
      get: {
        summary: 'Decision Engine analytics',
        operationId: 'getDecisionEngineAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Decide audit aggregates' } },
      },
    },
    '/v1/decision-engine/monitoring': {
      get: {
        summary: 'Decision Engine monitoring snapshot',
        operationId: 'getDecisionEngineMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/ai-orchestration/engine': {
      get: {
        summary: 'AI Orchestration catalog',
        operationId: 'getAiOrchestrationEngine',
        responses: { '200': { description: 'Pipelines and multi-cloud-agent honesty notes' } },
      },
    },
    '/v1/ai-orchestration/pipelines': {
      get: {
        summary: 'Orchestration pipelines',
        operationId: 'listAiOrchestrationPipelines',
        responses: { '200': { description: 'Named e2e pipelines' } },
      },
    },
    '/v1/ai-orchestration/run': {
      post: {
        summary: 'Run an orchestration pipeline',
        operationId: 'runAiOrchestration',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Step results from real gateway/engine calls' } },
      },
    },
    '/v1/ai-orchestration/analytics': {
      get: {
        summary: 'AI Orchestration analytics',
        operationId: 'getAiOrchestrationAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Run audit aggregates' } },
      },
    },
    '/v1/ai-orchestration/monitoring': {
      get: {
        summary: 'AI Orchestration monitoring snapshot',
        operationId: 'getAiOrchestrationMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/intelligence-analytics/engine': {
      get: {
        summary: 'Intelligence Analytics catalog',
        operationId: 'getIntelligenceAnalyticsEngine',
        responses: {
          '200': { description: 'Capabilities and Language/Speech/Voice separation honesty' },
        },
      },
    },
    '/v1/intelligence-analytics/overview': {
      get: {
        summary: 'Intelligence Analytics overview',
        operationId: 'getIntelligenceAnalyticsOverview',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Usage/surfaces/cost/quality snapshot' } },
      },
    },
    '/v1/intelligence-analytics/usage': {
      get: {
        summary: 'Intelligence chat/embeddings usage',
        operationId: 'getIntelligenceAnalyticsUsage',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Chat and embeddings usage_events aggregates' } },
      },
    },
    '/v1/intelligence-analytics/surfaces': {
      get: {
        summary: 'Intelligence Cloud surface activity',
        operationId: 'getIntelligenceAnalyticsSurfaces',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Per-surface audit counts' } },
      },
    },
    '/v1/intelligence-analytics/latency': {
      get: {
        summary: 'Intelligence latency proxies',
        operationId: 'getIntelligenceAnalyticsLatency',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'latencyMs from audits when present' } },
      },
    },
    '/v1/intelligence-analytics/quality': {
      get: {
        summary: 'Intelligence quality/confidence proxies',
        operationId: 'getIntelligenceAnalyticsQuality',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Prompt eval scores and decision confidence' } },
      },
    },
    '/v1/intelligence-analytics/routing': {
      get: {
        summary: 'Model/routing decision aggregates',
        operationId: 'getIntelligenceAnalyticsRouting',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Decision Engine kind/decision counts' } },
      },
    },
    '/v1/intelligence-analytics/costs': {
      get: {
        summary: 'Estimated Intelligence Cloud costs',
        operationId: 'getIntelligenceAnalyticsCosts',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Estimated chat/embeddings USD' } },
      },
    },
    '/v1/intelligence-analytics/report': {
      get: {
        summary: 'Bundled Intelligence Analytics report',
        operationId: 'getIntelligenceAnalyticsReport',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Full JSON report' } },
      },
    },
    '/v1/intelligence-analytics/monitoring': {
      get: {
        summary: 'Intelligence Analytics monitoring snapshot',
        operationId: 'getIntelligenceAnalyticsMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/tts/engine': {
      get: {
        summary: 'Neural TTS engine catalog',
        operationId: 'getNeuralTtsEngine',
        responses: {
          '200': {
            description: 'Capabilities, engines, and architecture honesty notes',
          },
        },
      },
    },
    '/v1/tts/engine/analytics': {
      get: {
        summary: 'Neural TTS usage analytics',
        operationId: 'getNeuralTtsAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: {
          '200': { description: 'TTS character usage for the billing period' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/tts/voices': {
      get: {
        summary: 'Enriched Neural TTS voice catalog',
        operationId: 'listNeuralTtsVoices',
        parameters: [
          { name: 'gender', in: 'query', schema: { type: 'string' } },
          { name: 'language', in: 'query', schema: { type: 'string' } },
          { name: 'personality', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Voices with gender, personality, dialect/accent tags',
          },
        },
      },
    },
    '/v1/tts/voices/workspace': {
      get: {
        summary: 'Neural TTS voices including approved workspace clones',
        operationId: 'listNeuralTtsWorkspaceVoices',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: {
          '200': { description: 'Stock + own + approved clone voices' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/tts/synthesize': {
      post: {
        summary: 'Batch neural text-to-speech',
        operationId: 'synthesizeNeuralTts',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['text', 'voice'],
                properties: {
                  text: { type: 'string' },
                  voice: { type: 'string' },
                  language: { type: 'string' },
                  format: { type: 'string', enum: ['mp3', 'wav', 'opus', 'aac', 'flac'] },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Raw audio bytes',
            content: { 'audio/mpeg': { schema: { type: 'string', format: 'binary' } } },
          },
        },
      },
    },
    '/v1/tts/stream': {
      post: {
        summary: 'Streaming neural TTS (chunk SSE after synthesis)',
        operationId: 'streamNeuralTts',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['text', 'voice'],
                properties: {
                  text: { type: 'string' },
                  voice: { type: 'string' },
                  language: { type: 'string' },
                  format: { type: 'string', enum: ['mp3', 'wav', 'opus', 'aac', 'flac'] },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'text/event-stream with meta/audio/done events',
          },
        },
      },
    },
    '/v1/voice-cloning/engine': {
      get: {
        summary: 'Voice Cloning engine catalog',
        operationId: 'getVoiceCloningEngine',
        responses: { '200': { description: 'Capabilities, trust gates, architecture notes' } },
      },
    },
    '/v1/voice-cloning/consent/policy': {
      get: {
        summary: 'Voice cloning consent policy',
        operationId: 'getVoiceCloningConsentPolicy',
        responses: { '200': { description: 'Required consent/ownership/review rules' } },
      },
    },
    '/v1/voice-cloning/library': {
      get: {
        summary: 'Enterprise voice clone library',
        operationId: 'listVoiceCloningLibrary',
        security: [{ ClerkAuth: [] }],
        responses: { '200': { description: 'Workspace clones with governance metadata' } },
      },
    },
    '/v1/voice-cloning/enroll': {
      post: {
        summary: 'Enroll a voice clone (instant or professional)',
        operationId: 'enrollVoiceClone',
        security: [{ ClerkAuth: [] }],
        responses: { '201': { description: 'Clone pending abuse review' } },
      },
    },
    '/v1/voice-cloning/enroll/stream': {
      post: {
        summary: 'Enroll with SSE progress events',
        operationId: 'enrollVoiceCloneStream',
        security: [{ ClerkAuth: [] }],
        responses: { '200': { description: 'text/event-stream enrollment progress' } },
      },
    },
    '/v1/emotion-voice/engine': {
      get: {
        summary: 'Emotion Voice engine catalog',
        operationId: 'getEmotionVoiceEngine',
        responses: { '200': { description: 'Capabilities and honesty notes' } },
      },
    },
    '/v1/emotion-voice/profiles': {
      get: {
        summary: 'Emotion and domain voice profiles',
        operationId: 'listEmotionVoiceProfiles',
        responses: { '200': { description: 'Happy/sad/… and domain tones' } },
      },
    },
    '/v1/emotion-voice/synthesize': {
      post: {
        summary: 'Synthesize speech with an emotion/domain profile',
        operationId: 'synthesizeEmotionVoice',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Raw audio bytes' } },
      },
    },
    '/v1/emotion-voice/stream': {
      post: {
        summary: 'Emotion voice chunk SSE stream',
        operationId: 'streamEmotionVoice',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'text/event-stream' } },
      },
    },
    '/v1/voice-studio/engine': {
      get: {
        summary: 'Voice Studio engine catalog',
        operationId: 'getVoiceStudioEngine',
        responses: { '200': { description: 'Capabilities and honesty notes' } },
      },
    },
    '/v1/voice-studio/library': {
      get: {
        summary: 'Voice Studio library (TTS + clones)',
        operationId: 'getVoiceStudioLibrary',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Voice catalog' } },
      },
    },
    '/v1/voice-studio/ssml/compile': {
      post: {
        summary: 'Compile SSML lite to plain speak/pause plan',
        operationId: 'compileVoiceStudioSsml',
        responses: { '200': { description: 'Compiled plan' } },
      },
    },
    '/v1/voice-studio/pronunciation': {
      get: {
        summary: 'List Voice Studio pronunciation lexicon',
        operationId: 'listVoiceStudioPronunciation',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Lexemes' } },
      },
      post: {
        summary: 'Upsert pronunciation lexeme',
        operationId: 'upsertVoiceStudioPronunciation',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Lexeme' } },
      },
    },
    '/v1/voice-studio/profiles': {
      get: {
        summary: 'List Voice Studio voice profiles',
        operationId: 'listVoiceStudioProfiles',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Profiles' } },
      },
      post: {
        summary: 'Upsert Voice Studio profile',
        operationId: 'upsertVoiceStudioProfile',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Profile' } },
      },
    },
    '/v1/voice-studio/projects': {
      get: {
        summary: 'List Voice Studio projects',
        operationId: 'listVoiceStudioProjects',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Projects' } },
      },
      post: {
        summary: 'Upsert Voice Studio project',
        operationId: 'upsertVoiceStudioProject',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Project' } },
      },
    },
    '/v1/voice-studio/preview': {
      post: {
        summary: 'Preview studio speech (lexicon + SSML lite)',
        operationId: 'previewVoiceStudio',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Raw audio bytes' } },
      },
    },
    '/v1/voice-studio/generate': {
      post: {
        summary: 'Generate studio speech',
        operationId: 'generateVoiceStudio',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Raw audio bytes' } },
      },
    },
    '/v1/voice-studio/test': {
      post: {
        summary: 'Quick voice test clip',
        operationId: 'testVoiceStudioVoice',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Raw audio bytes' } },
      },
    },
    '/v1/voice-studio/compare': {
      post: {
        summary: 'Compare the same text across voices',
        operationId: 'compareVoiceStudioVoices',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Multi-voice base64 clips' } },
      },
    },
    '/v1/voice-studio/timeline/render': {
      post: {
        summary: 'Render linear timeline clips',
        operationId: 'renderVoiceStudioTimeline',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Linear concat + per-clip audio' } },
      },
    },
    '/v1/voice-enhancement/engine': {
      get: {
        summary: 'Voice Enhancement engine catalog',
        operationId: 'getVoiceEnhancementEngine',
        responses: { '200': { description: 'Capabilities and honesty notes' } },
      },
    },
    '/v1/voice-enhancement/profiles': {
      get: {
        summary: 'Voice Enhancement cleanup profiles',
        operationId: 'listVoiceEnhancementProfiles',
        responses: { '200': { description: 'Mic/podcast/meeting/broadcast/restore profiles' } },
      },
    },
    '/v1/voice-enhancement/echo': {
      get: {
        summary: 'Echo cancellation status (deferred)',
        operationId: 'getVoiceEnhancementEcho',
        responses: { '200': { description: 'Deferred AEC status' } },
      },
    },
    '/v1/voice-enhancement/enhance': {
      post: {
        summary: 'Enhance audio with a cleanup profile',
        operationId: 'enhanceVoice',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'WAV base64 + before/after metrics' } },
      },
    },
    '/v1/voice-enhancement/upscale': {
      post: {
        summary: 'Linear audio upsample',
        operationId: 'upscaleVoiceEnhancement',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Upsampled WAV base64' } },
      },
    },
    '/v1/voice-enhancement/enhance/stream': {
      post: {
        summary: 'Enhance with SSE progress',
        operationId: 'streamEnhanceVoice',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'text/event-stream' } },
      },
    },
    '/v1/voice-biometrics/engine': {
      get: {
        summary: 'Voice Biometrics engine catalog',
        operationId: 'getVoiceBiometricsEngine',
        responses: { '200': { description: 'Capabilities and honesty notes' } },
      },
    },
    '/v1/voice-biometrics/encryption': {
      get: {
        summary: 'Fingerprint encryption-at-rest status',
        operationId: 'getVoiceBiometricsEncryption',
        responses: { '200': { description: 'AES-GCM key configuration status' } },
      },
    },
    '/v1/voice-biometrics/enroll': {
      post: {
        summary: 'Enroll encrypted voice biometric template',
        operationId: 'enrollVoiceBiometric',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Encrypted enrollment result' } },
      },
    },
    '/v1/voice-biometrics/verify': {
      post: {
        summary: '1:1 voice biometric verify',
        operationId: 'verifyVoiceBiometric',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Verify score' } },
      },
    },
    '/v1/voice-biometrics/identify': {
      post: {
        summary: '1:N voice biometric identify',
        operationId: 'identifyVoiceBiometric',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Identify candidates' } },
      },
    },
    '/v1/voice-biometrics/authenticate': {
      post: {
        summary: 'Composite voice authentication decision',
        operationId: 'authenticateVoiceBiometric',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'accept / step_up / reject' } },
      },
    },
    '/v1/voice-biometrics/anti-spoof': {
      post: {
        summary: 'Heuristic anti-spoof assessment',
        operationId: 'antiSpoofVoiceBiometric',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Spoof risk (not NIST PAD)' } },
      },
    },
    '/v1/voice-biometrics/liveness': {
      post: {
        summary: 'Heuristic liveness check',
        operationId: 'livenessVoiceBiometric',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Liveness result (not certified PAD)' } },
      },
    },
    '/v1/voice-biometrics/risk': {
      get: {
        summary: 'Workspace / profile fraud risk score',
        operationId: 'riskVoiceBiometric',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Heuristic risk' } },
      },
    },
    '/v1/voice-marketplace/engine': {
      get: {
        summary: 'Voice Marketplace engine catalog',
        operationId: 'getVoiceMarketplaceEngine',
        responses: { '200': { description: 'Capabilities and honesty notes' } },
      },
    },
    '/v1/voice-marketplace/language-packs': {
      get: {
        summary: 'Curated language voice packs',
        operationId: 'listVoiceMarketplaceLanguagePacks',
        responses: { '200': { description: 'own:* language packs' } },
      },
    },
    '/v1/voice-marketplace/listings': {
      get: {
        summary: 'List voice marketplace listings',
        operationId: 'listVoiceMarketplaceListings',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Published or mine listings' } },
      },
      post: {
        summary: 'Publish a voice SKU / pack',
        operationId: 'publishVoiceMarketplaceListing',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '201': { description: 'Created listing' } },
      },
    },
    '/v1/voice-marketplace/listings/{id}/install': {
      post: {
        summary: 'Install / license a voice listing',
        operationId: 'installVoiceMarketplaceListing',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'License entitlement' } },
      },
    },
    '/v1/voice-marketplace/listings/{id}/reviews': {
      get: {
        summary: 'List reviews for a voice listing',
        operationId: 'listVoiceMarketplaceReviews',
        responses: { '200': { description: 'Reviews' } },
      },
      post: {
        summary: 'Rate / review a voice listing',
        operationId: 'reviewVoiceMarketplaceListing',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Review' } },
      },
    },
    '/v1/voice-marketplace/analytics': {
      get: {
        summary: 'Publisher analytics for voice marketplace',
        operationId: 'voiceMarketplaceAnalytics',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Aggregates' } },
      },
    },
    '/v1/voice-analytics/engine': {
      get: {
        summary: 'Voice Analytics engine catalog',
        operationId: 'getVoiceAnalyticsEngine',
        responses: { '200': { description: 'Voice analytics capabilities' } },
      },
    },
    '/v1/voice-analytics/overview': {
      get: {
        summary: 'Voice Analytics overview',
        operationId: 'getVoiceAnalyticsOverview',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Usage + revenue snapshot' } },
      },
    },
    '/v1/voice-analytics/usage': {
      get: {
        summary: 'Voice TTS usage',
        operationId: 'getVoiceAnalyticsUsage',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'TTS + voice audit aggregates' } },
      },
    },
    '/v1/voice-analytics/voices': {
      get: {
        summary: 'Voice id frequency + clones',
        operationId: 'getVoiceAnalyticsVoices',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Voice breakdown' } },
      },
    },
    '/v1/voice-analytics/revenue': {
      get: {
        summary: 'Voice Marketplace revenue',
        operationId: 'getVoiceAnalyticsRevenue',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Publisher sale aggregates' } },
      },
    },
    '/v1/voice-analytics/marketplace': {
      get: {
        summary: 'Voice Marketplace analytics slice',
        operationId: 'getVoiceAnalyticsMarketplace',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Marketplace aggregates' } },
      },
    },
    '/v1/voice-analytics/report': {
      get: {
        summary: 'Bundled Voice Analytics report',
        operationId: 'getVoiceAnalyticsReport',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Enterprise voice report JSON' } },
      },
    },
    '/v1/voice-analytics/monitoring': {
      get: {
        summary: 'Voice Analytics monitoring snapshot',
        operationId: 'getVoiceAnalyticsMonitoring',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Monitoring snapshot' } },
      },
    },
    '/v1/audio/transcriptions': {
      post: {
        summary: 'Transcribe audio (speech-to-text)',
        operationId: 'createTranscription',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: { type: 'string', format: 'binary' },
                  language: {
                    type: 'string',
                    description: 'Optional ISO-639-1 language hint',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Transcript',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    text: { type: 'string' },
                    language: { type: 'string', nullable: true },
                    durationSeconds: { type: 'number' },
                    durationMinutes: { type: 'number' },
                    provider: { type: 'string' },
                  },
                },
              },
            },
          },
          '503': {
            description: 'OPENAI_API_KEY not configured',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/audio/voices': {
      get: {
        summary: 'List TTS voices',
        operationId: 'listVoices',
        responses: {
          '200': {
            description: 'Vendor voice catalog',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          gender: { type: 'string' },
                          languages: { type: 'array', items: { type: 'string' } },
                          provider: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/v1/audio/speech': {
      post: {
        summary: 'Synthesize speech (text-to-speech)',
        operationId: 'createSpeech',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['text', 'voice'],
                properties: {
                  text: { type: 'string', maxLength: 4096 },
                  voice: {
                    type: 'string',
                    example: 'alloy',
                    description:
                      'Stock OpenAI voice id, own:* rented African TTS (VL-121), or clone:{voiceCloneId}',
                  },
                  language: { type: 'string' },
                  format: { type: 'string', enum: ['mp3', 'wav', 'opus', 'aac', 'flac'] },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Audio bytes',
            content: {
              'audio/mpeg': { schema: { type: 'string', format: 'binary' } },
            },
            headers: {
              'X-VerbaLab-Provider': { schema: { type: 'string' } },
              'X-VerbaLab-Voice': { schema: { type: 'string' } },
              'X-VerbaLab-Characters': { schema: { type: 'string' } },
              'X-VerbaLab-Watermark': {
                schema: { type: 'string' },
                description: 'required when synthesizing an approved voice clone',
              },
            },
          },
          '503': {
            description: 'OPENAI_API_KEY / ELEVENLABS_API_KEY not configured',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/voice-clones': {
      get: {
        summary: 'List voice clones for the workspace',
        operationId: 'listVoiceClones',
        security: [{ ClerkAuth: [] }],
        responses: { '200': { description: 'Clone profiles' } },
      },
      post: {
        summary: 'Create a voice clone (Pro) with consent + samples; starts pending_review',
        operationId: 'createVoiceClone',
        security: [{ ClerkAuth: [] }],
        responses: {
          '201': { description: 'Created pending_review' },
          '402': { description: 'Pro required' },
        },
      },
    },
    '/v1/voice-clones/{id}': {
      get: {
        summary: 'Get a voice clone by id',
        operationId: 'getVoiceClone',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Clone profile' },
          '404': {
            description: 'Not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/voice-clones/{id}/review': {
      post: {
        summary: 'Abuse-review approve/reject (Pro). Approve calls ElevenLabs (or fixture).',
        operationId: 'reviewVoiceClone',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Updated' },
          '503': { description: 'ElevenLabs not configured' },
        },
      },
    },
    '/v1/voice-clones/{id}/disable': {
      post: {
        summary: 'Disable a voice clone (abuse / policy)',
        operationId: 'disableVoiceClone',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Disabled' } },
      },
    },
    '/v1/ocr': {
      post: {
        summary: 'Extract text from an image (OCR)',
        operationId: 'extractOcr',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: { type: 'string', format: 'binary' },
                  languageHint: { type: 'string' },
                  source: {
                    type: 'string',
                    description: 'Required with target to translate OCR text',
                  },
                  target: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'OCR result',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    text: { type: 'string' },
                    pages: { type: 'integer' },
                    provider: { type: 'string' },
                    characters: { type: 'integer' },
                    translatedText: { type: 'string', nullable: true },
                    translateProvider: { type: 'string', nullable: true },
                  },
                },
              },
            },
          },
          '503': {
            description: 'Vision API key not configured',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/v1/glossary/terms': {
      get: {
        summary: 'List glossary terms',
        operationId: 'listGlossaryTerms',
        security: [{ ClerkAuth: [] }],
        parameters: [
          { name: 'source', in: 'query', schema: { type: 'string' } },
          { name: 'target', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Terms for the workspace' } },
      },
      post: {
        summary: 'Create glossary term',
        operationId: 'createGlossaryTerm',
        security: [{ ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['sourceLang', 'targetLang', 'sourceTerm', 'targetTerm'],
                properties: {
                  sourceLang: { type: 'string' },
                  targetLang: { type: 'string' },
                  sourceTerm: { type: 'string' },
                  targetTerm: { type: 'string' },
                  caseSensitive: { type: 'boolean' },
                  wholeWord: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Created' }, '409': { description: 'Duplicate' } },
      },
    },
    '/v1/vertical-glossaries': {
      get: {
        summary: 'List platform vertical glossary packs',
        operationId: 'listVerticalGlossaries',
        security: [{ ClerkAuth: [] }],
        responses: {
          '200': {
            description: 'Catalog with preview terms; full terms only after Pro install',
          },
        },
      },
    },
    '/v1/vertical-glossaries/installs': {
      get: {
        summary: 'List vertical glossary installs for the workspace',
        operationId: 'listVerticalGlossaryInstalls',
        security: [{ ClerkAuth: [] }],
        responses: { '200': { description: 'Install receipts' } },
      },
    },
    '/v1/vertical-glossaries/{id}': {
      get: {
        summary: 'Get a vertical glossary pack',
        operationId: 'getVerticalGlossary',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Pack detail (full terms if Pro or installed)' },
          '404': { description: 'Not found' },
        },
      },
    },
    '/v1/vertical-glossaries/{id}/install': {
      post: {
        summary: 'Install a vertical glossary pack into the workspace (Pro)',
        operationId: 'installVerticalGlossary',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Terms copied into workspace glossary' },
          '402': { description: 'Pro plan required' },
          '403': { description: 'Owner/admin required' },
          '404': { description: 'Pack not found' },
        },
      },
    },
    '/v1/tm/entries': {
      get: {
        summary: 'List translation memory entries',
        operationId: 'listTmEntries',
        security: [{ ClerkAuth: [] }],
        responses: { '200': { description: 'Approved TM segments' } },
      },
      post: {
        summary: 'Upsert approved TM segment',
        operationId: 'upsertTmEntry',
        security: [{ ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['sourceLang', 'targetLang', 'sourceText', 'targetText'],
                properties: {
                  sourceLang: { type: 'string' },
                  targetLang: { type: 'string' },
                  sourceText: { type: 'string' },
                  targetText: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Upserted' } },
      },
    },
    '/v1/reviews': {
      get: {
        summary: 'List translation quality reviews',
        operationId: 'listReviews',
        security: [{ ClerkAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'accepted', 'rejected'] } },
          { name: 'needsReview', in: 'query', schema: { type: 'boolean' } },
        ],
        responses: { '200': { description: 'Reviews' } },
      },
    },
    '/v1/reviews/{id}/accept': {
      post: {
        summary: 'Accept a review (optionally add to TM)',
        operationId: 'acceptReview',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Accepted' } },
      },
    },
    '/v1/reviews/{id}/reject': {
      post: {
        summary: 'Reject a review',
        operationId: 'rejectReview',
        security: [{ ClerkAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Rejected' } },
      },
    },
    '/v1/localize': {
      post: {
        summary: 'Translate a JSON/YAML i18n document',
        operationId: 'localizeContent',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['source', 'target', 'content'],
                properties: {
                  format: { type: 'string', enum: ['json', 'yaml'] },
                  source: { type: 'string' },
                  target: { type: 'string' },
                  content: {},
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Localized content + serialized file' } },
      },
    },
    '/v1/localize/file': {
      post: {
        summary: 'Translate an uploaded .json/.yaml file',
        operationId: 'localizeFile',
        security: [{ ApiKeyAuth: [] }, { ClerkAuth: [] }],
        responses: { '200': { description: 'Localized content + serialized file' } },
      },
    },
  },
} as const;
