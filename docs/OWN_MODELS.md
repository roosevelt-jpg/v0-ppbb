# Own Models

VerbaLab-owned specialists with **cost-aware routing**. Sharp on African speech/language; frugal by picking the right family.

## Rule

Never burn Reason FM (or a rented frontier LLM) on a job Echo / Voice FM / Translate FM already owns.

| Intent | Default | Frugal | Quality |
|---|---|---|---|
| chat | Baobab | Baobab | Reason FM |
| stt | Echo | Echo | Speech Depth |
| tts | Voice FM | Voice FM | Voice FM |
| mt | Translate FM | Translate FM | Translate FM |
| ocr | Vision FM | Vision FM | Fusion |
| embed | Vector FM | Vector FM | Vector FM |
| dub | Video Voice | Voice FM | Video Voice |
| offline | Edge | Edge | Edge |

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/v1/own-models/engine` | Hub catalog + routing table |
| GET | `/v1/own-models/families` | Full family profiles |
| GET | `/v1/own-models/families/{id}` | One family + cost card |
| POST | `/v1/own-models/route` | `{ intent, budget, language?, preferOffline? }` |
| POST | `/v1/own-models/estimate` | `{ familyId, units }` → credits |
| GET | `/v1/own-models/gaps` | Open missing pieces |
| GET | `/v1/own-models/compare?ids=` | Side-by-side |

## Console

- Hub: `/own-models`
- Each family page uses the Own Model Studio (cost, when-to-use, router, gaps, SKUs)

## Families

Baobab, Echo, Voice FM, Vision FM, Vector FM, Reason FM, Edge, Fusion, Translate FM, Model Runtime, Speech Depth, Video Voice, AI Internet.

## Related

- `docs/MODEL_RELEASE.md` — SKUs + GA gates
- `/gpu-platform` — spend ceilings
- `/usage` — credit burn drives priority
