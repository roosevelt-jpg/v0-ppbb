/** Public SDK/CLI catalog for docs and developer hub (hand-maintained with package versions). */
export function sdkCatalog() {
  return {
    typescript: {
      name: '@verbalab/sdk',
      version: '0.1.0',
      install: 'pnpm add @verbalab/sdk',
      private: true,
      note: 'Official TypeScript/JavaScript client for web, Node, and React Native.',
    },
    ios: {
      name: 'VerbaLab (Swift)',
      version: '0.1.0',
      install: 'Xcode → Add Package → packages/sdk-ios',
      path: 'packages/sdk-ios',
      note: 'Swift Package Manager client for iOS/macOS. Full API surface generated from @verbalab/sdk.',
    },
    android: {
      name: 'ai.verbalab:sdk',
      version: '0.1.0',
      install: 'implementation("ai.verbalab:sdk:0.1.0")',
      path: 'packages/sdk-android',
      note: 'Kotlin/OkHttp client for Android and JVM. Full API surface generated from @verbalab/sdk.',
    },
    cli: {
      name: '@verbalab/cli',
      version: '0.1.0',
      bin: 'verbalab',
      install: 'pnpm add -g @verbalab/cli',
      commands: ['translate', 'languages', 'whoami'],
      note: 'Thin wrapper over @verbalab/sdk.',
    },
    auth: {
      livePrefix: 'vl_live_',
      testPrefix: 'vl_test_',
    },
  };
}
