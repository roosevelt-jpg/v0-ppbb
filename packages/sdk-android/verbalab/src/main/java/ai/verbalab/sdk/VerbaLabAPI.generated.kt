package ai.verbalab.sdk

/** Auto-generated from @verbalab/sdk — full product API surface for Android. */
suspend fun VerbaLabClient.translateMap(body: Map<String, Any?>): Map<String, Any?> =
    requestMap("/v1/translate", "POST", jsonBody = body)

suspend fun VerbaLabClient.translateEngine(): Map<String, Any?> =
    requestMap("/v1/translate/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.translateFormat(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/translate/formats", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.translateChat(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/translate/chat", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.translateStream(body: Map<String, Any?>? = null): ByteArray =
    requestBytes("/v1/translate/stream", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.dialects(query: Map<String, String>? = null): Map<String, Any?> =
    requestMap("/v1/dialects", "GET", query = query, jsonBody = null)

suspend fun VerbaLabClient.dialect(code: String): Map<String, Any?> =
    requestMap(("/v1/dialects/{code}").replace("{code}", encodePath(code)), "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.detectDialect(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/dialects/detect", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.accents(query: Map<String, String>? = null): Map<String, Any?> =
    requestMap("/v1/accents", "GET", query = query, jsonBody = null)

suspend fun VerbaLabClient.accent(code: String): Map<String, Any?> =
    requestMap(("/v1/accents/{code}").replace("{code}", encodePath(code)), "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.detectAccent(file: ByteArray, fileName: String, mimeType: String = "application/octet-stream", fields: Map<String, String> = emptyMap()): Map<String, Any?> =
    requestMultipart("/v1/accents/detect", "file", fileName, file, mimeType, fields)

suspend fun VerbaLabClient.accentEngine(): Map<String, Any?> =
    requestMap("/v1/accents/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.accentAnalytics(): Map<String, Any?> =
    requestMap("/v1/accents/analytics", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.classifyAccent(file: ByteArray, fileName: String, mimeType: String = "application/octet-stream", fields: Map<String, String> = emptyMap()): Map<String, Any?> =
    requestMultipart("/v1/accents/classify", "file", fileName, file, mimeType, fields)

suspend fun VerbaLabClient.emotionEngine(): Map<String, Any?> =
    requestMap("/v1/emotion/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.detectEmotion(file: ByteArray, fileName: String, mimeType: String = "application/octet-stream", fields: Map<String, String> = emptyMap()): Map<String, Any?> =
    requestMultipart("/v1/emotion/detect", "file", fileName, file, mimeType, fields)

suspend fun VerbaLabClient.audioEngine(): Map<String, Any?> =
    requestMap("/v1/audio-intelligence/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.analyzeAudio(file: ByteArray, fileName: String, mimeType: String = "application/octet-stream", fields: Map<String, String> = emptyMap()): Map<String, Any?> =
    requestMultipart("/v1/audio-intelligence/analyze", "file", fileName, file, mimeType, fields)

suspend fun VerbaLabClient.enhanceAudio(file: ByteArray, fileName: String, mimeType: String = "application/octet-stream", fields: Map<String, String> = emptyMap()): Map<String, Any?> =
    requestMultipart("/v1/audio-intelligence/enhance", "file", fileName, file, mimeType, fields)

suspend fun VerbaLabClient.isolateAudio(file: ByteArray, fileName: String, mimeType: String = "application/octet-stream", fields: Map<String, String> = emptyMap()): Map<String, Any?> =
    requestMultipart("/v1/audio-intelligence/isolate", "file", fileName, file, mimeType, fields)

suspend fun VerbaLabClient.pronunciationEngine(): Map<String, Any?> =
    requestMap("/v1/pronunciation/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.assessPronunciation(file: ByteArray, fileName: String, mimeType: String = "application/octet-stream", fields: Map<String, String> = emptyMap()): Map<String, Any?> =
    requestMultipart("/v1/pronunciation/assess", "file", fileName, file, mimeType, fields)

suspend fun VerbaLabClient.wakeWordEngine(): Map<String, Any?> =
    requestMap("/v1/wake-word/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.detectWakeWord(file: ByteArray, fileName: String, mimeType: String = "application/octet-stream", fields: Map<String, String> = emptyMap()): Map<String, Any?> =
    requestMultipart("/v1/wake-word/detect", "file", fileName, file, mimeType, fields)

suspend fun VerbaLabClient.spotKeywords(file: ByteArray, fileName: String, mimeType: String = "application/octet-stream", fields: Map<String, String> = emptyMap()): Map<String, Any?> =
    requestMultipart("/v1/wake-word/spot", "file", fileName, file, mimeType, fields)

suspend fun VerbaLabClient.callIntelligenceEngine(): Map<String, Any?> =
    requestMap("/v1/call-intelligence/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.ingestCall(file: ByteArray, fileName: String, mimeType: String = "application/octet-stream", fields: Map<String, String> = emptyMap()): Map<String, Any?> =
    requestMultipart("/v1/call-intelligence/calls", "file", fileName, file, mimeType, fields)

suspend fun VerbaLabClient.callIntelligenceReport(): Map<String, Any?> =
    requestMap("/v1/call-intelligence/report", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.speechAnalyticsEngine(): Map<String, Any?> =
    requestMap("/v1/speech-analytics/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.speechAnalyticsOverview(query: Map<String, String>? = null): Map<String, Any?> =
    requestMap("/v1/speech-analytics/overview", "GET", query = query, jsonBody = null)

suspend fun VerbaLabClient.speechAnalyticsReport(query: Map<String, String>? = null): Map<String, Any?> =
    requestMap("/v1/speech-analytics/report", "GET", query = query, jsonBody = null)

suspend fun VerbaLabClient.checkGrammar(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/grammar/check", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.grammarIntelligence(): Map<String, Any?> =
    requestMap("/v1/grammar/intelligence", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.spellCheck(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/grammar/spell", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.correctGrammar(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/grammar/correct", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.suggestWriting(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/grammar/suggest", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.grammarAnalytics(): Map<String, Any?> =
    requestMap("/v1/grammar/analytics", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.styleProfiles(): Map<String, Any?> =
    requestMap("/v1/style/profiles", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.rewriteStyle(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/style/rewrite", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.styleIntelligence(): Map<String, Any?> =
    requestMap("/v1/style/intelligence", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.detectTone(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/style/detect", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.transformTone(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/style/transform", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.transferStyle(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/style/transfer", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.styleAnalytics(): Map<String, Any?> =
    requestMap("/v1/style/analytics", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.languageIntelligence(): Map<String, Any?> =
    requestMap("/v1/language-intelligence", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.analyzeLanguage(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/language-intelligence/analyze", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.languageSentiment(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/language-intelligence/sentiment", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.languageIntent(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/language-intelligence/intent", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.translationConfidence(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/language-intelligence/translation-confidence", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.speechConfidence(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/language-intelligence/speech-confidence", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.languageIntelligenceAnalytics(): Map<String, Any?> =
    requestMap("/v1/language-intelligence/analytics", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.tmIntelligence(): Map<String, Any?> =
    requestMap("/v1/tm", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.searchTm(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/tm/search", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.tmAnalytics(): Map<String, Any?> =
    requestMap("/v1/tm/analytics", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.languageAnalyticsCatalog(): Map<String, Any?> =
    requestMap("/v1/analytics", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.analyticsOverview(query: Map<String, String>? = null): Map<String, Any?> =
    requestMap("/v1/analytics/overview", "GET", query = query, jsonBody = null)

suspend fun VerbaLabClient.analyticsTranslation(query: Map<String, String>? = null): Map<String, Any?> =
    requestMap("/v1/analytics/translation", "GET", query = query, jsonBody = null)

suspend fun VerbaLabClient.analyticsQuality(query: Map<String, String>? = null): Map<String, Any?> =
    requestMap("/v1/analytics/quality", "GET", query = query, jsonBody = null)

suspend fun VerbaLabClient.analyticsLatency(query: Map<String, String>? = null): Map<String, Any?> =
    requestMap("/v1/analytics/latency", "GET", query = query, jsonBody = null)

suspend fun VerbaLabClient.enterpriseAnalyticsReport(query: Map<String, String>? = null): Map<String, Any?> =
    requestMap("/v1/analytics/reports/enterprise", "GET", query = query, jsonBody = null)

suspend fun VerbaLabClient.countryPacks(query: Map<String, String>? = null): Map<String, Any?> =
    requestMap("/v1/country-packs", "GET", query = query, jsonBody = null)

suspend fun VerbaLabClient.countryPack(code: String, query: Map<String, String>? = null): Map<String, Any?> =
    requestMap(("/v1/country-packs/{code}").replace("{code}", encodePath(code)), "GET", query = query, jsonBody = null)

suspend fun VerbaLabClient.language(code: String): Map<String, Any?> =
    requestMap(("/v1/languages/{code}").replace("{code}", encodePath(code)), "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.registry(): Map<String, Any?> =
    requestMap("/v1/registry", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.languageFamilies(): Map<String, Any?> =
    requestMap("/v1/registry/families", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.languageFamily(code: String): Map<String, Any?> =
    requestMap(("/v1/registry/families/{code}").replace("{code}", encodePath(code)), "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.writingSystems(query: Map<String, String>? = null): Map<String, Any?> =
    requestMap("/v1/registry/scripts", "GET", query = query, jsonBody = null)

suspend fun VerbaLabClient.writingSystem(code: String): Map<String, Any?> =
    requestMap(("/v1/registry/scripts/{code}").replace("{code}", encodePath(code)), "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.alphabets(): Map<String, Any?> =
    requestMap("/v1/registry/alphabets", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.linguisticRules(query: Map<String, String>? = null): Map<String, Any?> =
    requestMap("/v1/registry/rules", "GET", query = query, jsonBody = null)

suspend fun VerbaLabClient.linguisticRule(code: String): Map<String, Any?> =
    requestMap(("/v1/registry/rules/{code}").replace("{code}", encodePath(code)), "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.validateRegistry(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/registry/validate", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.registryAnalytics(): Map<String, Any?> =
    requestMap("/v1/registry/analytics", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.registryHealth(): Map<String, Any?> =
    requestMap("/v1/registry/health", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.regions(): Map<String, Any?> =
    requestMap("/v1/regions", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.locales(): Map<String, Any?> =
    requestMap("/v1/locales", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.locale(code: String): Map<String, Any?> =
    requestMap(("/v1/locales/{code}").replace("{code}", encodePath(code)), "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.localeLayout(code: String): Map<String, Any?> =
    requestMap(("/v1/locales/{code}/layout").replace("{code}", encodePath(code)), "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.localeFormat(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/locales/format", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.localizationPlatform(): Map<String, Any?> =
    requestMap("/v1/localization", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.validateIcu(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/icu/validate", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.formatIcu(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/icu/format", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.localizeCatalog(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/localize/catalog", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.localizeQa(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/localize/qa", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.localize(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/localize", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.createJob(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/jobs", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.listJobs(): Map<String, Any?> =
    requestMap("/v1/jobs?limit=", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.getJob(id: String): Map<String, Any?> =
    requestMap(("/v1/jobs/{id}").replace("{id}", encodePath(id)), "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.ocr(file: ByteArray, fileName: String, mimeType: String = "application/octet-stream", fields: Map<String, String> = emptyMap()): Map<String, Any?> =
    requestMultipart("/v1/ocr", "file", fileName, file, mimeType, fields)

suspend fun VerbaLabClient.voices(): Map<String, Any?> =
    requestMap("/v1/audio/voices", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.speechProducts(): Map<String, Any?> =
    requestMap("/v1/speech/products", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.voiceProducts(): Map<String, Any?> =
    requestMap("/v1/voice-cloud/products", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.intelligenceProducts(): Map<String, Any?> =
    requestMap("/v1/intelligence-cloud/products", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.knowledgeProducts(): Map<String, Any?> =
    requestMap("/v1/knowledge-cloud/products", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.inferenceProducts(): Map<String, Any?> =
    requestMap("/v1/inference-cloud/products", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.aiKernelProducts(): Map<String, Any?> =
    requestMap("/v1/ai-kernel/products", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.foundationModelCloudProducts(): Map<String, Any?> =
    requestMap("/v1/foundation-model-cloud/products", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.modelTrainingPlatformEngine(): Map<String, Any?> =
    requestMap("/v1/model-training-platform/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.modelEvaluationPlatformEngine(): Map<String, Any?> =
    requestMap("/v1/model-evaluation-platform/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.modelRegistryEngine(): Map<String, Any?> =
    requestMap("/v1/model-registry/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.atlasEngine(): Map<String, Any?> =
    requestMap("/v1/atlas/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.aiFabricProducts(): Map<String, Any?> =
    requestMap("/v1/ai-fabric/products", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.eventFabricProducts(): Map<String, Any?> =
    requestMap("/v1/event-fabric/products", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.eventFabricPublish(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/event-fabric/events", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.eventFabricPoll(query: Map<String, String>? = null): Map<String, Any?> =
    requestMap("/v1/event-fabric/events", "GET", query = query, jsonBody = null)

suspend fun VerbaLabClient.eventFabricAnalytics(): Map<String, Any?> =
    requestMap("/v1/event-fabric/analytics", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.contextFabricProducts(): Map<String, Any?> =
    requestMap("/v1/context-fabric/products", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.contextFabricRoute(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/context-fabric/route", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.contextFabricPropagate(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/context-fabric/propagate", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.knowledgeFabricProducts(): Map<String, Any?> =
    requestMap("/v1/knowledge-fabric/products", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.knowledgeFabricRoute(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/knowledge-fabric/route", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.knowledgeFabricFederate(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/knowledge-fabric/federate", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.knowledgeFabricDistribute(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/knowledge-fabric/distribute", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.knowledgeFabricSync(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/knowledge-fabric/sync", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.promptFabricProducts(): Map<String, Any?> =
    requestMap("/v1/prompt-fabric/products", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.promptFabricRoute(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/prompt-fabric/route", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.promptFabricValidate(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/prompt-fabric/validate", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.promptFabricDistribute(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/prompt-fabric/distribute", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.promptFabricSync(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/prompt-fabric/sync", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.reasoningFabricProducts(): Map<String, Any?> =
    requestMap("/v1/reasoning-fabric/products", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.reasoningFabricRoute(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/reasoning-fabric/route", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.reasoningFabricPipeline(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/reasoning-fabric/pipeline", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.reasoningFabricFederate(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/reasoning-fabric/federate", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.reasoningFabricDistribute(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/reasoning-fabric/distribute", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.memoryFabricProducts(): Map<String, Any?> =
    requestMap("/v1/memory-fabric/products", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.memoryFabricRoute(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/memory-fabric/route", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.memoryFabricPipeline(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/memory-fabric/pipeline", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.memoryFabricFederate(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/memory-fabric/federate", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.memoryFabricDistribute(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/memory-fabric/distribute", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.agentFabricProducts(): Map<String, Any?> =
    requestMap("/v1/agent-fabric/products", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.agentFabricRoute(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/agent-fabric/route", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.agentFabricPipeline(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/agent-fabric/pipeline", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.agentFabricFederate(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/agent-fabric/federate", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.agentFabricDistribute(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/agent-fabric/distribute", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.policyFabricProducts(): Map<String, Any?> =
    requestMap("/v1/policy-fabric/products", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.ecosystemCloudProducts(): Map<String, Any?> =
    requestMap("/v1/ecosystem-cloud/products", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.pluginMarketplaceEngine(): Map<String, Any?> =
    requestMap("/v1/plugin-marketplace/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.modelMarketplaceEngine(): Map<String, Any?> =
    requestMap("/v1/model-marketplace/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.datasetMarketplaceEngine(): Map<String, Any?> =
    requestMap("/v1/dataset-marketplace/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.promptMarketplaceEngine(): Map<String, Any?> =
    requestMap("/v1/prompt-marketplace/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.agentMarketplaceEngine(): Map<String, Any?> =
    requestMap("/v1/agent-marketplace/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.workflowMarketplaceEngine(): Map<String, Any?> =
    requestMap("/v1/workflow-marketplace/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.connectorMarketplaceEngine(): Map<String, Any?> =
    requestMap("/v1/connector-marketplace/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.partnerConnectorsEngine(): Map<String, Any?> =
    requestMap("/v1/partner-connectors/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.partnerConnectorsPlatforms(query: Map<String, String>? = null): Map<String, Any?> =
    requestMap("/v1/partner-connectors/platforms", "GET", query = query, jsonBody = null)

suspend fun VerbaLabClient.partnerConnectorsTools(): Map<String, Any?> =
    requestMap("/v1/partner-connectors/tools", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.partnerInvoke(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/partner-connectors/invoke", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.partnerMcp(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/partner-connectors/mcp", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.partnerMcpManifest(): Map<String, Any?> =
    requestMap("/v1/partner-connectors/mcp/manifest", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.voiceLanguageMarketplaceEngine(): Map<String, Any?> =
    requestMap("/v1/voice-language-marketplace/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.africanIntelligenceCloudProducts(): Map<String, Any?> =
    requestMap("/v1/african-intelligence-cloud/products", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.africanLanguageRegistryEngine(): Map<String, Any?> =
    requestMap("/v1/african-language-registry/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.culturalIntelligenceEngine(): Map<String, Any?> =
    requestMap("/v1/cultural-intelligence/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.africanKnowledgeGraphEngine(): Map<String, Any?> =
    requestMap("/v1/african-knowledge-graph/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.governmentIntelligenceEngine(): Map<String, Any?> =
    requestMap("/v1/government-intelligence/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.healthcareIntelligenceEngine(): Map<String, Any?> =
    requestMap("/v1/healthcare-intelligence/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.financialIntelligenceEngine(): Map<String, Any?> =
    requestMap("/v1/financial-intelligence/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.educationIntelligenceEngine(): Map<String, Any?> =
    requestMap("/v1/education-intelligence/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.agriculturalIntelligenceEngine(): Map<String, Any?> =
    requestMap("/v1/agricultural-intelligence/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.mlopsLlmopsCloudProducts(): Map<String, Any?> =
    requestMap("/v1/mlops-llmops-cloud/products", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.datasetPipelineEngine(): Map<String, Any?> =
    requestMap("/v1/dataset-pipeline/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.trainingPipelineEngine(): Map<String, Any?> =
    requestMap("/v1/training-pipeline/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.continuousEvaluationEngine(): Map<String, Any?> =
    requestMap("/v1/continuous-evaluation/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.promptopsPlatformEngine(): Map<String, Any?> =
    requestMap("/v1/promptops-platform/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.ragopsPlatformEngine(): Map<String, Any?> =
    requestMap("/v1/ragops-platform/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.agentopsPlatformEngine(): Map<String, Any?> =
    requestMap("/v1/agentops-platform/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.aiDriftDetectionEngine(): Map<String, Any?> =
    requestMap("/v1/ai-drift-detection/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.continuousLearningEngine(): Map<String, Any?> =
    requestMap("/v1/continuous-learning/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.aiOperationsDashboardEngine(): Map<String, Any?> =
    requestMap("/v1/ai-operations-dashboard/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.trustCloudProducts(): Map<String, Any?> =
    requestMap("/v1/trust-cloud/products", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.aiSafetyPlatformEngine(): Map<String, Any?> =
    requestMap("/v1/ai-safety-platform/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.aiGovernancePlatformEngine(): Map<String, Any?> =
    requestMap("/v1/ai-governance-platform/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.explainabilityPlatformEngine(): Map<String, Any?> =
    requestMap("/v1/explainability-platform/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.privacyPlatformEngine(): Map<String, Any?> =
    requestMap("/v1/privacy-platform/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.compliancePlatformEngine(): Map<String, Any?> =
    requestMap("/v1/compliance-platform/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.riskIntelligenceEngine(): Map<String, Any?> =
    requestMap("/v1/risk-intelligence/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.identityFederationEngine(): Map<String, Any?> =
    requestMap("/v1/identity-federation/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.trustAnalyticsEngine(): Map<String, Any?> =
    requestMap("/v1/trust-analytics/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.platformEngineeringCloudProducts(): Map<String, Any?> =
    requestMap("/v1/platform-engineering-cloud/products", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.internalDeveloperPortalEngine(): Map<String, Any?> =
    requestMap("/v1/internal-developer-portal/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.serviceCatalogEngine(): Map<String, Any?> =
    requestMap("/v1/service-catalog/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.goldenPathPlatformEngine(): Map<String, Any?> =
    requestMap("/v1/golden-path-platform/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.gitopsPlatformEngine(): Map<String, Any?> =
    requestMap("/v1/gitops-platform/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.releaseEngineeringEngine(): Map<String, Any?> =
    requestMap("/v1/release-engineering/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.reliabilityEngineeringEngine(): Map<String, Any?> =
    requestMap("/v1/reliability-engineering/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.finopsPlatformEngine(): Map<String, Any?> =
    requestMap("/v1/finops-platform/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.supplyChainSecurityEngine(): Map<String, Any?> =
    requestMap("/v1/supply-chain-security/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.developerExperiencePlatformEngine(): Map<String, Any?> =
    requestMap("/v1/developer-experience-platform/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.platformEngineeringAnalyticsEngine(): Map<String, Any?> =
    requestMap("/v1/platform-engineering-analytics/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.researchCloudProducts(): Map<String, Any?> =
    requestMap("/v1/research-cloud/products", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.experimentPlatformEngine(): Map<String, Any?> =
    requestMap("/v1/experiment-platform/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.syntheticDataPlatformEngine(): Map<String, Any?> =
    requestMap("/v1/synthetic-data-platform/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.benchmarkPlatformEngine(): Map<String, Any?> =
    requestMap("/v1/benchmark-platform/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.evaluationPlatformEngine(): Map<String, Any?> =
    requestMap("/v1/evaluation-platform/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.aiPublicationPlatformEngine(): Map<String, Any?> =
    requestMap("/v1/ai-publication-platform/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.patentInnovationPlatformEngine(): Map<String, Any?> =
    requestMap("/v1/patent-innovation-platform/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.openSciencePlatformEngine(): Map<String, Any?> =
    requestMap("/v1/open-science-platform/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.researchAnalyticsEngine(): Map<String, Any?> =
    requestMap("/v1/research-analytics/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.tourismHeritageIntelligenceEngine(): Map<String, Any?> =
    requestMap("/v1/tourism-heritage-intelligence/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.creatorEconomyEngine(): Map<String, Any?> =
    requestMap("/v1/creator-economy/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.policyFabricRoute(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/policy-fabric/route", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.policyFabricPipeline(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/policy-fabric/pipeline", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.policyFabricAssert(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/policy-fabric/assert", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.policyFabricDistribute(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/policy-fabric/distribute", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.memoryRuntimeEngine(): Map<String, Any?> =
    requestMap("/v1/memory-runtime/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.promptRuntimeEngine(): Map<String, Any?> =
    requestMap("/v1/prompt-runtime/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.promptRuntimeExecute(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/prompt-runtime/execute", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.contextRuntimeEngine(): Map<String, Any?> =
    requestMap("/v1/context-runtime/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.contextRuntimeAssemble(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/context-runtime/assemble", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.reasoningRuntimeEngine(): Map<String, Any?> =
    requestMap("/v1/reasoning-runtime/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.reasoningRuntimePlan(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/reasoning-runtime/plan", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.reasoningRuntimeReason(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/reasoning-runtime/reason", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.agentRuntimeEngine(): Map<String, Any?> =
    requestMap("/v1/agent-runtime/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.agentRuntimeCreate(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/agent-runtime/agents", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.agentRuntimeLifecycle(id: String, body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap(("/v1/agent-runtime/agents/{id}/lifecycle").replace("{id}", encodePath(id)), "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.agentRuntimeRun(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/agent-runtime/run", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.agentRuntimeCollaborate(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/agent-runtime/collaborate", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.workflowRuntimeEngine(): Map<String, Any?> =
    requestMap("/v1/workflow-runtime/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.workflowRuntimeCreate(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/workflow-runtime/workflows", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.workflowRuntimeLifecycle(id: String, body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap(("/v1/workflow-runtime/workflows/{id}/lifecycle").replace("{id}", encodePath(id)), "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.workflowRuntimeRun(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/workflow-runtime/run", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.pluginRuntimeEngine(): Map<String, Any?> =
    requestMap("/v1/plugin-runtime/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.pluginRuntimeRegister(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/plugin-runtime/plugins", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.pluginRuntimeLifecycle(id: String, body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap(("/v1/plugin-runtime/plugins/{id}/lifecycle").replace("{id}", encodePath(id)), "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.pluginRuntimeInvoke(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/plugin-runtime/invoke", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.policyRuntimeEngine(): Map<String, Any?> =
    requestMap("/v1/policy-runtime/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.policyRuntimeEvaluate(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/policy-runtime/evaluate", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.policyRuntimeCreate(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/policy-runtime/policies", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.memoryRuntimePut(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/memory-runtime/put", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.gpuPlatformEngine(): Map<String, Any?> =
    requestMap("/v1/gpu-platform/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.gpuPlatformPools(query: Map<String, String>? = null): Map<String, Any?> =
    requestMap("/v1/gpu-platform/pools", "GET", query = query, jsonBody = null)

suspend fun VerbaLabClient.gpuPlatformAllocate(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/gpu-platform/allocations", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.gpuPlatformScale(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/gpu-platform/allocations//scale", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.modelServingEngine(): Map<String, Any?> =
    requestMap("/v1/model-serving/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.modelServingKinds(): Map<String, Any?> =
    requestMap("/v1/model-serving/kinds", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.modelServingEndpoints(query: Map<String, String>? = null): Map<String, Any?> =
    requestMap("/v1/model-serving/endpoints", "GET", query = query, jsonBody = null)

suspend fun VerbaLabClient.modelServingDeploy(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/model-serving/deployments", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.modelServingPromote(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/model-serving/deployments//promote", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.aiRouterEngine(): Map<String, Any?> =
    requestMap("/v1/ai-router/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.aiRouterResolve(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/ai-router/resolve", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.aiRouterUpsertPolicy(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/ai-router/policies", "PUT", query = null, jsonBody = body)

suspend fun VerbaLabClient.streamingRuntimeEngine(): Map<String, Any?> =
    requestMap("/v1/streaming-runtime/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.streamingRuntimeSurfaces(query: Map<String, String>? = null): Map<String, Any?> =
    requestMap("/v1/streaming-runtime/surfaces", "GET", query = query, jsonBody = null)

suspend fun VerbaLabClient.streamingRuntimeCreateSession(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/streaming-runtime/sessions", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.batchRuntimeEngine(): Map<String, Any?> =
    requestMap("/v1/batch-runtime/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.batchRuntimeCreateRun(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/batch-runtime/runs", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.intelligentCacheEngine(): Map<String, Any?> =
    requestMap("/v1/intelligent-cache/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.intelligentCachePut(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/intelligent-cache/put", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.intelligentCacheLookup(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/intelligent-cache/lookup", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.costOptimizationEngine(): Map<String, Any?> =
    requestMap("/v1/cost-optimization/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.costOptimizationRecord(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/cost-optimization/record", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.costOptimizationOptimize(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/cost-optimization/optimize", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.aiRuntimeAnalyticsEngine(): Map<String, Any?> =
    requestMap("/v1/ai-runtime-analytics/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.aiRuntimeAnalyticsOverview(query: Map<String, String>? = null): Map<String, Any?> =
    requestMap("/v1/ai-runtime-analytics/overview", "GET", query = query, jsonBody = null)

suspend fun VerbaLabClient.aiRuntimeAnalyticsReport(query: Map<String, String>? = null): Map<String, Any?> =
    requestMap("/v1/ai-runtime-analytics/report", "GET", query = query, jsonBody = null)

suspend fun VerbaLabClient.knowledgeBaseEngine(): Map<String, Any?> =
    requestMap("/v1/knowledge-base/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.enterpriseSearchEngine(): Map<String, Any?> =
    requestMap("/v1/enterprise-search/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.enterpriseSearch(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/enterprise-search/search", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.ontologyEngine(): Map<String, Any?> =
    requestMap("/v1/ontology/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.taxonomyEngine(): Map<String, Any?> =
    requestMap("/v1/taxonomy/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.enterpriseRagEngine(): Map<String, Any?> =
    requestMap("/v1/enterprise-rag/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.enterpriseRagRetrieve(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/enterprise-rag/retrieve", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.enterpriseRagQuery(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/enterprise-rag/query", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.knowledgeMemoryEngine(): Map<String, Any?> =
    requestMap("/v1/knowledge-memory/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.knowledgeMemoryCreate(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/knowledge-memory/memories", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.knowledgeMemoryEvolve(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/knowledge-memory/memories//evolve", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.knowledgeIntelligenceEngine(): Map<String, Any?> =
    requestMap("/v1/knowledge-intelligence/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.knowledgeIntelligenceDiscover(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/knowledge-intelligence/discover", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.knowledgeIntelligenceInsight(): Map<String, Any?> =
    requestMap("/v1/knowledge-intelligence/insight", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.knowledgeApisEngine(): Map<String, Any?> =
    requestMap("/v1/knowledge-apis/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.knowledgeApisSurfaces(): Map<String, Any?> =
    requestMap("/v1/knowledge-apis/surfaces", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.knowledgeAnalyticsEngine(): Map<String, Any?> =
    requestMap("/v1/knowledge-analytics/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.knowledgeAnalyticsOverview(query: Map<String, String>? = null): Map<String, Any?> =
    requestMap("/v1/knowledge-analytics/overview", "GET", query = query, jsonBody = null)

suspend fun VerbaLabClient.knowledgeAnalyticsReport(query: Map<String, String>? = null): Map<String, Any?> =
    requestMap("/v1/knowledge-analytics/report", "GET", query = query, jsonBody = null)

suspend fun VerbaLabClient.embeddingCloudEngine(): Map<String, Any?> =
    requestMap("/v1/embedding-cloud/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.embeddingCloudModels(): Map<String, Any?> =
    requestMap("/v1/embedding-cloud/models", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.vectorCloudEngine(): Map<String, Any?> =
    requestMap("/v1/vector-cloud/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.vectorCloudSearch(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/vector-cloud/search", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.memoryCloudEngine(): Map<String, Any?> =
    requestMap("/v1/memory-cloud/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.memoryCloudExport(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/memory-cloud/export", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.memoryCloudErase(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/memory-cloud/erase", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.knowledgeGraphEngine(): Map<String, Any?> =
    requestMap("/v1/knowledge-graph/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.knowledgeGraphCreateEntity(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/knowledge-graph/entities", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.contextEngine(): Map<String, Any?> =
    requestMap("/v1/context-engine/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.contextAssemble(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/context-engine/assemble", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.reasoningCloudEngine(): Map<String, Any?> =
    requestMap("/v1/reasoning-cloud/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.reasoningCloudReason(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/reasoning-cloud/reason", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.recommendationEngine(): Map<String, Any?> =
    requestMap("/v1/recommendation-engine/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.recommend(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/recommendation-engine/recommend", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.promptIntelligenceEngine(): Map<String, Any?> =
    requestMap("/v1/prompt-intelligence/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.promptIntelligencePreview(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/prompt-intelligence/preview", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.promptIntelligenceEvaluate(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/prompt-intelligence/evaluate", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.decisionEngine(): Map<String, Any?> =
    requestMap("/v1/decision-engine/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.decide(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/decision-engine/decide", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.aiOrchestrationEngine(): Map<String, Any?> =
    requestMap("/v1/ai-orchestration/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.aiOrchestrationRun(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/ai-orchestration/run", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.intelligenceAnalyticsEngine(): Map<String, Any?> =
    requestMap("/v1/intelligence-analytics/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.intelligenceAnalyticsOverview(query: Map<String, String>? = null): Map<String, Any?> =
    requestMap("/v1/intelligence-analytics/overview", "GET", query = query, jsonBody = null)

suspend fun VerbaLabClient.intelligenceAnalyticsReport(query: Map<String, String>? = null): Map<String, Any?> =
    requestMap("/v1/intelligence-analytics/report", "GET", query = query, jsonBody = null)

suspend fun VerbaLabClient.neuralTtsEngine(): Map<String, Any?> =
    requestMap("/v1/tts/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.neuralTtsVoices(query: Map<String, String>? = null): Map<String, Any?> =
    requestMap("/v1/tts/voices", "GET", query = query, jsonBody = null)

suspend fun VerbaLabClient.voiceCloningEngine(): Map<String, Any?> =
    requestMap("/v1/voice-cloning/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.voiceCloningConsentPolicy(): Map<String, Any?> =
    requestMap("/v1/voice-cloning/consent/policy", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.emotionVoiceEngine(): Map<String, Any?> =
    requestMap("/v1/emotion-voice/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.emotionVoiceProfiles(): Map<String, Any?> =
    requestMap("/v1/emotion-voice/profiles", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.voiceStudioEngine(): Map<String, Any?> =
    requestMap("/v1/voice-studio/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.voiceStudioLibrary(): Map<String, Any?> =
    requestMap("/v1/voice-studio/library", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.voiceEnhancementEngine(): Map<String, Any?> =
    requestMap("/v1/voice-enhancement/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.voiceEnhancementProfiles(): Map<String, Any?> =
    requestMap("/v1/voice-enhancement/profiles", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.voiceBiometricsEngine(): Map<String, Any?> =
    requestMap("/v1/voice-biometrics/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.voiceBiometricsEncryption(): Map<String, Any?> =
    requestMap("/v1/voice-biometrics/encryption", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.voiceMarketplaceEngine(): Map<String, Any?> =
    requestMap("/v1/voice-marketplace/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.voiceMarketplaceLanguagePacks(): Map<String, Any?> =
    requestMap("/v1/voice-marketplace/language-packs", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.voiceAnalyticsEngine(): Map<String, Any?> =
    requestMap("/v1/voice-analytics/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.voiceAnalyticsOverview(query: Map<String, String>? = null): Map<String, Any?> =
    requestMap("/v1/voice-analytics/overview", "GET", query = query, jsonBody = null)

suspend fun VerbaLabClient.voiceAnalyticsReport(query: Map<String, String>? = null): Map<String, Any?> =
    requestMap("/v1/voice-analytics/report", "GET", query = query, jsonBody = null)

suspend fun VerbaLabClient.speechEngine(): Map<String, Any?> =
    requestMap("/v1/speech/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.speechVocabularyPacks(): Map<String, Any?> =
    requestMap("/v1/speech/vocabulary/packs", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.speakerEngine(): Map<String, Any?> =
    requestMap("/v1/speakers/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.speakerProfiles(): Map<String, Any?> =
    requestMap("/v1/speakers/profiles", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.createSpeakerProfile(body: Map<String, Any?>? = null): Map<String, Any?> =
    requestMap("/v1/speakers/profiles", "POST", query = null, jsonBody = body)

suspend fun VerbaLabClient.enrollSpeaker(file: ByteArray, fileName: String, mimeType: String = "application/octet-stream", fields: Map<String, String> = emptyMap()): Map<String, Any?> =
    requestMultipart("/v1/speakers/profiles//enroll", "file", fileName, file, mimeType, fields)

suspend fun VerbaLabClient.verifySpeaker(file: ByteArray, fileName: String, mimeType: String = "application/octet-stream", fields: Map<String, String> = emptyMap()): Map<String, Any?> =
    requestMultipart("/v1/speakers/verify", "file", fileName, file, mimeType, fields)

suspend fun VerbaLabClient.identifySpeaker(file: ByteArray, fileName: String, mimeType: String = "application/octet-stream", fields: Map<String, String> = emptyMap()): Map<String, Any?> =
    requestMultipart("/v1/speakers/identify", "file", fileName, file, mimeType, fields)

suspend fun VerbaLabClient.diarizeSpeech(file: ByteArray, fileName: String, mimeType: String = "application/octet-stream", fields: Map<String, String> = emptyMap()): Map<String, Any?> =
    requestMultipart("/v1/speakers/diarize", "file", fileName, file, mimeType, fields)

suspend fun VerbaLabClient.recognizeSpeech(file: ByteArray, fileName: String, mimeType: String = "application/octet-stream", fields: Map<String, String> = emptyMap()): Map<String, Any?> =
    requestMultipart("/v1/speech/recognize", "file", fileName, file, mimeType, fields)

suspend fun VerbaLabClient.interpret(file: ByteArray, fileName: String, mimeType: String = "application/octet-stream", fields: Map<String, String> = emptyMap()): Map<String, Any?> =
    requestMultipart("/v1/interpret", "file", fileName, file, mimeType, fields)

suspend fun VerbaLabClient.controlPlaneCloudProducts(): Map<String, Any?> =
    requestMap("/v1/control-plane-cloud/products", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.organizationControlEngine(): Map<String, Any?> =
    requestMap("/v1/organization-control/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.globalConfigurationPlatformEngine(): Map<String, Any?> =
    requestMap("/v1/global-configuration-platform/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.globalPolicyEngineEngine(): Map<String, Any?> =
    requestMap("/v1/global-policy-engine/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.globalDeploymentControllerEngine(): Map<String, Any?> =
    requestMap("/v1/global-deployment-controller/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.globalRoutingControllerEngine(): Map<String, Any?> =
    requestMap("/v1/global-routing-controller/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.secretsCertificatePlatformEngine(): Map<String, Any?> =
    requestMap("/v1/secrets-certificate-platform/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.globalSchedulerEngine(): Map<String, Any?> =
    requestMap("/v1/global-scheduler/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.controlPlaneAnalyticsEngine(): Map<String, Any?> =
    requestMap("/v1/control-plane-analytics/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.dataPlaneCloudProducts(): Map<String, Any?> =
    requestMap("/v1/data-plane-cloud/products", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.translationRuntimeEngine(): Map<String, Any?> =
    requestMap("/v1/translation-runtime/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.speechRuntimeEngine(): Map<String, Any?> =
    requestMap("/v1/speech-runtime/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.voiceRuntimeEngine(): Map<String, Any?> =
    requestMap("/v1/voice-runtime/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.visionRuntimeEngine(): Map<String, Any?> =
    requestMap("/v1/vision-runtime/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.knowledgeRuntimeEngine(): Map<String, Any?> =
    requestMap("/v1/knowledge-runtime/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.embeddingRuntimeEngine(): Map<String, Any?> =
    requestMap("/v1/embedding-runtime/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.dataPlaneStreamingEngine(): Map<String, Any?> =
    requestMap("/v1/data-plane-streaming/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.gpuRuntimeEngine(): Map<String, Any?> =
    requestMap("/v1/gpu-runtime/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.vaiosProducts(): Map<String, Any?> =
    requestMap("/v1/vaios/products", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.aiSchedulerEngine(): Map<String, Any?> =
    requestMap("/v1/ai-scheduler/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.runtimeManagerEngine(): Map<String, Any?> =
    requestMap("/v1/runtime-manager/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.resourceManagerEngine(): Map<String, Any?> =
    requestMap("/v1/resource-manager/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.workflowOperatingSystemEngine(): Map<String, Any?> =
    requestMap("/v1/workflow-operating-system/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.agentOperatingSystemEngine(): Map<String, Any?> =
    requestMap("/v1/agent-operating-system/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.aiMemoryOperatingSystemEngine(): Map<String, Any?> =
    requestMap("/v1/ai-memory-operating-system/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.knowledgeOperatingSystemEngine(): Map<String, Any?> =
    requestMap("/v1/knowledge-operating-system/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.pluginOperatingSystemEngine(): Map<String, Any?> =
    requestMap("/v1/plugin-operating-system/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.enterpriseEngineeringSystemProducts(): Map<String, Any?> =
    requestMap("/v1/enterprise-engineering-system/products", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.engineeringGovernanceEngine(): Map<String, Any?> =
    requestMap("/v1/engineering-governance/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.architectureGovernanceEngine(): Map<String, Any?> =
    requestMap("/v1/architecture-governance/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.repositoryStandardsEngine(): Map<String, Any?> =
    requestMap("/v1/repository-standards/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.engineeringQualityPlatformEngine(): Map<String, Any?> =
    requestMap("/v1/engineering-quality-platform/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.aiEngineeringStandardsEngine(): Map<String, Any?> =
    requestMap("/v1/ai-engineering-standards/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.apiEngineeringStandardsEngine(): Map<String, Any?> =
    requestMap("/v1/api-engineering-standards/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.databaseEngineeringStandardsEngine(): Map<String, Any?> =
    requestMap("/v1/database-engineering-standards/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.infrastructureEngineeringStandardsEngine(): Map<String, Any?> =
    requestMap("/v1/infrastructure-engineering-standards/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.aiEngineeringStandardsChecks(): Map<String, Any?> =
    requestMap("/v1/ai-engineering-standards/check/list", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.corporateOperatingSystemProducts(): Map<String, Any?> =
    requestMap("/v1/corporate-operating-system/products", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.corporateGovernancePlatformEngine(): Map<String, Any?> =
    requestMap("/v1/corporate-governance-platform/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.strategicPlanningPlatformEngine(): Map<String, Any?> =
    requestMap("/v1/strategic-planning-platform/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.enterprisePortfolioManagementEngine(): Map<String, Any?> =
    requestMap("/v1/enterprise-portfolio-management/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.businessArchitectureEngine(): Map<String, Any?> =
    requestMap("/v1/business-architecture/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.enterpriseArchitectureRepositoryEngine(): Map<String, Any?> =
    requestMap("/v1/enterprise-architecture-repository/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.corporateKnowledgeSystemEngine(): Map<String, Any?> =
    requestMap("/v1/corporate-knowledge-system/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.executiveIntelligencePlatformEngine(): Map<String, Any?> =
    requestMap("/v1/executive-intelligence-platform/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.corporateRiskPlatformEngine(): Map<String, Any?> =
    requestMap("/v1/corporate-risk-platform/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.corporateOperatingSystemConstitution(): Map<String, Any?> =
    requestMap("/v1/corporate-operating-system/constitution", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.globalAiStandardsProducts(): Map<String, Any?> =
    requestMap("/v1/global-ai-standards/products", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.globalAiStandardsIsoProcess(): Map<String, Any?> =
    requestMap("/v1/global-ai-standards/iso-process", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.aiCertificationPlatformEngine(): Map<String, Any?> =
    requestMap("/v1/ai-certification-platform/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.aiCertificationPlatformScheme(): Map<String, Any?> =
    requestMap("/v1/ai-certification-platform/scheme", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.aiComplianceFrameworkEngine(): Map<String, Any?> =
    requestMap("/v1/ai-compliance-framework/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.referenceArchitecturesEngine(): Map<String, Any?> =
    requestMap("/v1/reference-architectures/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.bestPracticesLibraryEngine(): Map<String, Any?> =
    requestMap("/v1/best-practices-library/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.enterpriseAssessmentPlatformEngine(): Map<String, Any?> =
    requestMap("/v1/enterprise-assessment-platform/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.standardsRepositoryEngine(): Map<String, Any?> =
    requestMap("/v1/standards-repository/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.globalPartnerProgramEngine(): Map<String, Any?> =
    requestMap("/v1/global-partner-program/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.standardsAnalyticsEngine(): Map<String, Any?> =
    requestMap("/v1/standards-analytics/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.globalAiStandardsVerify(): Map<String, Any?> =
    requestMap("/v1/global-ai-standards/verify/", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.aiEconomyProducts(): Map<String, Any?> =
    requestMap("/v1/ai-economy/products", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.aiCommercePlatformEngine(): Map<String, Any?> =
    requestMap("/v1/ai-commerce-platform/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.aiLicensingPlatformEngine(): Map<String, Any?> =
    requestMap("/v1/ai-licensing-platform/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.revenueSharingPlatformEngine(): Map<String, Any?> =
    requestMap("/v1/revenue-sharing-platform/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.aiTalentPlatformEngine(): Map<String, Any?> =
    requestMap("/v1/ai-talent-platform/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.researchFundingPlatformEngine(): Map<String, Any?> =
    requestMap("/v1/research-funding-platform/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.globalCommunityPlatformEngine(): Map<String, Any?> =
    requestMap("/v1/global-community-platform/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.aiInvestmentPlatformEngine(): Map<String, Any?> =
    requestMap("/v1/ai-investment-platform/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.economicIntelligenceEngine(): Map<String, Any?> =
    requestMap("/v1/economic-intelligence/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.aiEconomyGuards(): Map<String, Any?> =
    requestMap("/v1/ai-economy/guards", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.digitalCivilizationProducts(): Map<String, Any?> =
    requestMap("/v1/digital-civilization/products", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.nationalAiPlatformEngine(): Map<String, Any?> =
    requestMap("/v1/national-ai-platform/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.smartCityPlatformEngine(): Map<String, Any?> =
    requestMap("/v1/smart-city-platform/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.enterpriseNationPlatformEngine(): Map<String, Any?> =
    requestMap("/v1/enterprise-nation-platform/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.globalLanguagePreservationEngine(): Map<String, Any?> =
    requestMap("/v1/global-language-preservation/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.universalTranslationGridEngine(): Map<String, Any?> =
    requestMap("/v1/universal-translation-grid/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.globalKnowledgeNetworkEngine(): Map<String, Any?> =
    requestMap("/v1/global-knowledge-network/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.globalAiFederationEngine(): Map<String, Any?> =
    requestMap("/v1/global-ai-federation/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.civilizationIntelligenceDashboardEngine(): Map<String, Any?> =
    requestMap("/v1/civilization-intelligence-dashboard/engine", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.digitalCivilizationGuards(): Map<String, Any?> =
    requestMap("/v1/digital-civilization/guards", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.libraryReferenceProducts(): Map<String, Any?> =
    requestMap("/v1/library-reference/products", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.libraryReferenceIndex(query: Map<String, String>? = null): Map<String, Any?> =
    requestMap("/v1/library-reference/index", "GET", query = query, jsonBody = null)

suspend fun VerbaLabClient.libraryReferenceRisks(): Map<String, Any?> =
    requestMap("/v1/library-reference/risks", "GET", query = null, jsonBody = null)

suspend fun VerbaLabClient.libraryReferenceVision(): Map<String, Any?> =
    requestMap("/v1/library-reference/vision", "GET", query = null, jsonBody = null)

