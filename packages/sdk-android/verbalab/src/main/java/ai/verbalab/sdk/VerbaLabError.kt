package ai.verbalab.sdk

class VerbaLabError(
    message: String,
    val code: String,
    val statusCode: Int,
    val requestId: String? = null,
) : Exception(message)
