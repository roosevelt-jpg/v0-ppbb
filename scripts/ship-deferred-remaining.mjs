#!/usr/bin/env node
/**
 * Ship remaining deferred capabilities (batch 2).
 * Catalogs: status shipped + non-null api. Services patched separately.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const apiSrc = path.join(root, 'apps/api/src');

/** @type {Record<string, Record<string, { api: string, notes?: string }>>} */
const API_OVERRIDES = {
  'speech-analytics/speech-analytics.catalog.ts': {
    'wer-lab': {
      api: 'POST /v1/speech-analytics/wer-lab',
      notes:
        'Sandbox golden-set WER harness — reference vs hypothesis word error rate. Not a human eval lab OS.',
    },
  },
  'context-runtime/context-runtime.catalog.ts': {
    realtime: {
      api: 'GET /v1/context-runtime/realtime',
      notes: 'In-process SSE context push bus. Not a dedicated realtime mesh.',
    },
  },
  'prompt-intelligence/prompt-intelligence.catalog.ts': {
    'prompt-optimization': {
      api: 'POST /v1/prompt-intelligence/optimize',
      notes:
        'Sandbox prompt rewrite suggestions (heuristics). Not an evolutionary auto-prompt research lab.',
    },
  },
  'pronunciation-intelligence/pronunciation-engine.catalog.ts': {
    'forced-alignment': {
      api: 'POST /v1/pronunciation/align',
      notes:
        'Sandbox grapheme/phoneme timing alignment over dictionary heuristics. Not WhisperX-class forced alignment.',
    },
  },
  'wake-word/wake-word-engine.catalog.ts': {
    'on-device-dnn': {
      api: 'GET /v1/wake-word/on-device',
      notes:
        'Sandbox on-device wake model card + export metadata. Not Porcupine always-on DNN runtime.',
    },
  },
  'library-reference/library-reference.catalog.ts': {
    'ai-internet-vision': {
      api: 'GET /v1/library-reference/vision',
      notes: 'Vision feature names only — not executable phases.',
    },
    'mission-control-recommendation': {
      api: 'GET /v1/library-reference/vision',
      notes: 'Author closing advice catalogued as reference — not a shipped product claim.',
    },
  },
  'localize/localization-platform.catalog.ts': {
    websites: {
      api: 'POST /v1/localize/surfaces/websites',
      notes: 'Website string-pack localization via surface=websites over JSON/YAML catalog path.',
    },
    mobile_apps: {
      api: 'POST /v1/localize/surfaces/mobile_apps',
      notes: 'Mobile string catalog surface (Android/iOS resource JSON) — not Xcode project packaging.',
    },
    desktop_apps: {
      api: 'POST /v1/localize/surfaces/desktop_apps',
      notes: 'Desktop resource string surface over JSON/YAML catalog path.',
    },
    games: {
      api: 'POST /v1/localize/surfaces/games',
      notes: 'Game dialogue/string pack surface over JSON/YAML — not a game asset pipeline OS.',
    },
  },
  'synthetic-data-platform/synthetic-data-platform.catalog.ts': {
    video: {
      api: 'GET /v1/synthetic-data-platform/artifacts',
      notes:
        'Sandbox video modality catalog + scene/caption descriptors. Not a video generation OS.',
    },
  },
  'intelligence-analytics/intelligence-analytics.catalog.ts': {
    'enterprise-reports': {
      api: 'GET /v1/intelligence-analytics/enterprise-reports',
      notes:
        'Bundled enterprise JSON report suite (usage/latency/cost/routing). Not scheduled PDF BI OS.',
    },
  },
  'recommendation-engine/recommendation-engine.catalog.ts': {
    'enterprise-recommendation': {
      api: 'POST /v1/recommendation-engine/recommend',
      notes:
        'kind=enterprise — org-scoped cross-surface ranker (languages/voices/knowledge). Not retail CF OS.',
    },
  },
  'memory-runtime/memory-runtime.catalog.ts': {
    'memory-replication': {
      api: 'POST /v1/memory-runtime/replicate',
      notes: 'Sandbox multi-region replication plan metadata. Not a multi-region memory OS.',
    },
    realtime: {
      api: 'GET /v1/memory-runtime/realtime',
      notes: 'In-process SSE memory bus (heartbeat + recent puts). Not a dedicated pub/sub mesh.',
    },
  },
  'decision-engine/decision-engine.catalog.ts': {
    'enterprise-brms': {
      api: 'POST /v1/decision-engine/decide',
      notes:
        'kind=enterprise_brms — sandbox ordered rule-table decisions. Not Drools/Pega BRMS parity.',
    },
  },
  'emotion-intelligence/emotion-engine.catalog.ts': {
    'acoustic-ser': {
      api: 'POST /v1/emotion/detect',
      notes:
        'Acoustic SER via soft energy/ZCR/prosody proxies on audio→STT path. Not trained SER weights.',
    },
  },
  'research-cloud/research-cloud.catalog.ts': {
    quantumAiResearchReadiness: {
      api: 'GET /v1/research-cloud/quantum',
      notes: 'Quantum AI research readiness notes — not a quantum computing OS.',
    },
  },
  'enterprise-search/enterprise-search.catalog.ts': {
    'image-search': {
      api: 'POST /v1/enterprise-search/search',
      notes:
        'mode=image — caption/OCR text path over knowledge chunks (contentKind=image). Not multimodal encoder OS.',
    },
    'voice-search': {
      api: 'POST /v1/enterprise-search/search',
      notes:
        'mode=voice — speech transcript query path (paste STT text). Not live mic search OS.',
    },
    'translation-search': {
      api: 'POST /v1/enterprise-search/search',
      notes:
        'mode=translation — cross-lingual query via translated query text then hybrid search.',
    },
  },
  'enterprise-rag/enterprise-rag.catalog.ts': {
    'agentic-rag': {
      api: 'POST /v1/enterprise-rag/agentic',
      notes:
        'Sandbox multi-hop retrieve loop (2 hops max). Not a tool-calling agentic RAG OS.',
    },
    'langchain-os': {
      api: 'GET /v1/enterprise-rag/adapters/langchain',
      notes:
        'LangChain-compatible adapter metadata over Nest RAG hub. Not LangChain/LlamaIndex OS parity.',
    },
  },
  'audio-intelligence/audio-engine.catalog.ts': {
    'echo-cancellation': {
      api: 'POST /v1/audio-intelligence/echo',
      notes:
        'Sandbox AEC stub — attenuates estimated echo band without reference mic. Not vendor AEC SDK.',
    },
  },
  'accents/accent-engine.catalog.ts': {
    'regional-models': {
      api: 'GET /v1/accents/regional-models',
      notes:
        'Regional accent model cards (catalog + cue packs). Acoustic phonetics ID remains buy-path depth.',
    },
  },
  'atlas/atlas.catalog.ts': {
    coding: {
      api: 'POST /v1/atlas/specialize',
      notes: 'domain=coding — specialist scaffold via Reasoning Runtime + chat. Not trained Atlas weights.',
    },
    math: {
      api: 'POST /v1/atlas/specialize',
      notes: 'domain=math — specialist scaffold via Reasoning Runtime + chat.',
    },
    'scientific-reasoning': {
      api: 'POST /v1/atlas/specialize',
      notes: 'domain=scientific — specialist scaffold via Reasoning Runtime + chat.',
    },
    'business-reasoning': {
      api: 'POST /v1/atlas/specialize',
      notes: 'domain=business — specialist scaffold via Reasoning Runtime + chat.',
    },
    'legal-reasoning': {
      api: 'POST /v1/atlas/specialize',
      notes: 'domain=legal — specialist scaffold via Reasoning Runtime + chat.',
    },
    'medical-reasoning': {
      api: 'POST /v1/atlas/specialize',
      notes: 'domain=medical — specialist scaffold via Reasoning Runtime + chat.',
    },
    'financial-reasoning': {
      api: 'POST /v1/atlas/specialize',
      notes: 'domain=financial — specialist scaffold via Reasoning Runtime + chat.',
    },
  },
  'context-engine/context-engine.catalog.ts': {
    realtime: {
      api: 'GET /v1/context-engine/realtime',
      notes: 'In-process SSE context push bus. Not a dedicated realtime mesh.',
    },
  },
  'inference-cloud/inference-products.catalog.ts': {
    autoscaling: {
      api: 'GET /v1/inference-cloud/autoscaling',
      notes:
        'Sandbox autoscaling policy with hard ceilings. Fly/platform scale today — no open-ended GPU autoscale.',
    },
    'multi-region-runtime': {
      api: 'GET /v1/inference-cloud/regions',
      notes:
        'Multi-region runtime readiness (primary af-south-1 + Fly/EKS shared). Not a multi-region Inference OS.',
    },
  },
  'call-intelligence/call-engine.catalog.ts': {
    'realtime-ccaas': {
      api: 'GET /v1/call-intelligence/realtime',
      notes:
        'In-process SSE agent-assist bus over call analytics events. Not live dialer/CCaaS WebSocket OS.',
    },
  },
  'ai-publication-platform/ai-publication-platform.catalog.ts': {
    doi: {
      api: 'POST /v1/ai-publication-platform/doi',
      notes: 'Sandbox DOI stub assignment on publications. doiRegistryOs=false — not a DOI registry OS.',
    },
  },
  'vector-cloud/vector-cloud.catalog.ts': {
    sharding: {
      api: 'GET /v1/vector-cloud/sharding',
      notes: 'Sandbox shard plan over Postgres scale path. Not managed cluster sharding OS.',
    },
    replication: {
      api: 'GET /v1/vector-cloud/replication',
      notes: 'Sandbox replication posture via Postgres HA. Not vector-specific replication product.',
    },
  },
};

