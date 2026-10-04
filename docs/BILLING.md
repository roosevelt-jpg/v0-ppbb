# Billing & usage (ElevenLabs-mirrored)

VerbaLab subscription billing uses a **shared monthly credit pool** across products, structured like [ElevenLabs Creative Platform pricing](https://elevenlabs.io/pricing).

## Plans

| Plan | USD / mo | Credits / mo | Seats | Notes |
|---|---|---|---|---|
| Free | $0 | 10,000 | 1 | Non-commercial · 3 design voice slots |
| Starter | $5 | 30,000 | 1 | Commercial + Instant Voice Cloning |
| Creator | $22 | 121,000 | 1 | Professional Voice Cloning |
| Pro | $99 | 600,000 | 1 | 44.1kHz PCM · production limits |
| Scale | $330 | 1,800,000 | 3 | Team collaboration |
| Business | $1,320 | 6,000,000 | 10 | Low-latency TTS path |
| Enterprise | Custom | Custom | Custom | BAA / SSO / elevated concurrency |

Annual billing policy parity: ~2 months free (10× monthly).

## Credit costs (shared pool)

| Product | Credits |
|---|---|
| TTS (Multilingual) | 1 / character |
| TTS Flash/Turbo API | 0.5 / character |
| Speech to Text | 330 / minute |
| Realtime STT | ~585 / minute |
| Translate | 1 / character |
| AI Music | 900 / minute |
| Sound Effects | 200 / generation |
| Voice Changer / Isolator | 1,000 / minute |
| Dubbing (auto + watermark) | 2,000 / minute |
| Dubbing Studio (no watermark) | 10,000 / minute |

API USD pay-as-you-go reference (Model Economy): TTS $0.05–$0.10 / 1k chars · STT $0.22 / hour · Music $0.15 / minute.

## Stripe env

```bash
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_STARTER=price_...
STRIPE_PRICE_ID_CREATOR=price_...
STRIPE_PRICE_ID_PRO=price_...          # required minimum for checkout
STRIPE_PRICE_ID_SCALE=price_...
STRIPE_PRICE_ID_BUSINESS=price_...
BILLING_SUCCESS_URL=http://localhost:3000/billing?checkout=success
BILLING_CANCEL_URL=http://localhost:3000/billing?checkout=cancel
```

## API

| Method | Path | Notes |
|---|---|---|
| `GET` | `/v1/billing/plans` | Public catalog + credit rates |
| `GET` | `/v1/billing/summary` | Org plan, credits used/remaining |
| `POST` | `/v1/billing/checkout` | `{ "planId": "pro" }` |

Quota enforcement: `402 quota_exceeded` when monthly credits are exhausted. Paid commercial features require **Starter+**.

## Console

`/billing`

## Related

- ADR: `docs/adr/0004-stripe-billing.md`
- Model Economy: `docs/MODEL_ECONOMY.md`
