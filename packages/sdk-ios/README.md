# VerbaLab iOS SDK

Official Swift package for integrating VerbaLab into iOS and macOS apps.

## Install (Swift Package Manager)

In Xcode: **File → Add Package Dependencies…** and point at this repo path:

```
packages/sdk-ios
```

Or in `Package.swift`:

```swift
.package(path: "../sdk-ios")
```

## Quickstart

```swift
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
```

Every method from `@verbalab/sdk` is generated on `VerbaLabClient` (see `VerbaLabAPI.generated.swift`).
Use `call(path:method:query:jsonObject:)` for any OpenAPI path.

Regenerate from the TypeScript SDK:

```bash
node packages/sdk-mobile/generate.mjs
```
