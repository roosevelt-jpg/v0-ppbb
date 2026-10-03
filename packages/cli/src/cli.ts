#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { VerbaLab } from '@verbalab/sdk';

function usage(): never {
  console.error(`Usage:
  verbalab translate --text <text> --target <lang> [--source <lang>]
  verbalab translate-format --format <html|markdown|xml|csv|srt> --file <path> --target <lang> [--source <lang>]
  verbalab translate-engine
  verbalab localize --format <json|yaml> --file <path> --target <lang> [--source <lang>]
  verbalab localize-qa --source-file <path> --target-file <path> [--format json|yaml]
  verbalab locales
  verbalab localization
  verbalab icu-validate --message <icu>
  verbalab languages
  verbalab speech-products
  verbalab voice-products
  verbalab intelligence-products
  verbalab knowledge-products
  verbalab inference-products
  verbalab knowledge-base-engine
  verbalab enterprise-search-engine
  verbalab enterprise-search --query <text> [--mode keyword|semantic|hybrid]
  verbalab ontology-engine
  verbalab taxonomy-engine
  verbalab enterprise-rag-engine
  verbalab enterprise-rag-retrieve --query <text> [--mode keyword|semantic|hybrid]
  verbalab enterprise-rag-query --question <text> [--mode keyword|semantic|hybrid]
  verbalab knowledge-memory-engine
  verbalab knowledge-intelligence-engine
  verbalab knowledge-intelligence-discover --query <text>
  verbalab knowledge-apis-engine
  verbalab knowledge-apis-surfaces
  verbalab embedding-cloud-engine
  verbalab embedding-cloud-models
  verbalab vector-cloud-engine
  verbalab vector-cloud-search --query <text> [--k <n>]
  verbalab memory-cloud-engine
  verbalab memory-cloud-export [--subject <userId>]
  verbalab knowledge-graph-engine
  verbalab context-engine
  verbalab context-assemble [--query <text>] [--max-chars <n>]
  verbalab reasoning-cloud-engine
  verbalab reasoning-cloud-reason --problem <text> [--strategy <id>]
  verbalab recommendation-engine
  verbalab recommend --kind <language|voice|content|...> [--query <text>]
  verbalab prompt-intelligence
  verbalab prompt-intelligence-preview --key <chat|rag|voice_faq> [--body <text>]
  verbalab prompt-intelligence-evaluate --key <chat|rag|voice_faq> [--body <text>]
  verbalab decision-engine
  verbalab decide --kind <routing|policy|model_selection|...> [--query <text>]
  verbalab ai-orchestration
  verbalab ai-orchestration-run --pipeline <detect_translate|...> --text <text> [--target <lang>]
  verbalab intelligence-analytics
  verbalab intelligence-analytics-overview
  verbalab intelligence-analytics-report
  verbalab knowledge-analytics
  verbalab knowledge-analytics-overview
  verbalab knowledge-analytics-report
  verbalab neural-tts-engine
  verbalab neural-tts-voices
  verbalab voice-cloning-engine
  verbalab voice-cloning-consent
  verbalab emotion-voice-engine
  verbalab emotion-voice-profiles
  verbalab voice-studio-engine
  verbalab voice-studio-library
  verbalab voice-enhancement-engine
  verbalab voice-enhancement-profiles
  verbalab voice-biometrics-engine
  verbalab voice-biometrics-encryption
  verbalab voice-marketplace-engine
  verbalab voice-marketplace-language-packs
  verbalab voice-analytics
  verbalab speech-engine
  verbalab speaker-engine
  verbalab accent-engine
  verbalab emotion-engine
  verbalab audio-engine
  verbalab pronunciation-engine
  verbalab wake-word-engine
  verbalab call-engine
  verbalab speech-analytics
  verbalab whoami

Env:
  VERBALAB_API_KEY   vl_live_… or vl_test_… (required)
  VERBALAB_API_URL   API base (default https://api.verbalab.ai)
`);
  process.exit(1);
}

