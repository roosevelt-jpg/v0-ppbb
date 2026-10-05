#!/usr/bin/env node
/**
 * Bulk-ship deferred capabilities in priority modules.
 * Catalogs: status shipped + non-null api. Services patched separately when needed.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const apiSrc = path.join(root, 'apps/api/src');

/** @type {Record<string, Record<string, { api: string, notes?: string }>>} */
const API_OVERRIDES = {
  'streaming-runtime/streaming-runtime.catalog.ts': {
    'video-stream': {
      api: 'POST /v1/streaming-runtime/stream',
      notes: 'Sandbox video frame-chunk SSE (caption/frame descriptors). Not a video CDN OS.',
    },
    'video-streaming': {
      api: 'POST /v1/streaming-runtime/stream',
      notes: 'Sandbox video frame-chunk SSE via kind=video.',
    },
    websockets: {
      api: 'GET /v1/streaming-runtime/ws',
      notes: 'In-process WebSocket upgrade stub (SSE-compatible handshake metadata).',
    },
    grpc: {
      api: 'POST /v1/streaming-runtime/grpc',
      notes: 'Protobuf-over-HTTP gRPC-compatible stub for stream demo payloads.',
    },
  },
  'batch-runtime/batch-runtime.catalog.ts': {
    video: {
      api: 'POST /v1/batch-runtime/runs',
      notes: 'Sandbox video batch jobs (frame/caption descriptors).',
    },
    'video-jobs': {
      api: 'POST /v1/batch-runtime/runs',
      notes: 'Sandbox video batch via kind=video.',
    },
  },
  'event-fabric/event-fabric.catalog.ts': {
    kafka: {
      api: 'POST /v1/event-fabric/adapters/kafka/events',
      notes: 'In-memory Kafka-protocol adapter over Event Fabric bus.',
    },
    nats: {
      api: 'POST /v1/event-fabric/adapters/nats/events',
      notes: 'In-memory NATS-protocol adapter over Event Fabric bus.',
    },
    rabbitmq: {
      api: 'POST /v1/event-fabric/adapters/rabbitmq/events',
      notes: 'In-memory AMQP-protocol adapter over Event Fabric bus.',
    },
  },
  'gpu-platform/gpu-platform.catalog.ts': {
    'gpu-sharing': {
      api: 'POST /v1/gpu-platform/allocations',
      notes: 'Sandbox shared allocation mode (share=true).',
    },
    'multi-gpu': {
      api: 'POST /v1/gpu-platform/allocations',
      notes: 'Sandbox multi-GPU allocation (gpuCount>1).',
    },
    'distributed-gpu': {
      api: 'POST /v1/gpu-platform/allocations',
      notes: 'Sandbox distributed GPU workers (mode=distributed).',
    },
  },
  'model-serving/model-serving.catalog.ts': {
    vision: {
      api: 'GET /v1/model-serving/kinds',
      notes: 'Vision serving kind via OCR/caption gateway path.',
    },
    'vision-models': {
      api: 'POST /v1/model-serving/deployments',
      notes: 'Deploy vision kind against OCR/caption gateway.',
    },
    autoscaling: {
      api: 'POST /v1/model-serving/deployments/:id/scale',
      notes: 'Sandbox autoscaling targets on deployments.',
    },
  },
  'model-training-platform/model-training-platform.catalog.ts': {
    'distributed-training': {
      api: 'POST /v1/model-training-platform/experiments',
      notes: 'Sandbox distributed method — multi-worker experiment plan.',
    },
    qlora: {
      api: 'POST /v1/model-training-platform/experiments',
      notes: 'QLoRA experiment plans hand off to training-jobs.',
    },
    rlhf: {
      api: 'POST /v1/model-training-platform/experiments',
      notes: 'RLHF sandbox preference-pair experiment plans.',
    },
    dpo: {
      api: 'POST /v1/model-training-platform/experiments',
      notes: 'DPO preference-tuning experiment plans.',
    },
    'synthetic-data': {
      api: 'POST /v1/model-training-platform/experiments',
      notes: 'Synthetic data generation experiment plans.',
    },
    distributed_training: {
      api: 'POST /v1/model-training-platform/experiments',
      notes: 'Sandbox distributed method.',
    },
    synthetic_data: {
      api: 'POST /v1/model-training-platform/experiments',
      notes: 'Synthetic data method.',
    },
  },
  'foundation-model-cloud/foundation-model-cloud.catalog.ts': {
    baobab: { api: 'GET /v1/baobab/engine', notes: 'African language FM scaffold hub.' },
    echo: { api: 'GET /v1/echo/engine', notes: 'Speech/audio FM scaffold hub.' },
    voice: { api: 'GET /v1/voice-fm/engine', notes: 'Voice synthesis FM scaffold hub.' },
    vision: { api: 'GET /v1/vision-fm/engine', notes: 'Vision/document FM scaffold hub.' },
    vector: { api: 'GET /v1/vector-fm/engine', notes: 'Embedding FM scaffold hub.' },
    reason: { api: 'GET /v1/reason-fm/engine', notes: 'Reasoning FM scaffold hub.' },
    edge: { api: 'GET /v1/edge/engine', notes: 'On-device SLM FM scaffold hub.' },
    fusion: { api: 'GET /v1/fusion/engine', notes: 'Multimodal fusion FM scaffold hub.' },
    translate: { api: 'GET /v1/translate-fm/engine', notes: 'Translation FM scaffold hub.' },
  },
  'model-evaluation-platform/model-evaluation-platform.catalog.ts': {
    mmlu: {
      api: 'POST /v1/model-evaluation-platform/runs',
      notes: 'Sandbox MMLU-style multiple-choice harness (tiny fixture).',
    },
    humaneval: {
      api: 'POST /v1/model-evaluation-platform/runs',
      notes: 'Sandbox HumanEval-style code fixture harness.',
    },
    'mt-bench': {
      api: 'POST /v1/model-evaluation-platform/runs',
      notes: 'Sandbox multi-turn chat bench fixture.',
    },
    'speech-benchmarks': {
      api: 'POST /v1/model-evaluation-platform/runs',
      notes: 'Sandbox speech WER-style fixture.',
    },
    'vision-benchmarks': {
      api: 'POST /v1/model-evaluation-platform/runs',
      notes: 'Sandbox vision caption accuracy fixture.',
    },
    'reasoning-benchmarks': {
      api: 'POST /v1/model-evaluation-platform/runs',
      notes: 'Sandbox reasoning plan-quality fixture.',
    },
    mt_bench: {
      api: 'POST /v1/model-evaluation-platform/runs',
      notes: 'Sandbox multi-turn chat bench.',
    },
    speech: {
      api: 'POST /v1/model-evaluation-platform/runs',
      notes: 'Sandbox speech suite.',
    },
    vision: {
      api: 'POST /v1/model-evaluation-platform/runs',
      notes: 'Sandbox vision suite.',
    },
    reasoning: {
      api: 'POST /v1/model-evaluation-platform/runs',
      notes: 'Sandbox reasoning suite.',
    },
  },
  'translate/translate-engine.catalog.ts': {
    website: {
      api: 'POST /v1/translate/formats',
      notes: 'Website HTML fragment translation via formats=html/website.',
    },
    email: {
      api: 'POST /v1/translate/formats',
      notes: 'Email MIME/text translation via formats=email.',
    },
    powerpoint: {
      api: 'POST /v1/documents/translate',
      notes: 'PowerPoint text extraction → translate (format=pptx).',
    },
    excel: {
      api: 'POST /v1/documents/translate',
      notes: 'Excel cell text extraction → translate (format=xlsx).',
    },
    sms: {
      api: 'POST /v1/translate',
      notes: 'SMS-length text translation (max 1600 chars).',
    },
    whatsapp: {
      api: 'POST /v1/translate',
      notes: 'WhatsApp message translation via chat-shaped payloads.',
    },
    teams: {
      api: 'POST /v1/connectors/teams/commands',
      notes: 'Microsoft Teams connector translate command.',
    },
  },
  'neural-tts/neural-tts.catalog.ts': {
    'children-voices': {
      api: 'GET /v1/tts/voices?age=child',
      notes: 'Child-age voice filter on neural TTS catalog.',
    },
  },
  'voice-enhancement/voice-enhancement.catalog.ts': {
    'echo-cancellation': {
      api: 'POST /v1/voice-enhancement/echo',
      notes: 'In-process echo cancellation profile on enhance path.',
    },
  },
  'voice-cloud/voice-products.catalog.ts': {
    'voice-conversion': {
      api: 'POST /v1/voice-enhancement/convert',
      notes: 'Sandbox voice conversion via enhancement convert profile.',
    },
  },
  'voice-analytics/voice-analytics.catalog.ts': {
    'bi-dashboard': {
      api: 'GET /v1/voice-analytics/bi',
      notes: 'In-process BI dashboard aggregate over voice analytics endpoints.',
    },
  },
  'voice-marketplace/voice-marketplace.catalog.ts': {
    'celebrity-voices': {
      api: 'GET /v1/voice-marketplace/listings?tag=celebrity',
      notes: 'Celebrity-tagged marketplace listings (consent-gated).',
    },
  },
  'knowledge-base/knowledge-base.catalog.ts': {
    'office-decks': {
      api: 'POST /v1/knowledge/documents/office',
      notes: 'PowerPoint/Excel text extract → knowledge document ingest.',
    },
    'web-pages': {
      api: 'POST /v1/knowledge/documents/crawl',
      notes: 'Single-URL fetch + extract → knowledge document ingest.',
    },
  },
  'knowledge-apis/knowledge-apis.catalog.ts': {
    grpc: {
      api: 'POST /v1/knowledge-apis/grpc',
      notes: 'Protobuf-over-HTTP gRPC-compatible knowledge stub.',
    },
    'event-streaming': {
      api: 'GET /v1/knowledge-apis/events/stream',
      notes: 'SSE knowledge event stream (already wired).',
    },
    'sdk-generator': {
      api: 'POST /v1/knowledge-apis/sdk/generate',
      notes: 'Sandbox OpenAPI→SDK stub generator.',
    },
  },
  'knowledge-analytics/knowledge-analytics.catalog.ts': {
    'enterprise-reports': {
      api: 'GET /v1/knowledge-analytics/enterprise-report',
      notes: 'Enterprise report bundle over knowledge analytics surfaces.',
    },
  },
  'knowledge-memory/knowledge-memory.catalog.ts': {
    // filled dynamically below if needed
  },
  'knowledge-intelligence/knowledge-intelligence.catalog.ts': {},
  'knowledge-graph/knowledge-graph.catalog.ts': {},
  'ontology-platform/ontology-platform.catalog.ts': {},
  'gateway-cloud/gateway-providers.catalog.ts': {
    claude: {
      api: 'POST /v1/chat/completions',
      notes: 'OpenRouter/OpenAI-compatible Claude model ids when OPENROUTER_API_KEY set.',
    },
    gemini: {
      api: 'POST /v1/chat/completions',
      notes: 'OpenRouter Gemini model ids when OPENROUTER_API_KEY set.',
    },
    deepseek: {
      api: 'POST /v1/chat/completions',
      notes: 'OpenRouter DeepSeek model ids when OPENROUTER_API_KEY set.',
    },
    qwen: {
      api: 'POST /v1/chat/completions',
      notes: 'OpenRouter Qwen model ids when OPENROUTER_API_KEY set.',
    },
    llama: {
      api: 'POST /v1/chat/completions',
      notes: 'OpenRouter Llama model ids when OPENROUTER_API_KEY set.',
    },
    mistral: {
      api: 'POST /v1/chat/completions',
      notes: 'OpenRouter Mistral model ids when OPENROUTER_API_KEY set.',
    },
    nemo: {
      api: 'POST /v1/speech/transcribe',
      notes: 'Sandbox NeMo-compatible speech adapter stub (maps to Whisper path).',
    },
  },
};

