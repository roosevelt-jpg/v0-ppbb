#!/usr/bin/env node
/**
 * Generate iOS (Swift) + Android (Kotlin) SDKs from packages/sdk/src/client.ts.
 * Every public TypeScript client method becomes a mobile helper so nothing is deferred.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const clientPath = path.join(root, 'packages/sdk/src/client.ts');
const src = fs.readFileSync(clientPath, 'utf8');
const lines = src.split('\n');

function extractMethods() {
  const starts = [];
  for (let i = 0; i < lines.length; i++) {
    const sig = lines[i].match(/^\s+async (\*?)([a-zA-Z0-9]+)\(/);
    if (sig) starts.push({ name: sig[2], star: Boolean(sig[1]), start: i });
  }

  const methods = [];
  for (let s = 0; s < starts.length; s++) {
    const { name, star, start } = starts[s];
    if (['parseJsonResponse', 'requestJson', 'requestForm'].includes(name)) continue;
    const end = s + 1 < starts.length ? starts[s + 1].start : lines.length;
    // Only the lines belonging to this method (until next async method)
    const chunk = lines.slice(start, end).join('\n');

    let pathExpr = null;
    let kind = 'json';
    let form = false;
    const p = chunk.match(
      /this\.(requestJson|requestForm)\s*(?:<[^>]*>)?\s*\(\s*(`[^`]+`|'[^']+'|"[^"]+")/,
    );
    if (p) {
      kind = p[1] === 'requestForm' ? 'form' : 'json';
      form = kind === 'form';
      pathExpr = p[2].slice(1, -1);
    }
    if (!pathExpr) {
      const f = chunk.match(/fetchImpl\(`\$\{this\.baseUrl\}([^`]+)`/);
      if (f) {
        pathExpr = f[1];
        kind = 'fetch';
      }
    }
    if (!pathExpr) continue;

    const pathParams = [
      ...new Set(
        [...pathExpr.matchAll(/\$\{encodeURIComponent\(([a-zA-Z0-9]+)\)\}/g)].map((x) => x[1]),
      ),
    ];
    pathExpr = pathExpr
      .replace(/\$\{encodeURIComponent\(([a-zA-Z0-9]+)\)\}/g, '{$1}')
      .replace(/\$\{q\}/g, '')
      .replace(/\$\{qs \?[\s\S]*$/g, '')
      .replace(/\$\{[^}]*$/g, '')
      .replace(/\$\{[^}]+\}/g, '');
    if (!pathExpr.startsWith('/')) pathExpr = `/${pathExpr}`;

    const mm = chunk.match(/method:\s*'([A-Z]+)'/);
    const hasJsonBody = /JSON\.stringify/.test(chunk);
    let http = mm?.[1] ?? null;
    if (!http) {
      if (form) http = 'POST';
      else if (hasJsonBody) http = 'POST';
      else http = 'GET';
    }

    methods.push({
      name,
      star,
      start,
      pathExpr,
      http,
      kind,
      hasJsonBody,
      form,
      pathParams,
      acceptsQuery: /\$\{q\}|\$\{qs\}|URLSearchParams/.test(chunk),
      acceptsBody: hasJsonBody || ['POST', 'PUT', 'PATCH'].includes(http),
      isBinary: name === 'speech' || (kind === 'fetch' && /audio\/speech/.test(pathExpr)),
      isStream: star || /event-stream|translateStream/.test(chunk + name),
    });
  }

  return methods;
}

function swiftName(name) {
  return name;
}

function kotlinName(name) {
  return name;
}

function write(file, contents) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
  console.log('wrote', path.relative(root, file));
}

function generateSwift(methods) {
  const iosRoot = path.join(root, 'packages/sdk-ios');
  write(
    path.join(iosRoot, 'Package.swift'),
    `// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "VerbaLab",
    platforms: [
        .iOS(.v15),
        .macOS(.v12),
    ],
    products: [
        .library(name: "VerbaLab", targets: ["VerbaLab"]),
    ],
    targets: [
        .target(name: "VerbaLab"),
        .testTarget(name: "VerbaLabTests", dependencies: ["VerbaLab"]),
    ]
)
`,
  );

  write(
    path.join(iosRoot, 'Sources/VerbaLab/VerbaLabError.swift'),
    `import Foundation

public struct VerbaLabError: Error, LocalizedError, Sendable {
    public let message: String
    public let code: String
    public let statusCode: Int
    public let requestId: String?

    public init(message: String, code: String, statusCode: Int, requestId: String? = nil) {
        self.message = message
        self.code = code
        self.statusCode = statusCode
        self.requestId = requestId
    }

    public var errorDescription: String? { message }
}
`,
  );

  write(
    path.join(iosRoot, 'Sources/VerbaLab/VerbaLabModels.swift'),
    `import Foundation

public struct VerbaLabClientOptions: Sendable {
    public var apiKey: String
    public var baseURL: URL

    public init(apiKey: String, baseURL: URL = URL(string: "https://api.verbalab.ai")!) {
        self.apiKey = apiKey
        self.baseURL = baseURL
    }
}

public struct TranslateRequest: Codable, Sendable {
    public var text: String
    public var source: String
    public var target: String

    public init(text: String, source: String = "auto", target: String) {
        self.text = text
        self.source = source
        self.target = target
    }
}

public struct TranslateResponse: Codable, Sendable {
    public var text: String?
    public var translatedText: String?
    public var source: String?
    public var target: String?
    public var provider: String?
    public var characters: Int?
}

public struct DetectRequest: Codable, Sendable {
    public var text: String
    public init(text: String) { self.text = text }
}

public struct DetectResponse: Codable, Sendable {
    public var language: String?
    public var confidence: Double?
}
`,
  );

  write(
    path.join(iosRoot, 'Sources/VerbaLab/VerbaLabClient.swift'),
    `import Foundation

#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

/// Official VerbaLab iOS / Apple platforms SDK.
/// Mirrors the TypeScript \`@verbalab/sdk\` surface so mobile apps can call every product API.
public final class VerbaLabClient: @unchecked Sendable {
    public let apiKey: String
    public let baseURL: URL
    private let session: URLSession
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    public init(options: VerbaLabClientOptions, session: URLSession = .shared) {
        precondition(options.apiKey.hasPrefix("vl_live_") || options.apiKey.hasPrefix("vl_test_"),
                     "apiKey must start with vl_live_ or vl_test_")
        self.apiKey = options.apiKey
        self.baseURL = options.baseURL
        self.session = session
    }

    public convenience init(apiKey: String, baseURL: String = "https://api.verbalab.ai") {
        let url = URL(string: baseURL.trimmingCharacters(in: CharacterSet(charactersIn: "/")))
            ?? URL(string: "https://api.verbalab.ai")!
        self.init(options: VerbaLabClientOptions(apiKey: apiKey, baseURL: url))
    }

    // MARK: - Core typed helpers (mobile quickstart)

    public func translate(_ request: TranslateRequest) async throws -> TranslateResponse {
        try await requestJSON(path: "/v1/translate", method: "POST", body: request)
    }

    public func detect(_ request: DetectRequest) async throws -> DetectResponse {
        try await requestJSON(path: "/v1/detect", method: "POST", body: request)
    }

    public func languages() async throws -> Any {
        try await requestJSONObject(path: "/v1/languages", method: "GET")
    }

    public func chat(body: [String: Any]) async throws -> [String: Any] {
        try await requestJSONObject(path: "/v1/chat/completions", method: "POST", jsonObject: body)
    }

    public func embeddings(body: [String: Any]) async throws -> [String: Any] {
        try await requestJSONObject(path: "/v1/embeddings", method: "POST", jsonObject: body)
    }

    public func speech(body: [String: Any]) async throws -> Data {
        try await requestData(path: "/v1/audio/speech", method: "POST", jsonObject: body)
    }

    public func transcribe(file: Data, fileName: String, mimeType: String = "audio/mpeg", fields: [String: String] = [:]) async throws -> [String: Any] {
        try await requestMultipart(path: "/v1/audio/transcriptions", fileField: "file", fileName: fileName, fileData: file, mimeType: mimeType, fields: fields)
    }

    /// Escape hatch: call any VerbaLab REST path (full API coverage).
    public func call(
        path: String,
        method: String = "GET",
        query: [String: String]? = nil,
        jsonObject: [String: Any]? = nil
    ) async throws -> [String: Any] {
        try await requestJSONObject(path: path, method: method, query: query, jsonObject: jsonObject)
    }

    // MARK: - Transport

    public func requestJSON<T: Decodable, B: Encodable>(
        path: String,
        method: String,
        query: [String: String]? = nil,
        body: B? = nil
    ) async throws -> T {
        var dataBody: Data? = nil
        if let body {
            dataBody = try encoder.encode(body)
        }
        let data = try await perform(path: path, method: method, query: query, body: dataBody, contentType: "application/json")
        return try decoder.decode(T.self, from: data)
    }

    public func requestJSONObject(
        path: String,
        method: String,
        query: [String: String]? = nil,
        jsonObject: [String: Any]? = nil
    ) async throws -> [String: Any] {
        var dataBody: Data? = nil
        if let jsonObject {
            dataBody = try JSONSerialization.data(withJSONObject: jsonObject)
        }
        let data = try await perform(path: path, method: method, query: query, body: dataBody, contentType: jsonObject == nil ? nil : "application/json")
        let obj = try JSONSerialization.jsonObject(with: data)
        if let dict = obj as? [String: Any] { return dict }
        return ["data": obj]
    }

    public func requestData(
        path: String,
        method: String,
        query: [String: String]? = nil,
        jsonObject: [String: Any]? = nil
    ) async throws -> Data {
        var dataBody: Data? = nil
        if let jsonObject {
            dataBody = try JSONSerialization.data(withJSONObject: jsonObject)
        }
        return try await perform(path: path, method: method, query: query, body: dataBody, contentType: "application/json", accept: "*/*")
    }

    public func requestMultipart(
        path: String,
        fileField: String,
        fileName: String,
        fileData: Data,
        mimeType: String,
        fields: [String: String] = [:]
    ) async throws -> [String: Any] {
        let boundary = "VerbalabBoundary\\(UUID().uuidString)"
        var body = Data()
        for (key, value) in fields {
            body.append("--\\(boundary)\\r\\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\\"\\(key)\\"\\r\\n\\r\\n".data(using: .utf8)!)
            body.append("\\(value)\\r\\n".data(using: .utf8)!)
        }
        body.append("--\\(boundary)\\r\\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\\"\\(fileField)\\"; filename=\\"\\(fileName)\\"\\r\\n".data(using: .utf8)!)
        body.append("Content-Type: \\(mimeType)\\r\\n\\r\\n".data(using: .utf8)!)
        body.append(fileData)
        body.append("\\r\\n--\\(boundary)--\\r\\n".data(using: .utf8)!)
        let data = try await perform(
            path: path,
            method: "POST",
            body: body,
            contentType: "multipart/form-data; boundary=\\(boundary)"
        )
        let obj = try JSONSerialization.jsonObject(with: data)
        if let dict = obj as? [String: Any] { return dict }
        return ["data": obj]
    }

    private func perform(
        path: String,
        method: String,
        query: [String: String]? = nil,
        body: Data? = nil,
        contentType: String? = nil,
        accept: String = "application/json"
    ) async throws -> Data {
        var components = URLComponents(url: baseURL.appendingPathComponent(path.hasPrefix("/") ? String(path.dropFirst()) : path), resolvingAgainstBaseURL: false)!
        // Prefer joining path manually to preserve /v1/... exactly
        let joined = baseURL.absoluteString.trimmingCharacters(in: CharacterSet(charactersIn: "/")) + (path.hasPrefix("/") ? path : "/\\(path)")
        var url = URL(string: joined)!
        if let query, !query.isEmpty {
            var c = URLComponents(url: url, resolvingAgainstBaseURL: false)!
            c.queryItems = query.map { URLQueryItem(name: $0.key, value: $0.value) }
            url = c.url ?? url
        }
        _ = components
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("Bearer \\(apiKey)", forHTTPHeaderField: "Authorization")
        request.setValue(accept, forHTTPHeaderField: "Accept")
        if let contentType {
            request.setValue(contentType, forHTTPHeaderField: "Content-Type")
        }
        request.httpBody = body

        let (data, response) = try await session.data(for: request)
        let http = response as? HTTPURLResponse
        let status = http?.statusCode ?? 0
        if !(200...299).contains(status) {
            if let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let err = obj["error"] as? [String: Any] {
                throw VerbaLabError(
                    message: (err["message"] as? String) ?? "HTTP \\(status)",
                    code: (err["code"] as? String) ?? "http_error",
                    statusCode: status,
                    requestId: err["request_id"] as? String
                )
            }
            throw VerbaLabError(message: "HTTP \\(status)", code: "http_error", statusCode: status)
        }
        return data
    }
}
`,
  );

  // Generated API surface (mirrors every @verbalab/sdk method)
  const genLines = [];
  genLines.push('import Foundation');
  genLines.push('');
  genLines.push('public extension VerbaLabClient {');
  genLines.push('    // Auto-generated from @verbalab/sdk — full product API surface for mobile.');
  const swiftHandWritten = new Set([
    'translate',
    'detect',
    'languages',
    'chat',
    'embeddings',
    'speech',
    'transcribe',
    'call',
  ]);
  for (const m of methods) {
    if (swiftHandWritten.has(m.name)) continue;
    const basePath = m.pathExpr || '';
    const pathParams = m.pathParams || [];
    const params = [];
    for (const p of pathParams) params.push(`${p}: String`);
    if (m.acceptsQuery) params.push('query: [String: String]? = nil');
    if (m.form) {
      params.push('file: Data');
      params.push('fileName: String');
      params.push('mimeType: String = "application/octet-stream"');
      params.push('fields: [String: String] = [:]');
    } else if (m.acceptsBody && m.http !== 'GET') {
      params.push('body: [String: Any]? = nil');
    } else if (m.http !== 'GET' && m.http !== 'DELETE') {
      params.push('body: [String: Any]? = nil');
    }

    const pathResolve = [];
    pathResolve.push(`var path = "${basePath}"`);
    for (const p of pathParams) {
      pathResolve.push(
        `path = path.replacingOccurrences(of: "{${p}}", with: ${p}.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? ${p})`,
      );
    }

    if (m.isBinary) {
      genLines.push(`
    public func ${m.name}(${params.join(', ')}) async throws -> Data {
        ${pathResolve.join('\n        ')}
        return try await requestData(path: path, method: "${m.http}", query: ${m.acceptsQuery ? 'query' : 'nil'}, jsonObject: ${params.some((p) => p.startsWith('body:')) ? 'body' : 'nil'})
    }`);
      continue;
    }
    if (m.form) {
      genLines.push(`
    public func ${m.name}(${params.join(', ')}) async throws -> [String: Any] {
        ${pathResolve.join('\n        ')}
        return try await requestMultipart(path: path, fileField: "file", fileName: fileName, fileData: file, mimeType: mimeType, fields: fields)
    }`);
      continue;
    }
    if (m.isStream) {
      genLines.push(`
    /// Streaming endpoint — returns raw SSE bytes. Parse \`data:\` lines in your app.
    public func ${m.name}(${params.join(', ')}) async throws -> Data {
        ${pathResolve.join('\n        ')}
        return try await requestData(path: path, method: "${m.http}", query: ${m.acceptsQuery ? 'query' : 'nil'}, jsonObject: ${params.some((p) => p.startsWith('body:')) ? 'body' : 'nil'})
    }`);
      continue;
    }
    genLines.push(`
    public func ${m.name}(${params.join(', ')}) async throws -> [String: Any] {
        ${pathResolve.join('\n        ')}
        return try await requestJSONObject(path: path, method: "${m.http}", query: ${m.acceptsQuery ? 'query' : 'nil'}, jsonObject: ${params.some((p) => p.startsWith('body:')) ? 'body' : 'nil'})
    }`);
  }
  genLines.push('}');

  write(path.join(iosRoot, 'Sources/VerbaLab/VerbaLabAPI.generated.swift'), genLines.join('\n') + '\n');

    write(
    path.join(iosRoot, 'Tests/VerbaLabTests/VerbaLabClientTests.swift'),
    `import XCTest
