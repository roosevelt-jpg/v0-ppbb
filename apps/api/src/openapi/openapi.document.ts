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
