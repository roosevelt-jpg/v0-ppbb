# Model Lab — try before you know

For people who don’t yet know which Own Model (or pair) to use.

## Flow

1. **Describe the project** in plain language, or pick a recipe (chat, translate, voiceover, dubbing, OCR, RAG, …).
2. **Recommend** — Model Lab infers intent + budget and suggests a primary, a compare-with alternate, and a pipeline.
3. **Live compare** — same sample through both models (chat / MT / TTS / embed / dub pipeline).
4. **Pick the clearer output** — preference is saved for the org; open that model’s console.

## Console

`/model-lab`

## API

| Method | Path | Auth |
|---|---|---|
| GET | `/v1/own-models/lab/recipes` | public |
| POST | `/v1/own-models/lab/recommend` | `{ goal?, recipeId?, budget? }` |
| POST | `/v1/own-models/lab/try` | Clerk — one family live run |
| POST | `/v1/own-models/lab/compare` | Clerk — primary vs alternate |
| POST | `/v1/own-models/lab/prefer` | Clerk — save winner |

## Rule of thumb

Prefer the clearer result at the **lower cost tier**. Escalate to Reason FM / Speech Depth only when the specialist fails.

## Related

- `/own-models` — cost cards + router
- `docs/OWN_MODELS.md`
- `/playground` — raw API try with keys
