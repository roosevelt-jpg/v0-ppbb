package ai.verbalab.sdk

import com.google.gson.Gson
import com.google.gson.JsonElement
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

/**
 * Official VerbaLab Android / JVM SDK.
 * Mirrors `@verbalab/sdk` so mobile apps can integrate every product API.
 */
class VerbaLabClient(
    options: VerbaLabClientOptions,
    private val http: OkHttpClient = OkHttpClient(),
    private val gson: Gson = Gson(),
) {
    private val apiKey: String = options.apiKey
    private val baseUrl: String = options.baseUrl.trimEnd('/')

    constructor(apiKey: String, baseUrl: String = "https://api.verbalab.ai") : this(
        VerbaLabClientOptions(apiKey, baseUrl),
    )

    init {
        require(apiKey.startsWith("vl_live_") || apiKey.startsWith("vl_test_")) {
            "apiKey must start with vl_live_ or vl_test_"
        }
    }

    suspend fun translate(request: TranslateRequest): TranslateResponse =
        requestJson("/v1/translate", "POST", body = request)

    suspend fun detect(request: DetectRequest): DetectResponse =
        requestJson("/v1/detect", "POST", body = request)

    suspend fun languages(): Map<String, Any?> =
        requestMap("/v1/languages", "GET")

    suspend fun chat(body: Map<String, Any?>): Map<String, Any?> =
        requestMap("/v1/chat/completions", "POST", jsonBody = body)

    suspend fun embeddings(body: Map<String, Any?>): Map<String, Any?> =
        requestMap("/v1/embeddings", "POST", jsonBody = body)

    suspend fun speech(body: Map<String, Any?>): ByteArray =
        requestBytes("/v1/audio/speech", "POST", jsonBody = body)

    suspend fun transcribe(
        file: ByteArray,
        fileName: String,
        mimeType: String = "audio/mpeg",
        fields: Map<String, String> = emptyMap(),
    ): Map<String, Any?> =
        requestMultipart("/v1/audio/transcriptions", "file", fileName, file, mimeType, fields)

    /** Escape hatch for any OpenAPI path. */
    suspend fun call(
        path: String,
        method: String = "GET",
        query: Map<String, String>? = null,
        jsonBody: Map<String, Any?>? = null,
    ): Map<String, Any?> = requestMap(path, method, query = query, jsonBody = jsonBody)

    suspend fun <T> requestJson(
        path: String,
        method: String,
        query: Map<String, String>? = null,
        body: Any? = null,
        clazz: Class<T>,
    ): T = withContext(Dispatchers.IO) {
        val data = perform(path, method, query, body?.let { gson.toJson(it) }, "application/json")
        gson.fromJson(data, clazz)
    }

    private suspend inline fun <reified T> requestJson(
        path: String,
        method: String,
        query: Map<String, String>? = null,
        body: Any? = null,
    ): T = requestJson(path, method, query, body, T::class.java)

    suspend fun requestMap(
        path: String,
        method: String,
        query: Map<String, String>? = null,
        jsonBody: Map<String, Any?>? = null,
    ): Map<String, Any?> = withContext(Dispatchers.IO) {
        val payload = jsonBody?.let { gson.toJson(it) }
        val raw = perform(path, method, query, payload, if (jsonBody == null) null else "application/json")
        val el = JsonParser.parseString(raw)
        when {
            el.isJsonObject -> gson.fromJson(el, object : TypeToken<Map<String, Any?>>() {}.type)
            else -> mapOf("data" to gson.fromJson(el, Any::class.java))
        }
    }

    suspend fun requestBytes(
        path: String,
        method: String,
        query: Map<String, String>? = null,
        jsonBody: Map<String, Any?>? = null,
    ): ByteArray = withContext(Dispatchers.IO) {
        val payload = jsonBody?.let { gson.toJson(it) }
        performBytes(path, method, query, payload, "application/json")
    }

    suspend fun requestMultipart(
        path: String,
        fileField: String,
        fileName: String,
        file: ByteArray,
        mimeType: String,
        fields: Map<String, String>,
    ): Map<String, Any?> = withContext(Dispatchers.IO) {
        val multipart = MultipartBody.Builder().setType(MultipartBody.FORM)
        fields.forEach { (k, v) -> multipart.addFormDataPart(k, v) }
        multipart.addFormDataPart(
            fileField,
            fileName,
            file.toRequestBody(mimeType.toMediaType()),
        )
        val url = (baseUrl + path).toHttpUrl()
        val req = Request.Builder()
            .url(url)
            .header("Authorization", "Bearer $apiKey")
            .header("Accept", "application/json")
            .post(multipart.build())
            .build()
        http.newCall(req).execute().use { resp ->
            val body = resp.body?.string().orEmpty()
            if (!resp.isSuccessful) throw parseError(resp.code, body)
            val el = JsonParser.parseString(body)
            if (el.isJsonObject) gson.fromJson(el, object : TypeToken<Map<String, Any?>>() {}.type)
            else mapOf("data" to gson.fromJson(el, Any::class.java))
        }
    }

    private fun perform(
        path: String,
        method: String,
        query: Map<String, String>?,
        json: String?,
        contentType: String?,
    ): String {
        val bytes = performBytes(path, method, query, json, contentType)
        return String(bytes, StandardCharsets.UTF_8)
    }

    private fun performBytes(
        path: String,
        method: String,
        query: Map<String, String>?,
        json: String?,
        contentType: String?,
    ): ByteArray {
        val urlBuilder = (baseUrl + path).toHttpUrl().newBuilder()
        query?.forEach { (k, v) -> urlBuilder.addQueryParameter(k, v) }
        val builder = Request.Builder()
            .url(urlBuilder.build())
            .header("Authorization", "Bearer $apiKey")
            .header("Accept", if (contentType == null && method == "GET") "application/json" else "*/*")
        val body = json?.toRequestBody((contentType ?: "application/json").toMediaType())
        builder.method(method, if (method == "GET" || method == "HEAD") null else body ?: ByteArray(0).toRequestBody(null))
        if (contentType != null) builder.header("Content-Type", contentType)
        http.newCall(builder.build()).execute().use { resp ->
            val bytes = resp.body?.bytes() ?: ByteArray(0)
            if (!resp.isSuccessful) throw parseError(resp.code, String(bytes, StandardCharsets.UTF_8))
            return bytes
        }
    }

    private fun parseError(status: Int, body: String): VerbaLabError {
        return try {
            val obj = JsonParser.parseString(body).asJsonObject
            val err = obj.getAsJsonObject("error")
            VerbaLabError(
                message = err?.get("message")?.asString ?: "HTTP $status",
                code = err?.get("code")?.asString ?: "http_error",
                statusCode = status,
                requestId = err?.get("request_id")?.asString,
            )
        } catch (_: Exception) {
            VerbaLabError("HTTP $status", "http_error", status)
        }
    }

    internal fun encodePath(value: String): String =
        URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20")
}
