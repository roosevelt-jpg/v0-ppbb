# Partner webhooks

Signed outbound HTTPS events for integrating backends.

## Configure

1. Clerk owner/admin session → `PUT /v1/partner-webhooks` with `{ "partnerWebhookUrl": "https://…" }`
2. Reveal signing secret: `POST /v1/webhooks/signing-secret`
3. Optional per-job URL on `POST /v1/jobs` (`webhookUrl`)

## Headers

| Header | Value |
| --- | --- |
| `X-VerbaLab-Timestamp` | Unix seconds |
| `X-VerbaLab-Signature` | `v1=<hex hmac-sha256 of `${timestamp}.${body}`>` |
| `Content-Type` | `application/json` |

Secret format: `whsec_…` (org-scoped).

## Events

| Event | When |
| --- | --- |
| `organization.bootstrapped` | Clerk webhook / first org bootstrap |
| `job.succeeded` / `job.failed` | Async job finished |
| `credits.low` | Usage hit 80% or 100% of monthly credits |
| `api_key.revoked` | API key revoked |

## Verify (Node)

```ts
import { createHmac, timingSafeEqual } from 'crypto';

function verify(secret: string, timestamp: string, body: string, signature: string) {
  const expected = 'v1=' + createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
```