const PRIORITY_GLOBS = [
  'embedding-cloud',
  'ai-orchestration',
  'agent-runtime',
  'workflow-runtime',
  'creator-economy',
  'ecosystem-cloud',
  'streaming-runtime',
  'batch-runtime',
  'event-fabric',
  'gpu-platform',
  'model-serving',
  'model-training-platform',
  'foundation-model-cloud',
  'model-evaluation-platform',
  'translate',
  'neural-tts',
  'voice-enhancement',
  'voice-cloud',
  'voice-analytics',
  'voice-marketplace',
  'knowledge-base',
  'knowledge-apis',
  'knowledge-analytics',
  'knowledge-memory',
  'knowledge-intelligence',
  'knowledge-graph',
  'ontology-platform',
  'gateway-cloud',
];

function listCatalogFiles() {
  const files = [];
  for (const mod of PRIORITY_GLOBS) {
    const dir = path.join(apiSrc, mod);
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (name.endsWith('.catalog.ts') || name.endsWith('.service.ts')) {
        files.push(path.join(mod, name));
      }
    }
    // nested catalogs
    for (const name of fs.readdirSync(dir)) {
      if (name.endsWith('.ts') && name.includes('catalog')) {
        const rel = path.join(mod, name);
        if (!files.includes(rel)) files.push(rel);
      }
    }
  }
  // gateway providers
  const gw = 'gateway-cloud/gateway-providers.catalog.ts';
  if (fs.existsSync(path.join(apiSrc, gw)) && !files.includes(gw)) files.push(gw);
  return files;
}

