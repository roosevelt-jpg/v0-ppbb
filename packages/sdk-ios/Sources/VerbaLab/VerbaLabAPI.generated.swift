import Foundation

public extension VerbaLabClient {
    // Auto-generated from @verbalab/sdk — full product API surface for mobile.

    public func translateEngine() async throws -> [String: Any] {
        var path = "/v1/translate/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func translateFormat(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/translate/formats"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func translateChat(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/translate/chat"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    /// Streaming endpoint — returns raw SSE bytes. Parse `data:` lines in your app.
    public func translateStream(body: [String: Any]? = nil) async throws -> Data {
        var path = "/v1/translate/stream"
        return try await requestData(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func dialects(query: [String: String]? = nil) async throws -> [String: Any] {
        var path = "/v1/dialects"
        return try await requestJSONObject(path: path, method: "GET", query: query, jsonObject: nil)
    }

    public func dialect(code: String) async throws -> [String: Any] {
        var path = "/v1/dialects/{code}"
        path = path.replacingOccurrences(of: "{code}", with: code.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? code)
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func detectDialect(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/dialects/detect"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func accents(query: [String: String]? = nil) async throws -> [String: Any] {
        var path = "/v1/accents"
        return try await requestJSONObject(path: path, method: "GET", query: query, jsonObject: nil)
    }

    public func accent(code: String) async throws -> [String: Any] {
        var path = "/v1/accents/{code}"
        path = path.replacingOccurrences(of: "{code}", with: code.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? code)
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func detectAccent(file: Data, fileName: String, mimeType: String = "application/octet-stream", fields: [String: String] = [:]) async throws -> [String: Any] {
        var path = "/v1/accents/detect"
        return try await requestMultipart(path: path, fileField: "file", fileName: fileName, fileData: file, mimeType: mimeType, fields: fields)
    }

    public func accentEngine() async throws -> [String: Any] {
        var path = "/v1/accents/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func accentAnalytics() async throws -> [String: Any] {
        var path = "/v1/accents/analytics"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func classifyAccent(file: Data, fileName: String, mimeType: String = "application/octet-stream", fields: [String: String] = [:]) async throws -> [String: Any] {
        var path = "/v1/accents/classify"
        return try await requestMultipart(path: path, fileField: "file", fileName: fileName, fileData: file, mimeType: mimeType, fields: fields)
    }

    public func emotionEngine() async throws -> [String: Any] {
        var path = "/v1/emotion/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func detectEmotion(file: Data, fileName: String, mimeType: String = "application/octet-stream", fields: [String: String] = [:]) async throws -> [String: Any] {
        var path = "/v1/emotion/detect"
        return try await requestMultipart(path: path, fileField: "file", fileName: fileName, fileData: file, mimeType: mimeType, fields: fields)
    }

    public func audioEngine() async throws -> [String: Any] {
        var path = "/v1/audio-intelligence/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func analyzeAudio(file: Data, fileName: String, mimeType: String = "application/octet-stream", fields: [String: String] = [:]) async throws -> [String: Any] {
        var path = "/v1/audio-intelligence/analyze"
        return try await requestMultipart(path: path, fileField: "file", fileName: fileName, fileData: file, mimeType: mimeType, fields: fields)
    }

    public func enhanceAudio(file: Data, fileName: String, mimeType: String = "application/octet-stream", fields: [String: String] = [:]) async throws -> [String: Any] {
        var path = "/v1/audio-intelligence/enhance"
        return try await requestMultipart(path: path, fileField: "file", fileName: fileName, fileData: file, mimeType: mimeType, fields: fields)
    }

    public func isolateAudio(file: Data, fileName: String, mimeType: String = "application/octet-stream", fields: [String: String] = [:]) async throws -> [String: Any] {
        var path = "/v1/audio-intelligence/isolate"
        return try await requestMultipart(path: path, fileField: "file", fileName: fileName, fileData: file, mimeType: mimeType, fields: fields)
    }

    public func pronunciationEngine() async throws -> [String: Any] {
        var path = "/v1/pronunciation/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func assessPronunciation(file: Data, fileName: String, mimeType: String = "application/octet-stream", fields: [String: String] = [:]) async throws -> [String: Any] {
        var path = "/v1/pronunciation/assess"
        return try await requestMultipart(path: path, fileField: "file", fileName: fileName, fileData: file, mimeType: mimeType, fields: fields)
    }

    public func wakeWordEngine() async throws -> [String: Any] {
        var path = "/v1/wake-word/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func detectWakeWord(file: Data, fileName: String, mimeType: String = "application/octet-stream", fields: [String: String] = [:]) async throws -> [String: Any] {
        var path = "/v1/wake-word/detect"
        return try await requestMultipart(path: path, fileField: "file", fileName: fileName, fileData: file, mimeType: mimeType, fields: fields)
    }

    public func spotKeywords(file: Data, fileName: String, mimeType: String = "application/octet-stream", fields: [String: String] = [:]) async throws -> [String: Any] {
        var path = "/v1/wake-word/spot"
        return try await requestMultipart(path: path, fileField: "file", fileName: fileName, fileData: file, mimeType: mimeType, fields: fields)
    }

    public func callIntelligenceEngine() async throws -> [String: Any] {
        var path = "/v1/call-intelligence/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func ingestCall(file: Data, fileName: String, mimeType: String = "application/octet-stream", fields: [String: String] = [:]) async throws -> [String: Any] {
        var path = "/v1/call-intelligence/calls"
        return try await requestMultipart(path: path, fileField: "file", fileName: fileName, fileData: file, mimeType: mimeType, fields: fields)
    }

    public func callIntelligenceReport() async throws -> [String: Any] {
        var path = "/v1/call-intelligence/report"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func speechAnalyticsEngine() async throws -> [String: Any] {
        var path = "/v1/speech-analytics/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func speechAnalyticsOverview(query: [String: String]? = nil) async throws -> [String: Any] {
        var path = "/v1/speech-analytics/overview"
        return try await requestJSONObject(path: path, method: "GET", query: query, jsonObject: nil)
    }

    public func speechAnalyticsReport(query: [String: String]? = nil) async throws -> [String: Any] {
        var path = "/v1/speech-analytics/report"
        return try await requestJSONObject(path: path, method: "GET", query: query, jsonObject: nil)
    }

    public func checkGrammar(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/grammar/check"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func grammarIntelligence() async throws -> [String: Any] {
        var path = "/v1/grammar/intelligence"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func spellCheck(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/grammar/spell"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func correctGrammar(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/grammar/correct"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func suggestWriting(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/grammar/suggest"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func grammarAnalytics() async throws -> [String: Any] {
        var path = "/v1/grammar/analytics"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func styleProfiles() async throws -> [String: Any] {
        var path = "/v1/style/profiles"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func rewriteStyle(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/style/rewrite"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func styleIntelligence() async throws -> [String: Any] {
        var path = "/v1/style/intelligence"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func detectTone(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/style/detect"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func transformTone(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/style/transform"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func transferStyle(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/style/transfer"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func styleAnalytics() async throws -> [String: Any] {
        var path = "/v1/style/analytics"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func languageIntelligence() async throws -> [String: Any] {
        var path = "/v1/language-intelligence"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func analyzeLanguage(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/language-intelligence/analyze"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func languageSentiment(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/language-intelligence/sentiment"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func languageIntent(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/language-intelligence/intent"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func translationConfidence(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/language-intelligence/translation-confidence"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func speechConfidence(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/language-intelligence/speech-confidence"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func languageIntelligenceAnalytics() async throws -> [String: Any] {
        var path = "/v1/language-intelligence/analytics"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func tmIntelligence() async throws -> [String: Any] {
        var path = "/v1/tm"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func searchTm(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/tm/search"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func tmAnalytics() async throws -> [String: Any] {
        var path = "/v1/tm/analytics"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func languageAnalyticsCatalog() async throws -> [String: Any] {
        var path = "/v1/analytics"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func analyticsOverview(query: [String: String]? = nil) async throws -> [String: Any] {
        var path = "/v1/analytics/overview"
        return try await requestJSONObject(path: path, method: "GET", query: query, jsonObject: nil)
    }

    public func analyticsTranslation(query: [String: String]? = nil) async throws -> [String: Any] {
        var path = "/v1/analytics/translation"
        return try await requestJSONObject(path: path, method: "GET", query: query, jsonObject: nil)
    }

    public func analyticsQuality(query: [String: String]? = nil) async throws -> [String: Any] {
        var path = "/v1/analytics/quality"
        return try await requestJSONObject(path: path, method: "GET", query: query, jsonObject: nil)
    }

    public func analyticsLatency(query: [String: String]? = nil) async throws -> [String: Any] {
        var path = "/v1/analytics/latency"
        return try await requestJSONObject(path: path, method: "GET", query: query, jsonObject: nil)
    }

    public func enterpriseAnalyticsReport(query: [String: String]? = nil) async throws -> [String: Any] {
        var path = "/v1/analytics/reports/enterprise"
        return try await requestJSONObject(path: path, method: "GET", query: query, jsonObject: nil)
    }

    public func countryPacks(query: [String: String]? = nil) async throws -> [String: Any] {
        var path = "/v1/country-packs"
        return try await requestJSONObject(path: path, method: "GET", query: query, jsonObject: nil)
    }

    public func countryPack(code: String, query: [String: String]? = nil) async throws -> [String: Any] {
        var path = "/v1/country-packs/{code}"
        path = path.replacingOccurrences(of: "{code}", with: code.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? code)
        return try await requestJSONObject(path: path, method: "GET", query: query, jsonObject: nil)
    }

    public func language(code: String) async throws -> [String: Any] {
        var path = "/v1/languages/{code}"
        path = path.replacingOccurrences(of: "{code}", with: code.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? code)
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func registry() async throws -> [String: Any] {
        var path = "/v1/registry"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func languageFamilies() async throws -> [String: Any] {
        var path = "/v1/registry/families"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func languageFamily(code: String) async throws -> [String: Any] {
        var path = "/v1/registry/families/{code}"
        path = path.replacingOccurrences(of: "{code}", with: code.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? code)
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func writingSystems(query: [String: String]? = nil) async throws -> [String: Any] {
        var path = "/v1/registry/scripts"
        return try await requestJSONObject(path: path, method: "GET", query: query, jsonObject: nil)
    }

    public func writingSystem(code: String) async throws -> [String: Any] {
        var path = "/v1/registry/scripts/{code}"
        path = path.replacingOccurrences(of: "{code}", with: code.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? code)
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func alphabets() async throws -> [String: Any] {
        var path = "/v1/registry/alphabets"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func linguisticRules(query: [String: String]? = nil) async throws -> [String: Any] {
        var path = "/v1/registry/rules"
        return try await requestJSONObject(path: path, method: "GET", query: query, jsonObject: nil)
    }

    public func linguisticRule(code: String) async throws -> [String: Any] {
        var path = "/v1/registry/rules/{code}"
        path = path.replacingOccurrences(of: "{code}", with: code.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? code)
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func validateRegistry(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/registry/validate"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func registryAnalytics() async throws -> [String: Any] {
        var path = "/v1/registry/analytics"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func registryHealth() async throws -> [String: Any] {
        var path = "/v1/registry/health"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func regions() async throws -> [String: Any] {
        var path = "/v1/regions"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func locales() async throws -> [String: Any] {
        var path = "/v1/locales"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func locale(code: String) async throws -> [String: Any] {
        var path = "/v1/locales/{code}"
        path = path.replacingOccurrences(of: "{code}", with: code.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? code)
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func localeLayout(code: String) async throws -> [String: Any] {
        var path = "/v1/locales/{code}/layout"
        path = path.replacingOccurrences(of: "{code}", with: code.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? code)
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func localeFormat(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/locales/format"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func localizationPlatform() async throws -> [String: Any] {
        var path = "/v1/localization"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func validateIcu(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/icu/validate"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func formatIcu(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/icu/format"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func localizeCatalog(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/localize/catalog"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func localizeQa(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/localize/qa"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func localize(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/localize"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func createJob(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/jobs"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func listJobs() async throws -> [String: Any] {
        var path = "/v1/jobs?limit="
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func getJob(id: String) async throws -> [String: Any] {
        var path = "/v1/jobs/{id}"
        path = path.replacingOccurrences(of: "{id}", with: id.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? id)
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func ocr(file: Data, fileName: String, mimeType: String = "application/octet-stream", fields: [String: String] = [:]) async throws -> [String: Any] {
        var path = "/v1/ocr"
        return try await requestMultipart(path: path, fileField: "file", fileName: fileName, fileData: file, mimeType: mimeType, fields: fields)
    }

    public func voices() async throws -> [String: Any] {
        var path = "/v1/audio/voices"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func speechProducts() async throws -> [String: Any] {
        var path = "/v1/speech/products"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func voiceProducts() async throws -> [String: Any] {
        var path = "/v1/voice-cloud/products"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func intelligenceProducts() async throws -> [String: Any] {
        var path = "/v1/intelligence-cloud/products"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func knowledgeProducts() async throws -> [String: Any] {
        var path = "/v1/knowledge-cloud/products"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func inferenceProducts() async throws -> [String: Any] {
        var path = "/v1/inference-cloud/products"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func aiKernelProducts() async throws -> [String: Any] {
        var path = "/v1/ai-kernel/products"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func foundationModelCloudProducts() async throws -> [String: Any] {
        var path = "/v1/foundation-model-cloud/products"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func modelTrainingPlatformEngine() async throws -> [String: Any] {
        var path = "/v1/model-training-platform/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func modelEvaluationPlatformEngine() async throws -> [String: Any] {
        var path = "/v1/model-evaluation-platform/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func modelRegistryEngine() async throws -> [String: Any] {
        var path = "/v1/model-registry/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func atlasEngine() async throws -> [String: Any] {
        var path = "/v1/atlas/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func aiFabricProducts() async throws -> [String: Any] {
        var path = "/v1/ai-fabric/products"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func eventFabricProducts() async throws -> [String: Any] {
        var path = "/v1/event-fabric/products"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func eventFabricPublish(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/event-fabric/events"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func eventFabricPoll(query: [String: String]? = nil) async throws -> [String: Any] {
        var path = "/v1/event-fabric/events"
        return try await requestJSONObject(path: path, method: "GET", query: query, jsonObject: nil)
    }

    public func eventFabricAnalytics() async throws -> [String: Any] {
        var path = "/v1/event-fabric/analytics"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func contextFabricProducts() async throws -> [String: Any] {
        var path = "/v1/context-fabric/products"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func contextFabricRoute(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/context-fabric/route"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func contextFabricPropagate(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/context-fabric/propagate"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func knowledgeFabricProducts() async throws -> [String: Any] {
        var path = "/v1/knowledge-fabric/products"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func knowledgeFabricRoute(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/knowledge-fabric/route"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func knowledgeFabricFederate(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/knowledge-fabric/federate"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func knowledgeFabricDistribute(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/knowledge-fabric/distribute"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func knowledgeFabricSync(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/knowledge-fabric/sync"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func promptFabricProducts() async throws -> [String: Any] {
        var path = "/v1/prompt-fabric/products"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func promptFabricRoute(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/prompt-fabric/route"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func promptFabricValidate(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/prompt-fabric/validate"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func promptFabricDistribute(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/prompt-fabric/distribute"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func promptFabricSync(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/prompt-fabric/sync"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func reasoningFabricProducts() async throws -> [String: Any] {
        var path = "/v1/reasoning-fabric/products"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func reasoningFabricRoute(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/reasoning-fabric/route"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func reasoningFabricPipeline(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/reasoning-fabric/pipeline"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func reasoningFabricFederate(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/reasoning-fabric/federate"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func reasoningFabricDistribute(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/reasoning-fabric/distribute"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func memoryFabricProducts() async throws -> [String: Any] {
        var path = "/v1/memory-fabric/products"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func memoryFabricRoute(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/memory-fabric/route"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func memoryFabricPipeline(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/memory-fabric/pipeline"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func memoryFabricFederate(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/memory-fabric/federate"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func memoryFabricDistribute(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/memory-fabric/distribute"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func agentFabricProducts() async throws -> [String: Any] {
        var path = "/v1/agent-fabric/products"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func agentFabricRoute(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/agent-fabric/route"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func agentFabricPipeline(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/agent-fabric/pipeline"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func agentFabricFederate(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/agent-fabric/federate"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func agentFabricDistribute(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/agent-fabric/distribute"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func policyFabricProducts() async throws -> [String: Any] {
        var path = "/v1/policy-fabric/products"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func ecosystemCloudProducts() async throws -> [String: Any] {
        var path = "/v1/ecosystem-cloud/products"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func pluginMarketplaceEngine() async throws -> [String: Any] {
        var path = "/v1/plugin-marketplace/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func modelMarketplaceEngine() async throws -> [String: Any] {
        var path = "/v1/model-marketplace/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func datasetMarketplaceEngine() async throws -> [String: Any] {
        var path = "/v1/dataset-marketplace/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func promptMarketplaceEngine() async throws -> [String: Any] {
        var path = "/v1/prompt-marketplace/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func agentMarketplaceEngine() async throws -> [String: Any] {
        var path = "/v1/agent-marketplace/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func workflowMarketplaceEngine() async throws -> [String: Any] {
        var path = "/v1/workflow-marketplace/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func connectorMarketplaceEngine() async throws -> [String: Any] {
        var path = "/v1/connector-marketplace/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func partnerConnectorsEngine() async throws -> [String: Any] {
        var path = "/v1/partner-connectors/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func partnerConnectorsPlatforms(query: [String: String]? = nil) async throws -> [String: Any] {
        var path = "/v1/partner-connectors/platforms"
        return try await requestJSONObject(path: path, method: "GET", query: query, jsonObject: nil)
    }

    public func partnerConnectorsTools() async throws -> [String: Any] {
        var path = "/v1/partner-connectors/tools"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func partnerInvoke(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/partner-connectors/invoke"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func partnerMcp(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/partner-connectors/mcp"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func partnerMcpManifest() async throws -> [String: Any] {
        var path = "/v1/partner-connectors/mcp/manifest"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func voiceLanguageMarketplaceEngine() async throws -> [String: Any] {
        var path = "/v1/voice-language-marketplace/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func africanIntelligenceCloudProducts() async throws -> [String: Any] {
        var path = "/v1/african-intelligence-cloud/products"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func africanLanguageRegistryEngine() async throws -> [String: Any] {
        var path = "/v1/african-language-registry/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func culturalIntelligenceEngine() async throws -> [String: Any] {
        var path = "/v1/cultural-intelligence/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func africanKnowledgeGraphEngine() async throws -> [String: Any] {
        var path = "/v1/african-knowledge-graph/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func governmentIntelligenceEngine() async throws -> [String: Any] {
        var path = "/v1/government-intelligence/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func healthcareIntelligenceEngine() async throws -> [String: Any] {
        var path = "/v1/healthcare-intelligence/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func financialIntelligenceEngine() async throws -> [String: Any] {
        var path = "/v1/financial-intelligence/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func educationIntelligenceEngine() async throws -> [String: Any] {
        var path = "/v1/education-intelligence/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func agriculturalIntelligenceEngine() async throws -> [String: Any] {
        var path = "/v1/agricultural-intelligence/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func mlopsLlmopsCloudProducts() async throws -> [String: Any] {
        var path = "/v1/mlops-llmops-cloud/products"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func datasetPipelineEngine() async throws -> [String: Any] {
        var path = "/v1/dataset-pipeline/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func trainingPipelineEngine() async throws -> [String: Any] {
        var path = "/v1/training-pipeline/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func continuousEvaluationEngine() async throws -> [String: Any] {
        var path = "/v1/continuous-evaluation/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func promptopsPlatformEngine() async throws -> [String: Any] {
        var path = "/v1/promptops-platform/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func ragopsPlatformEngine() async throws -> [String: Any] {
        var path = "/v1/ragops-platform/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func agentopsPlatformEngine() async throws -> [String: Any] {
        var path = "/v1/agentops-platform/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func aiDriftDetectionEngine() async throws -> [String: Any] {
        var path = "/v1/ai-drift-detection/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func continuousLearningEngine() async throws -> [String: Any] {
        var path = "/v1/continuous-learning/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func aiOperationsDashboardEngine() async throws -> [String: Any] {
        var path = "/v1/ai-operations-dashboard/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func trustCloudProducts() async throws -> [String: Any] {
        var path = "/v1/trust-cloud/products"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func aiSafetyPlatformEngine() async throws -> [String: Any] {
        var path = "/v1/ai-safety-platform/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func aiGovernancePlatformEngine() async throws -> [String: Any] {
        var path = "/v1/ai-governance-platform/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func explainabilityPlatformEngine() async throws -> [String: Any] {
        var path = "/v1/explainability-platform/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func privacyPlatformEngine() async throws -> [String: Any] {
        var path = "/v1/privacy-platform/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func compliancePlatformEngine() async throws -> [String: Any] {
        var path = "/v1/compliance-platform/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func riskIntelligenceEngine() async throws -> [String: Any] {
        var path = "/v1/risk-intelligence/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func identityFederationEngine() async throws -> [String: Any] {
        var path = "/v1/identity-federation/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func trustAnalyticsEngine() async throws -> [String: Any] {
        var path = "/v1/trust-analytics/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func platformEngineeringCloudProducts() async throws -> [String: Any] {
        var path = "/v1/platform-engineering-cloud/products"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func internalDeveloperPortalEngine() async throws -> [String: Any] {
        var path = "/v1/internal-developer-portal/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func serviceCatalogEngine() async throws -> [String: Any] {
        var path = "/v1/service-catalog/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func goldenPathPlatformEngine() async throws -> [String: Any] {
        var path = "/v1/golden-path-platform/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func gitopsPlatformEngine() async throws -> [String: Any] {
        var path = "/v1/gitops-platform/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func releaseEngineeringEngine() async throws -> [String: Any] {
        var path = "/v1/release-engineering/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func reliabilityEngineeringEngine() async throws -> [String: Any] {
        var path = "/v1/reliability-engineering/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func finopsPlatformEngine() async throws -> [String: Any] {
        var path = "/v1/finops-platform/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func supplyChainSecurityEngine() async throws -> [String: Any] {
        var path = "/v1/supply-chain-security/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func developerExperiencePlatformEngine() async throws -> [String: Any] {
        var path = "/v1/developer-experience-platform/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func platformEngineeringAnalyticsEngine() async throws -> [String: Any] {
        var path = "/v1/platform-engineering-analytics/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func researchCloudProducts() async throws -> [String: Any] {
        var path = "/v1/research-cloud/products"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func experimentPlatformEngine() async throws -> [String: Any] {
        var path = "/v1/experiment-platform/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func syntheticDataPlatformEngine() async throws -> [String: Any] {
        var path = "/v1/synthetic-data-platform/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func benchmarkPlatformEngine() async throws -> [String: Any] {
        var path = "/v1/benchmark-platform/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func evaluationPlatformEngine() async throws -> [String: Any] {
        var path = "/v1/evaluation-platform/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func aiPublicationPlatformEngine() async throws -> [String: Any] {
        var path = "/v1/ai-publication-platform/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func patentInnovationPlatformEngine() async throws -> [String: Any] {
        var path = "/v1/patent-innovation-platform/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func openSciencePlatformEngine() async throws -> [String: Any] {
        var path = "/v1/open-science-platform/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func researchAnalyticsEngine() async throws -> [String: Any] {
        var path = "/v1/research-analytics/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func tourismHeritageIntelligenceEngine() async throws -> [String: Any] {
        var path = "/v1/tourism-heritage-intelligence/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func creatorEconomyEngine() async throws -> [String: Any] {
        var path = "/v1/creator-economy/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func policyFabricRoute(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/policy-fabric/route"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func policyFabricPipeline(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/policy-fabric/pipeline"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func policyFabricAssert(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/policy-fabric/assert"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func policyFabricDistribute(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/policy-fabric/distribute"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func memoryRuntimeEngine() async throws -> [String: Any] {
        var path = "/v1/memory-runtime/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func promptRuntimeEngine() async throws -> [String: Any] {
        var path = "/v1/prompt-runtime/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func promptRuntimeExecute(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/prompt-runtime/execute"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func contextRuntimeEngine() async throws -> [String: Any] {
        var path = "/v1/context-runtime/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func contextRuntimeAssemble(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/context-runtime/assemble"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func reasoningRuntimeEngine() async throws -> [String: Any] {
        var path = "/v1/reasoning-runtime/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func reasoningRuntimePlan(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/reasoning-runtime/plan"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func reasoningRuntimeReason(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/reasoning-runtime/reason"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func agentRuntimeEngine() async throws -> [String: Any] {
        var path = "/v1/agent-runtime/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func agentRuntimeCreate(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/agent-runtime/agents"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func agentRuntimeLifecycle(id: String, body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/agent-runtime/agents/{id}/lifecycle"
        path = path.replacingOccurrences(of: "{id}", with: id.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? id)
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func agentRuntimeRun(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/agent-runtime/run"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func agentRuntimeCollaborate(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/agent-runtime/collaborate"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func workflowRuntimeEngine() async throws -> [String: Any] {
        var path = "/v1/workflow-runtime/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func workflowRuntimeCreate(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/workflow-runtime/workflows"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func workflowRuntimeLifecycle(id: String, body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/workflow-runtime/workflows/{id}/lifecycle"
        path = path.replacingOccurrences(of: "{id}", with: id.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? id)
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func workflowRuntimeRun(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/workflow-runtime/run"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func pluginRuntimeEngine() async throws -> [String: Any] {
        var path = "/v1/plugin-runtime/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func pluginRuntimeRegister(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/plugin-runtime/plugins"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func pluginRuntimeLifecycle(id: String, body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/plugin-runtime/plugins/{id}/lifecycle"
        path = path.replacingOccurrences(of: "{id}", with: id.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? id)
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func pluginRuntimeInvoke(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/plugin-runtime/invoke"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func policyRuntimeEngine() async throws -> [String: Any] {
        var path = "/v1/policy-runtime/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func policyRuntimeEvaluate(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/policy-runtime/evaluate"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func policyRuntimeCreate(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/policy-runtime/policies"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func memoryRuntimePut(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/memory-runtime/put"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func gpuPlatformEngine() async throws -> [String: Any] {
        var path = "/v1/gpu-platform/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func gpuPlatformPools(query: [String: String]? = nil) async throws -> [String: Any] {
        var path = "/v1/gpu-platform/pools"
        return try await requestJSONObject(path: path, method: "GET", query: query, jsonObject: nil)
    }

    public func gpuPlatformAllocate(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/gpu-platform/allocations"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func gpuPlatformScale(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/gpu-platform/allocations//scale"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func modelServingEngine() async throws -> [String: Any] {
        var path = "/v1/model-serving/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func modelServingKinds() async throws -> [String: Any] {
        var path = "/v1/model-serving/kinds"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func modelServingEndpoints(query: [String: String]? = nil) async throws -> [String: Any] {
        var path = "/v1/model-serving/endpoints"
        return try await requestJSONObject(path: path, method: "GET", query: query, jsonObject: nil)
    }

    public func modelServingDeploy(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/model-serving/deployments"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func modelServingPromote(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/model-serving/deployments//promote"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func aiRouterEngine() async throws -> [String: Any] {
        var path = "/v1/ai-router/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func aiRouterResolve(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/ai-router/resolve"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func aiRouterUpsertPolicy(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/ai-router/policies"
        return try await requestJSONObject(path: path, method: "PUT", query: nil, jsonObject: body)
    }

    public func streamingRuntimeEngine() async throws -> [String: Any] {
        var path = "/v1/streaming-runtime/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func streamingRuntimeSurfaces(query: [String: String]? = nil) async throws -> [String: Any] {
        var path = "/v1/streaming-runtime/surfaces"
        return try await requestJSONObject(path: path, method: "GET", query: query, jsonObject: nil)
    }

    public func streamingRuntimeCreateSession(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/streaming-runtime/sessions"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func batchRuntimeEngine() async throws -> [String: Any] {
        var path = "/v1/batch-runtime/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func batchRuntimeCreateRun(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/batch-runtime/runs"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func intelligentCacheEngine() async throws -> [String: Any] {
        var path = "/v1/intelligent-cache/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func intelligentCachePut(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/intelligent-cache/put"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func intelligentCacheLookup(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/intelligent-cache/lookup"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func costOptimizationEngine() async throws -> [String: Any] {
        var path = "/v1/cost-optimization/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func costOptimizationRecord(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/cost-optimization/record"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func costOptimizationOptimize(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/cost-optimization/optimize"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func aiRuntimeAnalyticsEngine() async throws -> [String: Any] {
        var path = "/v1/ai-runtime-analytics/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func aiRuntimeAnalyticsOverview(query: [String: String]? = nil) async throws -> [String: Any] {
        var path = "/v1/ai-runtime-analytics/overview"
        return try await requestJSONObject(path: path, method: "GET", query: query, jsonObject: nil)
    }

    public func aiRuntimeAnalyticsReport(query: [String: String]? = nil) async throws -> [String: Any] {
        var path = "/v1/ai-runtime-analytics/report"
        return try await requestJSONObject(path: path, method: "GET", query: query, jsonObject: nil)
    }

    public func knowledgeBaseEngine() async throws -> [String: Any] {
        var path = "/v1/knowledge-base/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func enterpriseSearchEngine() async throws -> [String: Any] {
        var path = "/v1/enterprise-search/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func enterpriseSearch(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/enterprise-search/search"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func ontologyEngine() async throws -> [String: Any] {
        var path = "/v1/ontology/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func taxonomyEngine() async throws -> [String: Any] {
        var path = "/v1/taxonomy/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func enterpriseRagEngine() async throws -> [String: Any] {
        var path = "/v1/enterprise-rag/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func enterpriseRagRetrieve(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/enterprise-rag/retrieve"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func enterpriseRagQuery(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/enterprise-rag/query"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func knowledgeMemoryEngine() async throws -> [String: Any] {
        var path = "/v1/knowledge-memory/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func knowledgeMemoryCreate(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/knowledge-memory/memories"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func knowledgeMemoryEvolve(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/knowledge-memory/memories//evolve"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func knowledgeIntelligenceEngine() async throws -> [String: Any] {
        var path = "/v1/knowledge-intelligence/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func knowledgeIntelligenceDiscover(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/knowledge-intelligence/discover"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func knowledgeIntelligenceInsight() async throws -> [String: Any] {
        var path = "/v1/knowledge-intelligence/insight"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func knowledgeApisEngine() async throws -> [String: Any] {
        var path = "/v1/knowledge-apis/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func knowledgeApisSurfaces() async throws -> [String: Any] {
        var path = "/v1/knowledge-apis/surfaces"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func knowledgeAnalyticsEngine() async throws -> [String: Any] {
        var path = "/v1/knowledge-analytics/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func knowledgeAnalyticsOverview(query: [String: String]? = nil) async throws -> [String: Any] {
        var path = "/v1/knowledge-analytics/overview"
        return try await requestJSONObject(path: path, method: "GET", query: query, jsonObject: nil)
    }

    public func knowledgeAnalyticsReport(query: [String: String]? = nil) async throws -> [String: Any] {
        var path = "/v1/knowledge-analytics/report"
        return try await requestJSONObject(path: path, method: "GET", query: query, jsonObject: nil)
    }

    public func embeddingCloudEngine() async throws -> [String: Any] {
        var path = "/v1/embedding-cloud/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func embeddingCloudModels() async throws -> [String: Any] {
        var path = "/v1/embedding-cloud/models"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func vectorCloudEngine() async throws -> [String: Any] {
        var path = "/v1/vector-cloud/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func vectorCloudSearch(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/vector-cloud/search"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func memoryCloudEngine() async throws -> [String: Any] {
        var path = "/v1/memory-cloud/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func memoryCloudExport(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/memory-cloud/export"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func memoryCloudErase(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/memory-cloud/erase"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func knowledgeGraphEngine() async throws -> [String: Any] {
        var path = "/v1/knowledge-graph/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func knowledgeGraphCreateEntity(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/knowledge-graph/entities"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func contextEngine() async throws -> [String: Any] {
        var path = "/v1/context-engine/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func contextAssemble(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/context-engine/assemble"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func reasoningCloudEngine() async throws -> [String: Any] {
        var path = "/v1/reasoning-cloud/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func reasoningCloudReason(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/reasoning-cloud/reason"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func recommendationEngine() async throws -> [String: Any] {
        var path = "/v1/recommendation-engine/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func recommend(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/recommendation-engine/recommend"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func promptIntelligenceEngine() async throws -> [String: Any] {
        var path = "/v1/prompt-intelligence/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func promptIntelligencePreview(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/prompt-intelligence/preview"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func promptIntelligenceEvaluate(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/prompt-intelligence/evaluate"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func decisionEngine() async throws -> [String: Any] {
        var path = "/v1/decision-engine/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func decide(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/decision-engine/decide"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func aiOrchestrationEngine() async throws -> [String: Any] {
        var path = "/v1/ai-orchestration/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func aiOrchestrationRun(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/ai-orchestration/run"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func intelligenceAnalyticsEngine() async throws -> [String: Any] {
        var path = "/v1/intelligence-analytics/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func intelligenceAnalyticsOverview(query: [String: String]? = nil) async throws -> [String: Any] {
        var path = "/v1/intelligence-analytics/overview"
        return try await requestJSONObject(path: path, method: "GET", query: query, jsonObject: nil)
    }

    public func intelligenceAnalyticsReport(query: [String: String]? = nil) async throws -> [String: Any] {
        var path = "/v1/intelligence-analytics/report"
        return try await requestJSONObject(path: path, method: "GET", query: query, jsonObject: nil)
    }

    public func neuralTtsEngine() async throws -> [String: Any] {
        var path = "/v1/tts/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func neuralTtsVoices(query: [String: String]? = nil) async throws -> [String: Any] {
        var path = "/v1/tts/voices"
        return try await requestJSONObject(path: path, method: "GET", query: query, jsonObject: nil)
    }

    public func voiceCloningEngine() async throws -> [String: Any] {
        var path = "/v1/voice-cloning/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func voiceCloningConsentPolicy() async throws -> [String: Any] {
        var path = "/v1/voice-cloning/consent/policy"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func emotionVoiceEngine() async throws -> [String: Any] {
        var path = "/v1/emotion-voice/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func emotionVoiceProfiles() async throws -> [String: Any] {
        var path = "/v1/emotion-voice/profiles"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func voiceStudioEngine() async throws -> [String: Any] {
        var path = "/v1/voice-studio/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func voiceStudioLibrary() async throws -> [String: Any] {
        var path = "/v1/voice-studio/library"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func voiceEnhancementEngine() async throws -> [String: Any] {
        var path = "/v1/voice-enhancement/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func voiceEnhancementProfiles() async throws -> [String: Any] {
        var path = "/v1/voice-enhancement/profiles"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func voiceBiometricsEngine() async throws -> [String: Any] {
        var path = "/v1/voice-biometrics/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func voiceBiometricsEncryption() async throws -> [String: Any] {
        var path = "/v1/voice-biometrics/encryption"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func voiceMarketplaceEngine() async throws -> [String: Any] {
        var path = "/v1/voice-marketplace/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func voiceMarketplaceLanguagePacks() async throws -> [String: Any] {
        var path = "/v1/voice-marketplace/language-packs"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func voiceAnalyticsEngine() async throws -> [String: Any] {
        var path = "/v1/voice-analytics/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func voiceAnalyticsOverview(query: [String: String]? = nil) async throws -> [String: Any] {
        var path = "/v1/voice-analytics/overview"
        return try await requestJSONObject(path: path, method: "GET", query: query, jsonObject: nil)
    }

    public func voiceAnalyticsReport(query: [String: String]? = nil) async throws -> [String: Any] {
        var path = "/v1/voice-analytics/report"
        return try await requestJSONObject(path: path, method: "GET", query: query, jsonObject: nil)
    }

    public func speechEngine() async throws -> [String: Any] {
        var path = "/v1/speech/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func speechVocabularyPacks() async throws -> [String: Any] {
        var path = "/v1/speech/vocabulary/packs"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func speakerEngine() async throws -> [String: Any] {
        var path = "/v1/speakers/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func speakerProfiles() async throws -> [String: Any] {
        var path = "/v1/speakers/profiles"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func createSpeakerProfile(body: [String: Any]? = nil) async throws -> [String: Any] {
        var path = "/v1/speakers/profiles"
        return try await requestJSONObject(path: path, method: "POST", query: nil, jsonObject: body)
    }

    public func enrollSpeaker(file: Data, fileName: String, mimeType: String = "application/octet-stream", fields: [String: String] = [:]) async throws -> [String: Any] {
        var path = "/v1/speakers/profiles//enroll"
        return try await requestMultipart(path: path, fileField: "file", fileName: fileName, fileData: file, mimeType: mimeType, fields: fields)
    }

    public func verifySpeaker(file: Data, fileName: String, mimeType: String = "application/octet-stream", fields: [String: String] = [:]) async throws -> [String: Any] {
        var path = "/v1/speakers/verify"
        return try await requestMultipart(path: path, fileField: "file", fileName: fileName, fileData: file, mimeType: mimeType, fields: fields)
    }

    public func identifySpeaker(file: Data, fileName: String, mimeType: String = "application/octet-stream", fields: [String: String] = [:]) async throws -> [String: Any] {
        var path = "/v1/speakers/identify"
        return try await requestMultipart(path: path, fileField: "file", fileName: fileName, fileData: file, mimeType: mimeType, fields: fields)
    }

    public func diarizeSpeech(file: Data, fileName: String, mimeType: String = "application/octet-stream", fields: [String: String] = [:]) async throws -> [String: Any] {
        var path = "/v1/speakers/diarize"
        return try await requestMultipart(path: path, fileField: "file", fileName: fileName, fileData: file, mimeType: mimeType, fields: fields)
    }

    public func recognizeSpeech(file: Data, fileName: String, mimeType: String = "application/octet-stream", fields: [String: String] = [:]) async throws -> [String: Any] {
        var path = "/v1/speech/recognize"
        return try await requestMultipart(path: path, fileField: "file", fileName: fileName, fileData: file, mimeType: mimeType, fields: fields)
    }

    public func interpret(file: Data, fileName: String, mimeType: String = "application/octet-stream", fields: [String: String] = [:]) async throws -> [String: Any] {
        var path = "/v1/interpret"
        return try await requestMultipart(path: path, fileField: "file", fileName: fileName, fileData: file, mimeType: mimeType, fields: fields)
    }

    public func controlPlaneCloudProducts() async throws -> [String: Any] {
        var path = "/v1/control-plane-cloud/products"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func organizationControlEngine() async throws -> [String: Any] {
        var path = "/v1/organization-control/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func globalConfigurationPlatformEngine() async throws -> [String: Any] {
        var path = "/v1/global-configuration-platform/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func globalPolicyEngineEngine() async throws -> [String: Any] {
        var path = "/v1/global-policy-engine/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func globalDeploymentControllerEngine() async throws -> [String: Any] {
        var path = "/v1/global-deployment-controller/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func globalRoutingControllerEngine() async throws -> [String: Any] {
        var path = "/v1/global-routing-controller/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func secretsCertificatePlatformEngine() async throws -> [String: Any] {
        var path = "/v1/secrets-certificate-platform/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func globalSchedulerEngine() async throws -> [String: Any] {
        var path = "/v1/global-scheduler/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func controlPlaneAnalyticsEngine() async throws -> [String: Any] {
        var path = "/v1/control-plane-analytics/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func dataPlaneCloudProducts() async throws -> [String: Any] {
        var path = "/v1/data-plane-cloud/products"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func translationRuntimeEngine() async throws -> [String: Any] {
        var path = "/v1/translation-runtime/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func speechRuntimeEngine() async throws -> [String: Any] {
        var path = "/v1/speech-runtime/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func voiceRuntimeEngine() async throws -> [String: Any] {
        var path = "/v1/voice-runtime/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func visionRuntimeEngine() async throws -> [String: Any] {
        var path = "/v1/vision-runtime/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func knowledgeRuntimeEngine() async throws -> [String: Any] {
        var path = "/v1/knowledge-runtime/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func embeddingRuntimeEngine() async throws -> [String: Any] {
        var path = "/v1/embedding-runtime/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func dataPlaneStreamingEngine() async throws -> [String: Any] {
        var path = "/v1/data-plane-streaming/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func gpuRuntimeEngine() async throws -> [String: Any] {
        var path = "/v1/gpu-runtime/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func vaiosProducts() async throws -> [String: Any] {
        var path = "/v1/vaios/products"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func aiSchedulerEngine() async throws -> [String: Any] {
        var path = "/v1/ai-scheduler/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func runtimeManagerEngine() async throws -> [String: Any] {
        var path = "/v1/runtime-manager/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func resourceManagerEngine() async throws -> [String: Any] {
        var path = "/v1/resource-manager/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func workflowOperatingSystemEngine() async throws -> [String: Any] {
        var path = "/v1/workflow-operating-system/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func agentOperatingSystemEngine() async throws -> [String: Any] {
        var path = "/v1/agent-operating-system/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func aiMemoryOperatingSystemEngine() async throws -> [String: Any] {
        var path = "/v1/ai-memory-operating-system/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func knowledgeOperatingSystemEngine() async throws -> [String: Any] {
        var path = "/v1/knowledge-operating-system/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func pluginOperatingSystemEngine() async throws -> [String: Any] {
        var path = "/v1/plugin-operating-system/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func enterpriseEngineeringSystemProducts() async throws -> [String: Any] {
        var path = "/v1/enterprise-engineering-system/products"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func engineeringGovernanceEngine() async throws -> [String: Any] {
        var path = "/v1/engineering-governance/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func architectureGovernanceEngine() async throws -> [String: Any] {
        var path = "/v1/architecture-governance/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func repositoryStandardsEngine() async throws -> [String: Any] {
        var path = "/v1/repository-standards/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func engineeringQualityPlatformEngine() async throws -> [String: Any] {
        var path = "/v1/engineering-quality-platform/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func aiEngineeringStandardsEngine() async throws -> [String: Any] {
        var path = "/v1/ai-engineering-standards/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func apiEngineeringStandardsEngine() async throws -> [String: Any] {
        var path = "/v1/api-engineering-standards/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func databaseEngineeringStandardsEngine() async throws -> [String: Any] {
        var path = "/v1/database-engineering-standards/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func infrastructureEngineeringStandardsEngine() async throws -> [String: Any] {
        var path = "/v1/infrastructure-engineering-standards/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func aiEngineeringStandardsChecks() async throws -> [String: Any] {
        var path = "/v1/ai-engineering-standards/check/list"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func corporateOperatingSystemProducts() async throws -> [String: Any] {
        var path = "/v1/corporate-operating-system/products"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func corporateGovernancePlatformEngine() async throws -> [String: Any] {
        var path = "/v1/corporate-governance-platform/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func strategicPlanningPlatformEngine() async throws -> [String: Any] {
        var path = "/v1/strategic-planning-platform/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func enterprisePortfolioManagementEngine() async throws -> [String: Any] {
        var path = "/v1/enterprise-portfolio-management/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func businessArchitectureEngine() async throws -> [String: Any] {
        var path = "/v1/business-architecture/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func enterpriseArchitectureRepositoryEngine() async throws -> [String: Any] {
        var path = "/v1/enterprise-architecture-repository/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func corporateKnowledgeSystemEngine() async throws -> [String: Any] {
        var path = "/v1/corporate-knowledge-system/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func executiveIntelligencePlatformEngine() async throws -> [String: Any] {
        var path = "/v1/executive-intelligence-platform/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func corporateRiskPlatformEngine() async throws -> [String: Any] {
        var path = "/v1/corporate-risk-platform/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func corporateOperatingSystemConstitution() async throws -> [String: Any] {
        var path = "/v1/corporate-operating-system/constitution"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func globalAiStandardsProducts() async throws -> [String: Any] {
        var path = "/v1/global-ai-standards/products"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func globalAiStandardsIsoProcess() async throws -> [String: Any] {
        var path = "/v1/global-ai-standards/iso-process"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func aiCertificationPlatformEngine() async throws -> [String: Any] {
        var path = "/v1/ai-certification-platform/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func aiCertificationPlatformScheme() async throws -> [String: Any] {
        var path = "/v1/ai-certification-platform/scheme"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func aiComplianceFrameworkEngine() async throws -> [String: Any] {
        var path = "/v1/ai-compliance-framework/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func referenceArchitecturesEngine() async throws -> [String: Any] {
        var path = "/v1/reference-architectures/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func bestPracticesLibraryEngine() async throws -> [String: Any] {
        var path = "/v1/best-practices-library/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func enterpriseAssessmentPlatformEngine() async throws -> [String: Any] {
        var path = "/v1/enterprise-assessment-platform/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func standardsRepositoryEngine() async throws -> [String: Any] {
        var path = "/v1/standards-repository/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func globalPartnerProgramEngine() async throws -> [String: Any] {
        var path = "/v1/global-partner-program/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func standardsAnalyticsEngine() async throws -> [String: Any] {
        var path = "/v1/standards-analytics/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func globalAiStandardsVerify() async throws -> [String: Any] {
        var path = "/v1/global-ai-standards/verify/"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func aiEconomyProducts() async throws -> [String: Any] {
        var path = "/v1/ai-economy/products"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func aiCommercePlatformEngine() async throws -> [String: Any] {
        var path = "/v1/ai-commerce-platform/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func aiLicensingPlatformEngine() async throws -> [String: Any] {
        var path = "/v1/ai-licensing-platform/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func revenueSharingPlatformEngine() async throws -> [String: Any] {
        var path = "/v1/revenue-sharing-platform/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func aiTalentPlatformEngine() async throws -> [String: Any] {
        var path = "/v1/ai-talent-platform/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func researchFundingPlatformEngine() async throws -> [String: Any] {
        var path = "/v1/research-funding-platform/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func globalCommunityPlatformEngine() async throws -> [String: Any] {
        var path = "/v1/global-community-platform/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func aiInvestmentPlatformEngine() async throws -> [String: Any] {
        var path = "/v1/ai-investment-platform/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func economicIntelligenceEngine() async throws -> [String: Any] {
        var path = "/v1/economic-intelligence/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func aiEconomyGuards() async throws -> [String: Any] {
        var path = "/v1/ai-economy/guards"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func digitalCivilizationProducts() async throws -> [String: Any] {
        var path = "/v1/digital-civilization/products"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func nationalAiPlatformEngine() async throws -> [String: Any] {
        var path = "/v1/national-ai-platform/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func smartCityPlatformEngine() async throws -> [String: Any] {
        var path = "/v1/smart-city-platform/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func enterpriseNationPlatformEngine() async throws -> [String: Any] {
        var path = "/v1/enterprise-nation-platform/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func globalLanguagePreservationEngine() async throws -> [String: Any] {
        var path = "/v1/global-language-preservation/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func universalTranslationGridEngine() async throws -> [String: Any] {
        var path = "/v1/universal-translation-grid/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func globalKnowledgeNetworkEngine() async throws -> [String: Any] {
        var path = "/v1/global-knowledge-network/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func globalAiFederationEngine() async throws -> [String: Any] {
        var path = "/v1/global-ai-federation/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func civilizationIntelligenceDashboardEngine() async throws -> [String: Any] {
        var path = "/v1/civilization-intelligence-dashboard/engine"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func digitalCivilizationGuards() async throws -> [String: Any] {
        var path = "/v1/digital-civilization/guards"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func libraryReferenceProducts() async throws -> [String: Any] {
        var path = "/v1/library-reference/products"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func libraryReferenceIndex(query: [String: String]? = nil) async throws -> [String: Any] {
        var path = "/v1/library-reference/index"
        return try await requestJSONObject(path: path, method: "GET", query: query, jsonObject: nil)
    }

    public func libraryReferenceRisks() async throws -> [String: Any] {
        var path = "/v1/library-reference/risks"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }

    public func libraryReferenceVision() async throws -> [String: Any] {
        var path = "/v1/library-reference/vision"
        return try await requestJSONObject(path: path, method: "GET", query: nil, jsonObject: nil)
    }
}
