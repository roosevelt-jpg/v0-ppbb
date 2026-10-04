# VerbaLab Android SDK

Official Kotlin library for integrating VerbaLab into Android (and JVM) apps.

## Install (Gradle)

```kotlin
dependencies {
    implementation("ai.verbalab:sdk:0.1.0")
}
```

From this monorepo (composite / included build or `mavenLocal`):

```bash
cd packages/sdk-android
./gradlew :verbalab:publishToMavenLocal
```

Or project dependency:

```kotlin
implementation(project(":verbalab"))
```

## Quickstart

```kotlin
import ai.verbalab.sdk.VerbaLabClient
import ai.verbalab.sdk.TranslateRequest

val client = VerbaLabClient(
    apiKey = System.getenv("VERBALAB_API_KEY") ?: "vl_live_...",
    baseUrl = System.getenv("VERBALAB_BASE_URL") ?: "https://api.verbalab.ai",
)

val translated = client.translate(TranslateRequest(text = "Hello", source = "en", target = "sw"))
val languages = client.languages()
val audio = client.speech(mapOf("text" to "Habari", "voice" to "alloy"))
```

Every method from `@verbalab/sdk` is generated as an extension on `VerbaLabClient`
(`VerbaLabAPI.generated.kt`). Use `call(path, method, query, jsonBody)` for any OpenAPI path.

Regenerate:

```bash
node packages/sdk-mobile/generate.mjs
```
