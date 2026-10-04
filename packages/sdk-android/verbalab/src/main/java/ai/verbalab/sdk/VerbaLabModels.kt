package ai.verbalab.sdk

data class VerbaLabClientOptions(
    val apiKey: String,
    val baseUrl: String = "https://api.verbalab.ai",
)

data class TranslateRequest(
    val text: String,
    val source: String = "auto",
    val target: String,
)

data class TranslateResponse(
    val text: String? = null,
    val translatedText: String? = null,
    val source: String? = null,
    val target: String? = null,
    val provider: String? = null,
    val characters: Int? = null,
)

data class DetectRequest(val text: String)

data class DetectResponse(
    val language: String? = null,
    val confidence: Double? = null,
)
