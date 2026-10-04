import Foundation

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
