# @verbalab/sdk

TypeScript client for the VerbaLab API.

**60-second path:** get a Free/`vl_test_` key → translate → TTS. Full copy: [`docs/QUICKSTART.md`](../../docs/QUICKSTART.md) or `/docs/quickstart`.

Mobile developers: use the generated **iOS** (`packages/sdk-ios`) and **Android** (`packages/sdk-android`) SDKs — regenerate with `node packages/sdk-mobile/generate.mjs` after client changes.

```bash
pnpm add @verbalab/sdk
export VERBALAB_API_KEY=vl_test_…
export VERBALAB_BASE_URL=https://api.your-domain.com   # or http://localhost:3001
```

```ts
import { VerbaLab } from '@verbalab/sdk';

const client = new VerbaLab({
  apiKey: process.env.VERBALAB_API_KEY!,
  baseUrl: process.env.VERBALAB_BASE_URL ?? 'http://localhost:3001',
});

const result = await client.translate({
  text: 'Hello',
  source: 'en',
  target: 'sw',
});
console.log(result.text);

const speech = await client.speech({ text: 'Habari', voice: 'alloy' });
// speech.audio is Uint8Array

await client.detect({ text: 'Habari' });
await client.createJob({
  type: 'batch_translate',
  input: { source: 'en', target: 'sw', items: [{ id: '1', text: 'Hi' }] },
});
// Long jobs also accept type: 'dub' | 'clone' + Idempotency-Key (see docs/QUICKSTART.md)
```

Also: `chat`, `embeddings`, `languages`, `ocr`, `transcribe`, `interpret`, `voices`, `listJobs`, `getJob`, `regions`, `locales`, `localize`.

See repo `.env.example` for API credentials. Partner webhooks: [`docs/PARTNER_WEBHOOKS.md`](../../docs/PARTNER_WEBHOOKS.md).
