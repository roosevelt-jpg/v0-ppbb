import Foundation

#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

/// Official VerbaLab iOS / Apple platforms SDK.
/// Mirrors the TypeScript `@verbalab/sdk` surface so mobile apps can call every product API.
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
        let boundary = "VerbalabBoundary\(UUID().uuidString)"
        var body = Data()
        for (key, value) in fields {
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"\(key)\"\r\n\r\n".data(using: .utf8)!)
            body.append("\(value)\r\n".data(using: .utf8)!)
        }
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"\(fileField)\"; filename=\"\(fileName)\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: \(mimeType)\r\n\r\n".data(using: .utf8)!)
        body.append(fileData)
        body.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)
        let data = try await perform(
            path: path,
            method: "POST",
            body: body,
            contentType: "multipart/form-data; boundary=\(boundary)"
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
        let joined = baseURL.absoluteString.trimmingCharacters(in: CharacterSet(charactersIn: "/")) + (path.hasPrefix("/") ? path : "/\(path)")
        var url = URL(string: joined)!
        if let query, !query.isEmpty {
            var c = URLComponents(url: url, resolvingAgainstBaseURL: false)!
            c.queryItems = query.map { URLQueryItem(name: $0.key, value: $0.value) }
            url = c.url ?? url
        }
        _ = components
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
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
                    message: (err["message"] as? String) ?? "HTTP \(status)",
                    code: (err["code"] as? String) ?? "http_error",
                    statusCode: status,
                    requestId: err["request_id"] as? String
                )
            }
            throw VerbaLabError(message: "HTTP \(status)", code: "http_error", statusCode: status)
        }
        return data
    }
}
