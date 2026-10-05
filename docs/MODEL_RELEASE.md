# Model Release Pipeline

Versioned **VerbaLab African-focus SKUs** with quality cards, African quality GA gates, usage-driven priority, and GPU budget ceilings.

## Strategy (non-negotiable)

- Do **not** race GPT/Claude/Grok on general intelligence.
- Ship meters that win: African STT/TTS, Af–En translate, Voice Law authenticity, Africa residency.
- Market: “Best Swahili STT / Yoruba TTS / Af–En translate on Africa-hosted infra” — never “we beat Claude.”

## Cadence

1. **Data** — consented African speech + parallel text  
2. **Train** — LoRA / adapters on strong open bases  
3. **Eval** — `african-quality-eval` + native panels  
4. **Serve** — weights deploy + registry  
5. **Announce** — changelog + quality card + playground sample  
6. **GA** — blocked unless African quality gate passes  

## API

| Method | Path | Auth |
|---|---|---|
| GET | `/v1/model-release/engine` | public catalog |
| GET | `/v1/model-release/skus` | public SKU + quality cards |
| GET | `/v1/model-release/overview` | Clerk |
| GET | `/v1/model-release/priority` | Clerk — usage → next models |
| GET | `/v1/model-release/gpu-budget` | Tier A/B/C + Volume 7 ceilings |
| POST | `/v1/model-release/gate` | Run African quality GA gate |
| POST | `/v1/model-release/releases` | Start a release |
| POST | `/v1/model-release/releases/{id}/promote` | Advance stage (GA gated) |

## Console

`/model-release`

## Seed SKUs

- `vl-stt-{sw,yo,ha,am,zu}-v1` — Echo STT heroes  
- `vl-tts-{sw,yo,ha,am,zu}-v1` — Voice FM TTS heroes  
- `vl-mt-af-v1` — Translate FM Africa  
- `vl-atlas-chat-v1` — African Voice LLM  
- `vl-law-voice-auth-v1` — Voice Law Authenticity  

## Infrastructure tiers

| Tier | Use |
|---|---|
| A | Ship now — 2–8× L40S/A100 inference; 1–4× A100/H100 LoRA |
| B | Top-class speech/MT — 8–32× H100 + dialect data ops |
| C | Optional 1–7B African domain foundation after Tier B pays off |

Always pair with Volume 7 **GPU Platform** pools/quotas — no unbounded spend.

## Related

- `/model-registry` — version approve / deploy  
- `/gpu-platform` — ceilings  
- `/usage` — credit burn → priority  
- `/voice-law-authenticity` — law-facing PAD SKU  
- `docs/VOICE_LAW_AUTHENTICITY.md`  
