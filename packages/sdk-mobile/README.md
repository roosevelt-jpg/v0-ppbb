# Mobile SDK generator

Generates **iOS** (`packages/sdk-ios`) and **Android** (`packages/sdk-android`) clients from `packages/sdk/src/client.ts` so every TypeScript SDK method is available on mobile.

```bash
node packages/sdk-mobile/generate.mjs
```

Do not edit `*.generated.swift` / `*.generated.kt` by hand — regenerate after SDK client changes.