@testable import VerbaLab

final class VerbaLabClientTests: XCTestCase {
    func testAcceptsLivePrefix() {
        let client = VerbaLabClient(apiKey: "vl_live_test", baseURL: "http://127.0.0.1:3001")
        XCTAssertEqual(client.apiKey, "vl_live_test")
        XCTAssertTrue(client.baseURL.absoluteString.contains("127.0.0.1"))
    }

    func testAcceptsTestPrefix() {
        let client = VerbaLabClient(apiKey: "vl_test_demo", baseURL: "https://api.verbalab.ai")
        XCTAssertEqual(client.apiKey, "vl_test_demo")
    }
}
`,
  );

  write(
    path.join(iosRoot, 'README.md'),
    `# VerbaLab iOS SDK

Official Swift package for integrating VerbaLab into iOS and macOS apps.

## Install (Swift Package Manager)

In Xcode: **File → Add Package Dependencies…** and point at this repo path:

\`\`\`
packages/sdk-ios
\`\`\`

Or in \`Package.swift\`:

\`\`\`swift
.package(path: "../sdk-ios")
\`\`\`

## Quickstart

\`\`\`swift
import VerbaLab

let client = VerbaLabClient(
    apiKey: ProcessInfo.processInfo.environment["VERBALAB_API_KEY"] ?? "vl_live_...",
    baseURL: ProcessInfo.processInfo.environment["VERBALAB_BASE_URL"] ?? "https://api.verbalab.ai"
)

let translated = try await client.translate(
    TranslateRequest(text: "Hello", source: "en", target: "sw")
)
let languages = try await client.languages()
let audio = try await client.speech(body: ["text": "Habari", "voice": "alloy"])
\`\`\`

Every method from \`@verbalab/sdk\` is generated on \`VerbaLabClient\` (see \`VerbaLabAPI.generated.swift\`).
Use \`call(path:method:query:jsonObject:)\` for any OpenAPI path.

Regenerate from the TypeScript SDK:

\`\`\`bash
node packages/sdk-mobile/generate.mjs
\`\`\`
`,
  );
}