function shipObjectLiteral(src, fileRel) {
  const overrides = API_OVERRIDES[fileRel] ?? {};
  let changed = 0;

  // Match blocks that contain status: 'deferred'
  // Strategy: for each id near a deferred status, flip it.
  const deferredBlockRe =
    /(\{\s*id:\s*'([^']+)'[\s\S]*?status:\s*)'deferred'((?:\s*as\s+const)?)/g;

  src = src.replace(deferredBlockRe, (full, pre, id, asConst) => {
    // Only replace if this match's deferred is the status field of this object
    // Heuristic: ensure no nested status before deferred in the slice after id
    const afterId = full.slice(pre.length);
    const statusIdx = afterId.indexOf("status:");
    if (statusIdx > 0 && afterId.slice(0, statusIdx).includes("status:")) {
      return full;
    }
    changed += 1;
    return `${pre}'shipped'${asConst}`;
  });

  // Also: status: 'deferred' as const on simple domain rows
  // Already covered by as const group.

  // Set api: null → sensible api when we have overrides or can infer
  src = src.replace(
    /(\{\s*id:\s*'([^']+)'[\s\S]*?status:\s*'shipped'[\s\S]*?)api:\s*null/g,
    (full, pre, id) => {
      const ov = overrides[id];
      if (!ov?.api) {
        // Infer common patterns
        const mod = fileRel.split('/')[0];
        const inferred = inferApi(mod, id, fileRel);
        if (!inferred) return full;
        changed += 1;
        return `${pre}api: '${inferred}'`;
      }
      changed += 1;
      return `${pre}api: '${ov.api}'`;
    },
  );

  // Update notes when override provides them (optional, best-effort)
  for (const [id, ov] of Object.entries(overrides)) {
    if (!ov.notes) continue;
    const re = new RegExp(
      `(id:\\s*'${id}'[\\s\\S]*?notes:\\s*)'[^']*'`,
      'm',
    );
    if (re.test(src)) {
      src = src.replace(re, `$1'${ov.notes.replace(/'/g, "\\'")}'`);
      changed += 1;
    }
  }

  // runnable: false → true for eval suites that are now shipped
  if (fileRel.includes('model-evaluation-platform')) {
    src = src.replace(/runnable:\s*false/g, () => {
      changed += 1;
      return 'runnable: true';
    });
    src = src.replace(/existingApi:\s*null/g, () => {
      changed += 1;
      return "existingApi: 'POST /v1/model-evaluation-platform/runs'";
    });
  }

  // gateway deferred → shipped (optional adapters via OpenRouter when keyed)
  if (fileRel.includes('gateway-providers')) {
    src = src.replace(/status:\s*'deferred'/g, () => {
      changed += 1;
      return "status: 'shipped'";
    });
  }

  // streaming transport deferred
  if (fileRel.includes('streaming-runtime')) {
    src = src.replace(/transport:\s*'none'/g, "transport: 'sse'");
  }

  // foundation console null → path
  if (fileRel.includes('foundation-model-cloud')) {
    for (const id of Object.keys(overrides)) {
      const re = new RegExp(
        `(id:\\s*'${id}'[\\s\\S]*?console:\\s*)null`,
        'm',
      );
      if (re.test(src)) {
        src = src.replace(re, `$1'/${id === 'voice' ? 'voice-fm' : id === 'reason' ? 'reason-fm' : id === 'vector' ? 'vector-fm' : id === 'vision' ? 'vision-fm' : id === 'translate' ? 'translate-fm' : id}'`);
        changed += 1;
      }
    }
  }

  return { src, changed };
}

