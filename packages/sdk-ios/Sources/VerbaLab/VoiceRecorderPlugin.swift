import Foundation

#if canImport(AVFoundation)
import AVFoundation
#endif

/// Phone plugin: record voice on device, upload to VerbaLab Echo STT, return transcript text.
public final class VoiceRecorderPlugin: @unchecked Sendable {
    public let client: VerbaLabClient
    public private(set) var sessionId: String?
    public private(set) var tier: String
    public private(set) var language: String?

    #if canImport(AVFoundation)
    private var audioRecorder: AVAudioRecorder?
    private var recordingURL: URL?
    #endif

    public init(client: VerbaLabClient, tier: String = "standard") {
        self.client = client
        self.tier = tier
    }

    /// Open a cloud recording session (meters under field-notes-stt SKU).
    @discardableResult
    public func startSession(language: String? = nil, platform: String = "ios", label: String? = nil) async throws -> [String: Any] {
        var body: [String: Any] = [
            "platform": platform,
            "tier": tier,
        ]
        if let language { body["language"] = language }
        if let label { body["label"] = label }
        let res = try await client.call(path: "/v1/voice-recorder-plugin/sessions", method: "POST", jsonObject: body)
        if let session = res["session"] as? [String: Any], let id = session["id"] as? String {
            self.sessionId = id
            self.language = language
        }
        return res
    }

    /// Begin local microphone capture (iOS). Call `stopAndTranscribe()` when done.
    public func beginRecording() throws {
        #if canImport(AVFoundation)
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker])
        try session.setActive(true)
        let url = FileManager.default.temporaryDirectory.appendingPathComponent("verbalab-rec-\(UUID().uuidString).m4a")
        let settings: [String: Any] = [
            AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
            AVSampleRateKey: 16000,
            AVNumberOfChannelsKey: 1,
            AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue,
        ]
        let recorder = try AVAudioRecorder(url: url, settings: settings)
        recorder.prepareToRecord()
        guard recorder.record() else {
            throw VerbaLabError(message: "Could not start recorder", code: "recorder_error", statusCode: 500)
        }
        self.audioRecorder = recorder
        self.recordingURL = url
        #else
        throw VerbaLabError(message: "AVFoundation unavailable — pass audio bytes to transcribe(file:)", code: "unsupported", statusCode: 501)
        #endif
    }

    /// Stop local recording and upload for transcription.
    public func stopAndTranscribe(title: String? = nil) async throws -> [String: Any] {
        #if canImport(AVFoundation)
        audioRecorder?.stop()
        defer {
            audioRecorder = nil
        }
        guard let url = recordingURL else {
            throw VerbaLabError(message: "No active recording", code: "validation_error", statusCode: 400)
        }
        let data = try Data(contentsOf: url)
        return try await transcribe(file: data, fileName: url.lastPathComponent, mimeType: "audio/m4a", title: title)
        #else
        throw VerbaLabError(message: "AVFoundation unavailable", code: "unsupported", statusCode: 501)
        #endif
    }

    /// Upload an already-recorded clip (works on all Apple platforms with audio bytes).
    public func transcribe(
        file: Data,
        fileName: String = "recording.m4a",
        mimeType: String = "audio/m4a",
        title: String? = nil,
        language: String? = nil
    ) async throws -> [String: Any] {
        if sessionId == nil {
            _ = try await startSession(language: language ?? self.language, platform: "ios")
        }
        var fields: [String: String] = [:]
        if let sessionId { fields["sessionId"] = sessionId }
        if let language = language ?? self.language { fields["language"] = language }
        fields["tier"] = tier
        if let title { fields["title"] = title }
        return try await client.requestMultipart(
            path: "/v1/voice-recorder-plugin/transcribe",
            fileField: "file",
            fileName: fileName,
            fileData: file,
            mimeType: mimeType,
            fields: fields
        )
    }

    public func finalize() async throws -> [String: Any] {
        guard let sessionId else {
            throw VerbaLabError(message: "sessionId missing — startSession first", code: "validation_error", statusCode: 400)
        }
        return try await client.call(
            path: "/v1/voice-recorder-plugin/finalize",
            method: "POST",
            jsonObject: ["sessionId": sessionId]
        )
    }

    public func installManifest() async throws -> [String: Any] {
        try await client.call(path: "/v1/voice-recorder-plugin/manifest", method: "GET", query: ["platform": "ios"])
    }
}