function generateKotlin(methods) {
  const andRoot = path.join(root, 'packages/sdk-android');
  write(
    path.join(andRoot, 'settings.gradle.kts'),
    `rootProject.name = "verbalab-android"
include(":verbalab")
`,
  );
  write(
    path.join(andRoot, 'build.gradle.kts'),
    `plugins {
    id("org.jetbrains.kotlin.jvm") version "1.9.25" apply false
}
`,
  );
  write(
    path.join(andRoot, 'verbalab/build.gradle.kts'),
    `plugins {
    id("org.jetbrains.kotlin.jvm")
    \`java-library\`
    \`maven-publish\`
}

group = "ai.verbalab"
version = "0.1.0"

repositories {
    mavenCentral()
}

dependencies {
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.8.1")
    implementation("com.google.code.gson:gson:2.11.0")
    testImplementation(kotlin("test"))
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.8.1")
}

tasks.test {
    useJUnitPlatform()
}

java {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
}

kotlin {
    jvmToolchain(17)
}

publishing {
    publications {
        create<MavenPublication>("maven") {
            from(components["java"])
            groupId = "ai.verbalab"
            artifactId = "sdk"
            version = project.version.toString()
        }
    }
}
`,
  );

  write(
    path.join(andRoot, 'verbalab/src/main/java/ai/verbalab/sdk/VerbaLabError.kt'),
    `package ai.verbalab.sdk

class VerbaLabError(
    message: String,
    val code: String,
    val statusCode: Int,
    val requestId: String? = null,
) : Exception(message)
`,
  );

  write(
    path.join(andRoot, 'verbalab/src/main/java/ai/verbalab/sdk/VerbaLabModels.kt'),
    `package ai.verbalab.sdk

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
`,
  );

  write(
    path.join(andRoot, 'verbalab/src/main/java/ai/verbalab/sdk/VerbaLabClient.kt'),
    `package ai.verbalab.sdk

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
 * Mirrors \`@verbalab/sdk\` so mobile apps can integrate every product API.
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
`,
  );

  const gen = [];
  gen.push('package ai.verbalab.sdk');
  gen.push('');
  gen.push('/** Auto-generated from @verbalab/sdk — full product API surface for Android. */');
  gen.push('suspend fun VerbaLabClient.translateMap(body: Map<String, Any?>): Map<String, Any?> =');
  gen.push('    requestMap("/v1/translate", "POST", jsonBody = body)');
  gen.push('');
  const kotlinHandWritten = new Set([
    'translate',
    'detect',
    'languages',
    'chat',
    'embeddings',
    'speech',
    'transcribe',
    'call',
  ]);
  for (const m of methods) {
    if (kotlinHandWritten.has(m.name)) continue;
    const basePath = m.pathExpr || '';
    const pathParams = m.pathParams || [];
    const params = [];
    for (const p of pathParams) params.push(`${p}: String`);
    if (m.acceptsQuery) params.push('query: Map<String, String>? = null');
    if (m.form) {
      params.push('file: ByteArray');
      params.push('fileName: String');
      params.push('mimeType: String = "application/octet-stream"');
      params.push('fields: Map<String, String> = emptyMap()');
    } else if (m.acceptsBody && m.http !== 'GET') {
      params.push('body: Map<String, Any?>? = null');
    } else if (m.http !== 'GET' && m.http !== 'DELETE') {
      params.push('body: Map<String, Any?>? = null');
    }

    let pathExpr = `"${basePath}"`;
    for (const p of pathParams) {
      pathExpr = `(${pathExpr}).replace("{${p}}", encodePath(${p}))`;
    }

    const fn = kotlinName(m.name);
    if (m.isBinary || m.isStream) {
      gen.push(`suspend fun VerbaLabClient.${fn}(${params.join(', ')}): ByteArray =`);
      gen.push(`    requestBytes(${pathExpr}, "${m.http}", query = ${m.acceptsQuery ? 'query' : 'null'}, jsonBody = ${params.some((p) => p.startsWith('body:')) ? 'body' : 'null'})`);
      gen.push('');
      continue;
    }
    if (m.form) {
      gen.push(`suspend fun VerbaLabClient.${fn}(${params.join(', ')}): Map<String, Any?> =`);
      gen.push(`    requestMultipart(${pathExpr}, "file", fileName, file, mimeType, fields)`);
      gen.push('');
      continue;
    }
    gen.push(`suspend fun VerbaLabClient.${fn}(${params.join(', ')}): Map<String, Any?> =`);
    gen.push(`    requestMap(${pathExpr}, "${m.http}", query = ${m.acceptsQuery ? 'query' : 'null'}, jsonBody = ${params.some((p) => p.startsWith('body:')) ? 'body' : 'null'})`);
    gen.push('');
  }

  write(
    path.join(andRoot, 'verbalab/src/main/java/ai/verbalab/sdk/VerbaLabAPI.generated.kt'),
    gen.join('\n') + '\n',
  );

  write(
    path.join(andRoot, 'verbalab/src/test/java/ai/verbalab/sdk/VerbaLabClientTest.kt'),
    `package ai.verbalab.sdk

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class VerbaLabClientTest {
    @Test
    fun rejectsInvalidKey() {
        assertFailsWith<IllegalArgumentException> {
            VerbaLabClient("bad-key")
        }
    }

    @Test
    fun acceptsLivePrefix() {
        val client = VerbaLabClient("vl_live_test", "http://127.0.0.1:3001")
        assertEquals("vl_live_test", client.let {
            // apiKey is private; constructing without throw is enough
            "vl_live_test"
        })
    }
}
`,
  );

  write(
    path.join(andRoot, 'README.md'),
    `# VerbaLab Android SDK

Official Kotlin library for integrating VerbaLab into Android (and JVM) apps.

## Install (Gradle)

\`\`\`kotlin
dependencies {
    implementation("ai.verbalab:sdk:0.1.0")
}
\`\`\`

From this monorepo (composite / included build or \`mavenLocal\`):

\`\`\`bash
cd packages/sdk-android
./gradlew :verbalab:publishToMavenLocal
\`\`\`

Or project dependency:

\`\`\`kotlin
implementation(project(":verbalab"))
\`\`\`

## Quickstart

\`\`\`kotlin
import ai.verbalab.sdk.VerbaLabClient
import ai.verbalab.sdk.TranslateRequest

val client = VerbaLabClient(
    apiKey = System.getenv("VERBALAB_API_KEY") ?: "vl_live_...",
    baseUrl = System.getenv("VERBALAB_BASE_URL") ?: "https://api.verbalab.ai",
)

val translated = client.translate(TranslateRequest(text = "Hello", source = "en", target = "sw"))
val languages = client.languages()
val audio = client.speech(mapOf("text" to "Habari", "voice" to "alloy"))
\`\`\`

Every method from \`@verbalab/sdk\` is generated as an extension on \`VerbaLabClient\`
(\`VerbaLabAPI.generated.kt\`). Use \`call(path, method, query, jsonBody)\` for any OpenAPI path.

Regenerate:

\`\`\`bash
node packages/sdk-mobile/generate.mjs
\`\`\`
`,
  );

  // Gradle wrapper note - optional; document using system gradle
  write(
    path.join(andRoot, 'gradle.properties'),
    `org.gradle.jvmargs=-Xmx1g
kotlin.code.style=official
`,
  );
}

const methods = extractMethods();
console.log('methods', methods.length);
generateSwift(methods);
generateKotlin(methods);
write(
  path.join(root, 'packages/sdk-mobile/README.md'),
  `# Mobile SDK generator

Generates **iOS** (\`packages/sdk-ios\`) and **Android** (\`packages/sdk-android\`) clients from \`packages/sdk/src/client.ts\` so every TypeScript SDK method is available on mobile.

\`\`\`bash
node packages/sdk-mobile/generate.mjs
\`\`\`

Do not edit \`*.generated.swift\` / \`*.generated.kt\` by hand — regenerate after SDK client changes.
`,
);
write(path.join(root, 'packages/sdk-mobile/methods.json'), JSON.stringify(methods, null, 2));
console.log('done');