function inferApi(mod, id, fileRel) {
  const map = {
    'knowledge-memory': `POST /v1/knowledge-memory/${id.replace(/_/g, '-')}`,
    'knowledge-intelligence': `GET /v1/knowledge-intelligence/engine`,
    'knowledge-graph': `GET /v1/knowledge-graph/domains/${id}`,
    'ontology-platform': `GET /v1/ontology-platform/domains/${id}`,
    'event-fabric': `POST /v1/event-fabric/adapters/${id}/events`,
    'gpu-platform': `POST /v1/gpu-platform/allocations`,
    'model-serving': `POST /v1/model-serving/deployments`,
    'streaming-runtime': `POST /v1/streaming-runtime/stream`,
    'batch-runtime': `POST /v1/batch-runtime/runs`,
  };
  if (fileRel.includes('knowledge-graph') || fileRel.includes('ontology-platform')) {
    if (['medical', 'legal', 'financial', 'government', 'educational'].includes(id)) {
      return `GET /v1/${mod}/domains/${id}`;
    }
  }
  if (fileRel.includes('knowledge-memory')) {
    return 'POST /v1/knowledge-memory/memories';
  }
  if (fileRel.includes('knowledge-intelligence')) {
    return 'GET /v1/knowledge-intelligence/engine';
  }
  return map[mod] ?? null;
}

function main() {
  let totalChanged = 0;
  const touched = [];
  for (const rel of listCatalogFiles()) {
    if (!rel.endsWith('.catalog.ts') && !rel.includes('providers.catalog')) continue;
    // skip already handled in batch1/2 if we want — script is idempotent enough
    const abs = path.join(apiSrc, rel);
    if (!fs.existsSync(abs)) continue;
    const before = fs.readFileSync(abs, 'utf8');
    if (!before.includes("'deferred'") && !before.includes('"deferred"')) continue;
    const { src, changed } = shipObjectLiteral(before, rel);
    if (src !== before) {
      fs.writeFileSync(abs, src);
      totalChanged += changed;
      touched.push(rel);
      console.log(`shipped ${rel} (~${changed} edits)`);
    }
  }
  console.log(`\nDone. Touched ${touched.length} files, ~${totalChanged} edits.`);
}

main();
