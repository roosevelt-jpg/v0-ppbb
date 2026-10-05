import Foundation

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