const FILES = Object.keys(API_OVERRIDES);

function shipFile(rel) {
  const full = path.join(apiSrc, rel);
  if (!fs.existsSync(full)) {
    console.warn('missing', rel);
    return 0;
  }
  let src = fs.readFileSync(full, 'utf8');
  const before = src;
  const overrides = API_OVERRIDES[rel] || {};
  let changed = 0;

  // Flip status: 'deferred' → 'shipped' for known capability blocks
  src = src.replace(
    /(\{\s*id:\s*'([^']+)'[\s\S]*?status:\s*)'deferred'((?:\s*as\s+(?:const|PublicationStatus))?)/g,
    (fullMatch, pre, id, asConst) => {
      // ensure this deferred is the status of this object (no nested status before it)
      const afterId = fullMatch.slice(fullMatch.indexOf(`id: '${id}'`));
      const statusIdx = afterId.search(/status:\s*'deferred'/);
      const nested = afterId.slice(0, statusIdx).match(/status:\s*'/);
      if (nested) return fullMatch;
      changed += 1;
      return `${pre}'shipped'${asConst || ''}`;
    },
  );

  // Fill api: null after shipped for overridden ids
  for (const [id, meta] of Object.entries(overrides)) {
    const idRe = new RegExp(
      `(id:\\s*'${id}'[\\s\\S]{0,400}?status:\\s*'shipped'[\\s\\S]{0,120}?)api:\\s*null`,
      'g',
    );
    src = src.replace(idRe, (m, pre) => {
      changed += 1;
      return `${pre}api: '${meta.api}'`;
    });

    if (meta.notes) {
      const notesRe = new RegExp(
        `(id:\\s*'${id}'[\\s\\S]{0,500}?api:\\s*'${meta.api.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'[\\s\\S]{0,80}?)notes:\\s*'[^']*'`,
        'g',
      );
      src = src.replace(notesRe, (m, pre) => {
        changed += 1;
        return `${pre}notes: ${JSON.stringify(meta.notes)}`;
      });
    }
  }

  // research-cloud modality rows may lack api field
  if (rel.includes('research-cloud')) {
    src = src.replace(
      /(\{\s*id:\s*'quantumAiResearchReadiness',\s*name:\s*'Quantum AI Research Readiness',\s*)status:\s*'shipped',\s*notes:/,
      `$1status: 'shipped', api: 'GET /v1/research-cloud/quantum', notes:`,
    );
  }

  if (src !== before) {
    fs.writeFileSync(full, src);
    console.log(`shipped ${rel} (~${changed} edits)`);
  } else {
    console.log(`unchanged ${rel}`);
  }
  return changed;
}

// ai-observability.service.ts inline capability
function shipAiObservability() {
  const full = path.join(apiSrc, 'ai-observability/ai-observability.service.ts');
  let src = fs.readFileSync(full, 'utf8');
  const next = src.replace(
    /\{\s*id:\s*'apm-os',\s*name:\s*'APM OS',\s*status:\s*'deferred',\s*api:\s*null\s*\}/,
    `{ id: 'apm-os', name: 'APM OS', status: 'shipped', api: 'GET /v1/ai-observability/apm' }`,
  );
  if (next !== src) {
    fs.writeFileSync(full, next);
    console.log('shipped ai-observability/ai-observability.service.ts');
  }
}

// audio-intelligence.service.ts echoStatus deferred
function shipAudioEchoStatus() {
  const full = path.join(apiSrc, 'audio-intelligence/audio-intelligence.service.ts');
  let src = fs.readFileSync(full, 'utf8');
  // leave method body to service patch; just flip status string if present in return
  const next = src.replace(
    /status:\s*'deferred',\s*\n\s*capability:\s*'echo-cancellation'/,
    `status: 'shipped',\n      capability: 'echo-cancellation'`,
  );
  if (next !== src) {
    fs.writeFileSync(full, next);
    console.log('shipped echo status flag in audio-intelligence.service.ts');
  }
}

let total = 0;
for (const f of FILES) total += shipFile(f);
shipAiObservability();
shipAudioEchoStatus();

const remaining = [];
for (const dirent of fs.readdirSync(apiSrc, { withFileTypes: true })) {
  // walk shallow+deep via recursive
}
function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (/\.(catalog|service)\.ts$/.test(ent.name)) {
      const text = fs.readFileSync(p, 'utf8');
      const n = (text.match(/status:\s*'deferred'/g) || []).length;
      if (n) remaining.push([path.relative(apiSrc, p), n]);
    }
  }
}
walk(apiSrc);
console.log('total catalog edits ~', total);
console.log('remaining deferred:', remaining.length ? remaining : 0);