function argValue(argv: string[], name: string): string | undefined {
  const idx = argv.indexOf(name);
  if (idx === -1) return undefined;
  return argv[idx + 1];
}

function client() {
  const apiKey = process.env.VERBALAB_API_KEY?.trim();
  if (!apiKey) {
    console.error('Set VERBALAB_API_KEY to a vl_live_ or vl_test_ key');
    process.exit(1);
  }
  return new VerbaLab({
    apiKey,
    baseUrl: process.env.VERBALAB_API_URL?.trim() || undefined,
  });
}

async function main() {
  const [, , command, ...rest] = process.argv;
  if (!command || command === '-h' || command === '--help') usage();

  const vl = client();

  if (command === 'languages') {
    console.log(JSON.stringify(await vl.languages(), null, 2));
    return;
  }

  if (command === 'speech-products') {
    console.log(JSON.stringify(await vl.speechProducts(), null, 2));
    return;
  }

  if (command === 'voice-products') {
    console.log(JSON.stringify(await vl.voiceProducts(), null, 2));
    return;
  }

  if (command === 'intelligence-products') {
    console.log(JSON.stringify(await vl.intelligenceProducts(), null, 2));
    return;
  }

  if (command === 'knowledge-products') {
    console.log(JSON.stringify(await vl.knowledgeProducts(), null, 2));
    return;
  }

  if (command === 'inference-products') {
    console.log(JSON.stringify(await vl.inferenceProducts(), null, 2));
    return;
  }

  if (command === 'knowledge-base-engine') {
    console.log(JSON.stringify(await vl.knowledgeBaseEngine(), null, 2));
    return;
  }

  if (command === 'enterprise-search-engine') {
    console.log(JSON.stringify(await vl.enterpriseSearchEngine(), null, 2));
    return;
  }

  if (command === 'enterprise-search') {
    const query = argValue(rest, '--query');
    if (!query) usage();
    const mode = argValue(rest, '--mode') as 'keyword' | 'semantic' | 'hybrid' | undefined;
    console.log(
      JSON.stringify(await vl.enterpriseSearch({ query, mode }), null, 2),
    );
    return;
  }

  if (command === 'ontology-engine') {
    console.log(JSON.stringify(await vl.ontologyEngine(), null, 2));
    return;
  }

  if (command === 'taxonomy-engine') {
    console.log(JSON.stringify(await vl.taxonomyEngine(), null, 2));
    return;
  }

  if (command === 'enterprise-rag-engine') {
    console.log(JSON.stringify(await vl.enterpriseRagEngine(), null, 2));
    return;
  }

  if (command === 'enterprise-rag-retrieve') {
    const query = argValue(rest, '--query');
    if (!query) usage();
    const mode = argValue(rest, '--mode') as 'keyword' | 'semantic' | 'hybrid' | undefined;
    console.log(
      JSON.stringify(await vl.enterpriseRagRetrieve({ query, mode }), null, 2),
    );
    return;
  }

  if (command === 'enterprise-rag-query') {
    const question = argValue(rest, '--question');
    if (!question) usage();
    const mode = argValue(rest, '--mode') as 'keyword' | 'semantic' | 'hybrid' | undefined;
    console.log(
      JSON.stringify(await vl.enterpriseRagQuery({ question, mode }), null, 2),
    );
    return;
  }

  if (command === 'knowledge-memory-engine') {
    console.log(JSON.stringify(await vl.knowledgeMemoryEngine(), null, 2));
    return;
  }

  if (command === 'knowledge-intelligence-engine') {
    console.log(JSON.stringify(await vl.knowledgeIntelligenceEngine(), null, 2));
    return;
  }

  if (command === 'knowledge-intelligence-discover') {
    const query = argValue(rest, '--query');
    if (!query) usage();
    console.log(
      JSON.stringify(await vl.knowledgeIntelligenceDiscover({ query }), null, 2),
    );
    return;
  }

  if (command === 'knowledge-apis-engine') {
    console.log(JSON.stringify(await vl.knowledgeApisEngine(), null, 2));
    return;
  }

  if (command === 'knowledge-apis-surfaces') {
    console.log(JSON.stringify(await vl.knowledgeApisSurfaces(), null, 2));
    return;
  }

  if (command === 'knowledge-analytics') {
    console.log(JSON.stringify(await vl.knowledgeAnalyticsEngine(), null, 2));
    return;
  }

  if (command === 'knowledge-analytics-overview') {
    console.log(
      JSON.stringify(
        await vl.knowledgeAnalyticsOverview({
          from: argValue(rest, '--from') ?? undefined,
          to: argValue(rest, '--to') ?? undefined,
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'knowledge-analytics-report') {
    console.log(
      JSON.stringify(
        await vl.knowledgeAnalyticsReport({
          from: argValue(rest, '--from') ?? undefined,
          to: argValue(rest, '--to') ?? undefined,
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'embedding-cloud-engine') {
    console.log(JSON.stringify(await vl.embeddingCloudEngine(), null, 2));
    return;
  }

  if (command === 'embedding-cloud-models') {
    console.log(JSON.stringify(await vl.embeddingCloudModels(), null, 2));
    return;
  }

  if (command === 'vector-cloud-engine') {
    console.log(JSON.stringify(await vl.vectorCloudEngine(), null, 2));
    return;
  }

  if (command === 'vector-cloud-search') {
    const query = argValue(rest, '--query');
    if (!query) usage();
    const kRaw = argValue(rest, '--k');
    console.log(
      JSON.stringify(
        await vl.vectorCloudSearch({
          query,
          k: kRaw ? Number(kRaw) : undefined,
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'memory-cloud-engine') {
    console.log(JSON.stringify(await vl.memoryCloudEngine(), null, 2));
    return;
  }

  if (command === 'memory-cloud-export') {
    console.log(
      JSON.stringify(
        await vl.memoryCloudExport({
          subjectUserId: argValue(rest, '--subject'),
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'knowledge-graph-engine') {
    console.log(JSON.stringify(await vl.knowledgeGraphEngine(), null, 2));
    return;
  }

  if (command === 'context-engine') {
    console.log(JSON.stringify(await vl.contextEngine(), null, 2));
    return;
  }

  if (command === 'context-assemble') {
    const maxRaw = argValue(rest, '--max-chars');
    console.log(
      JSON.stringify(
        await vl.contextAssemble({
          query: argValue(rest, '--query'),
          maxChars: maxRaw ? Number(maxRaw) : undefined,
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'reasoning-cloud-engine') {
    console.log(JSON.stringify(await vl.reasoningCloudEngine(), null, 2));
    return;
  }

  if (command === 'reasoning-cloud-reason') {
    const problem = argValue(rest, '--problem');
    if (!problem) usage();
    console.log(
      JSON.stringify(
        await vl.reasoningCloudReason({
          problem,
          strategy: argValue(rest, '--strategy'),
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'recommendation-engine') {
    console.log(JSON.stringify(await vl.recommendationEngine(), null, 2));
    return;
  }

  if (command === 'recommend') {
    const kind = argValue(rest, '--kind');
    if (!kind) usage();
    console.log(
      JSON.stringify(
        await vl.recommend({
          kind,
          query: argValue(rest, '--query'),
          language: argValue(rest, '--language'),
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'prompt-intelligence') {
    console.log(JSON.stringify(await vl.promptIntelligenceEngine(), null, 2));
    return;
  }

  if (command === 'prompt-intelligence-preview') {
    const key = argValue(rest, '--key');
    if (!key) usage();
    console.log(
      JSON.stringify(
        await vl.promptIntelligencePreview({
          key,
          body: argValue(rest, '--body'),
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'prompt-intelligence-evaluate') {
    const key = argValue(rest, '--key');
    if (!key) usage();
    console.log(
      JSON.stringify(
        await vl.promptIntelligenceEvaluate({
          key,
          body: argValue(rest, '--body'),
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'decision-engine') {
    console.log(JSON.stringify(await vl.decisionEngine(), null, 2));
    return;
  }

  if (command === 'decide') {
    const kind = argValue(rest, '--kind');
    if (!kind) usage();
    console.log(
      JSON.stringify(
        await vl.decide({
          kind,
          query: argValue(rest, '--query'),
          family: argValue(rest, '--family'),
          quality: argValue(rest, '--quality'),
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'ai-orchestration') {
    console.log(JSON.stringify(await vl.aiOrchestrationEngine(), null, 2));
    return;
  }

  if (command === 'ai-orchestration-run') {
    const pipeline = argValue(rest, '--pipeline');
    const text = argValue(rest, '--text');
    if (!pipeline || !text) usage();
    console.log(
      JSON.stringify(
        await vl.aiOrchestrationRun({
          pipeline,
          text,
          target: argValue(rest, '--target'),
          source: argValue(rest, '--source'),
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'intelligence-analytics') {
    console.log(JSON.stringify(await vl.intelligenceAnalyticsEngine(), null, 2));
    return;
  }

  if (command === 'intelligence-analytics-overview') {
    console.log(
      JSON.stringify(
        await vl.intelligenceAnalyticsOverview({
          from: argValue(rest, '--from'),
          to: argValue(rest, '--to'),
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'intelligence-analytics-report') {
    console.log(
      JSON.stringify(
        await vl.intelligenceAnalyticsReport({
          from: argValue(rest, '--from'),
          to: argValue(rest, '--to'),
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'neural-tts-engine') {
    console.log(JSON.stringify(await vl.neuralTtsEngine(), null, 2));
    return;
  }

  if (command === 'neural-tts-voices') {
    console.log(
      JSON.stringify(
        await vl.neuralTtsVoices({
          gender: argValue(argv, '--gender'),
          language: argValue(argv, '--language'),
          category: argValue(argv, '--category'),
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'voice-cloning-engine') {
    console.log(JSON.stringify(await vl.voiceCloningEngine(), null, 2));
    return;
  }

  if (command === 'voice-cloning-consent') {
    console.log(JSON.stringify(await vl.voiceCloningConsentPolicy(), null, 2));
    return;
  }

  if (command === 'emotion-voice-engine') {
    console.log(JSON.stringify(await vl.emotionVoiceEngine(), null, 2));
    return;
  }

  if (command === 'emotion-voice-profiles') {
    console.log(JSON.stringify(await vl.emotionVoiceProfiles(), null, 2));
    return;
  }

  if (command === 'voice-studio-engine') {
    console.log(JSON.stringify(await vl.voiceStudioEngine(), null, 2));
    return;
  }

  if (command === 'voice-studio-library') {
    console.log(JSON.stringify(await vl.voiceStudioLibrary(), null, 2));
    return;
  }

  if (command === 'voice-enhancement-engine') {
    console.log(JSON.stringify(await vl.voiceEnhancementEngine(), null, 2));
    return;
  }

  if (command === 'voice-enhancement-profiles') {
    console.log(JSON.stringify(await vl.voiceEnhancementProfiles(), null, 2));
    return;
  }

  if (command === 'voice-biometrics-engine') {
    console.log(JSON.stringify(await vl.voiceBiometricsEngine(), null, 2));
    return;
  }

  if (command === 'voice-biometrics-encryption') {
    console.log(JSON.stringify(await vl.voiceBiometricsEncryption(), null, 2));
    return;
  }

  if (command === 'voice-marketplace-engine') {
    console.log(JSON.stringify(await vl.voiceMarketplaceEngine(), null, 2));
    return;
  }

  if (command === 'voice-marketplace-language-packs') {
    console.log(JSON.stringify(await vl.voiceMarketplaceLanguagePacks(), null, 2));
    return;
  }

  if (command === 'voice-analytics') {
    console.log(JSON.stringify(await vl.voiceAnalyticsEngine(), null, 2));
    return;
  }

  if (command === 'speech-engine') {
    console.log(JSON.stringify(await vl.speechEngine(), null, 2));
    return;
  }

  if (command === 'speaker-engine') {
    console.log(JSON.stringify(await vl.speakerEngine(), null, 2));
    return;
  }

  if (command === 'accent-engine') {
    console.log(JSON.stringify(await vl.accentEngine(), null, 2));
    return;
  }

  if (command === 'emotion-engine') {
    console.log(JSON.stringify(await vl.emotionEngine(), null, 2));
    return;
  }

  if (command === 'audio-engine') {
    console.log(JSON.stringify(await vl.audioEngine(), null, 2));
    return;
  }

  if (command === 'pronunciation-engine') {
    console.log(JSON.stringify(await vl.pronunciationEngine(), null, 2));
    return;
  }

  if (command === 'wake-word-engine') {
    console.log(JSON.stringify(await vl.wakeWordEngine(), null, 2));
    return;
  }

  if (command === 'call-engine') {
    console.log(JSON.stringify(await vl.callIntelligenceEngine(), null, 2));
    return;
  }

  if (command === 'speech-analytics') {
    console.log(JSON.stringify(await vl.speechAnalyticsEngine(), null, 2));
    return;
  }

  if (command === 'whoami') {
    const key = process.env.VERBALAB_API_KEY!;
    console.log(
      JSON.stringify(
        {
          environment: key.startsWith('vl_test_') ? 'test' : 'live',
          baseUrl: process.env.VERBALAB_API_URL ?? 'https://api.verbalab.ai',
          keyPrefix: key.slice(0, 12) + '…',
        },
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'translate-engine') {
    console.log(JSON.stringify(await vl.translateEngine(), null, 2));
    return;
  }

  if (command === 'translate') {
    const text = argValue(rest, '--text');
    const target = argValue(rest, '--target');
    const source = argValue(rest, '--source') ?? 'auto';
    if (!text || !target) usage();
    console.log(JSON.stringify(await vl.translate({ text, source, target }), null, 2));
    return;
  }

  if (command === 'translate-format') {
    const format = argValue(rest, '--format');
    const file = argValue(rest, '--file');
    const target = argValue(rest, '--target');
    const source = argValue(rest, '--source') ?? 'en';
    if (!format || !file || !target) usage();
    const content = readFileSync(file, 'utf8');
    console.log(
      JSON.stringify(await vl.translateFormat({ format, content, source, target }), null, 2),
    );
    return;
  }

  if (command === 'localize') {
    const format = (argValue(rest, '--format') ?? 'json') as 'json' | 'yaml';
    const file = argValue(rest, '--file');
    const target = argValue(rest, '--target');
    const source = argValue(rest, '--source') ?? 'en';
    if (!file || !target) usage();
    const raw = readFileSync(file, 'utf8');
    const content = format === 'yaml' ? raw : JSON.parse(raw);
    console.log(JSON.stringify(await vl.localize({ format, content, source, target }), null, 2));
    return;
  }

  if (command === 'locales') {
    console.log(JSON.stringify(await vl.locales(), null, 2));
    return;
  }

  if (command === 'localization') {
    console.log(JSON.stringify(await vl.localizationPlatform(), null, 2));
    return;
  }

  if (command === 'icu-validate') {
    const message = argValue(rest, '--message');
    if (!message) usage();
    console.log(JSON.stringify(await vl.validateIcu(message), null, 2));
    return;
  }

  if (command === 'localize-qa') {
    const format = (argValue(rest, '--format') ?? 'json') as 'json' | 'yaml';
    const sourceFile = argValue(rest, '--source-file');
    const targetFile = argValue(rest, '--target-file');
    if (!sourceFile || !targetFile) usage();
    const sourceRaw = readFileSync(sourceFile, 'utf8');
    const targetRaw = readFileSync(targetFile, 'utf8');
    const sourceContent = format === 'yaml' ? sourceRaw : JSON.parse(sourceRaw);
    const targetContent = format === 'yaml' ? targetRaw : JSON.parse(targetRaw);
    console.log(
      JSON.stringify(
        await vl.localizeQa({ format, sourceContent, targetContent }),
        null,
        2,
      ),
    );
    return;
  }

  usage();
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
