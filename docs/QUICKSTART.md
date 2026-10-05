# VerbaLab API quickstart (60 seconds)

Get a first translate + first TTS call working with a Free / test API key.

## 1. Get a key

1. Sign up at `/sign-up` (or use the welcome email from org bootstrap).
2. Open **API keys** (`/keys`) and copy a `vl_test_…` (sandbox) or `vl_live_…` key.
3. Set:

```bash
export VERBALAB_API_KEY=vl_test_…
export VERBALAB_BASE_URL=https://api.your-domain.com   # or http://localhost:3001
```

## 2. Translate (cURL)

```bash
curl -sS "$VERBALAB_BASE_URL/v1/translate" \
  -H "Authorization: Bearer $VERBALAB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello","source":"en","target":"sw"}'
```

Try global underserved targets too: `th`, `vi`, `hi`, `ht`, `qu`.

## 3. Text to speech (cURL)

```bash
curl -sS "$VERBALAB_BASE_URL/v1/audio/speech" \
  -H "Authorization: Bearer $VERBALAB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text":"Habari","voice":"alloy"}' \
  --output hello.mp3
```

## 4. TypeScript SDK

```bash
pnpm add @verbalab/sdk
```

```ts
import { VerbaLab } from '@verbalab/sdk';

const client = new VerbaLab({
  apiKey: process.env.VERBALAB_API_KEY!,
  baseUrl: process.env.VERBALAB_BASE_URL,
});

const mt = await client.translate({ text: 'Hello', source: 'en', target: 'sw' });
console.log(mt.text);

const speech = await client.speech({ text: 'Habari', voice: 'alloy' });
// speech.audio → Uint8Array
```

## 5. Python (requests)

```python
import os, requests

base = os.environ["VERBALAB_BASE_URL"]
headers = {"Authorization": f"Bearer {os.environ['VERBALAB_API_KEY']}"}

r = requests.post(f"{base}/v1/translate", headers=headers, json={
    "text": "Hello", "source": "en", "target": "th",
})
print(r.json())

audio = requests.post(f"{base}/v1/audio/speech", headers=headers, json={
    "text": "Sawasdee", "voice": "alloy",
})
open("hello.mp3", "wb").write(audio.content)
```

## 6. Long jobs + webhooks

```bash
curl -sS "$VERBALAB_BASE_URL/v1/jobs" \
  -H "Authorization: Bearer $VERBALAB_API_KEY" \
  -H "Idempotency-Key: demo-dub-1" \
  -H "Content-Type: application/json" \
  -d '{"type":"dub","input":{"text":"Hello citizens","targetLanguage":"sw"},"webhookUrl":"https://example.com/hooks/verbalab"}'
```

Poll `GET /v1/jobs/:id`. Org-level partner webhooks: `PUT /v1/partner-webhooks` (Clerk session).

## Next

- OpenAPI: `/docs` · explorer `/docs/openapi`
- Coverage matrix: `GET /v1/coverage`
- Credentials / Fly deploy: `docs/CREDENTIALS.md`, `infra/DEPLOY.md`
