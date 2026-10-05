# Voice Law Authenticity

Law-facing **assistive** screening for synthetic / impersonated voice recordings.

## What it is

`vl-law-voice-auth-v1` combines:

1. Pluggable PAD (`assessPad`) — default heuristic anti-spoof; optional HTTP model at `VERBALAB_PAD_URL` (`certifiedPad: false`)
2. Optional speaker match against an enrolled Voice Biometrics / Speaker Intelligence profile
3. Optional Civic Voice Seal verification
4. Optional append into the Civic Voice Evidence hash chain
5. Expert-review workflow handoff to accredited forensic labs
6. A structured authenticity report with an explicit legal disclaimer (`courtSoleEvidence: false`)

## What it is not

- Not a court verdict
- Not NIST PAD / ASVspoof certified
- Not sole admissible proof of authenticity or forgery
- Not a replacement for a qualified forensic audio examiner

## Upgrade path (shipped hooks)

1. Keep the same analyze API; set `VERBALAB_PAD_URL` (+ optional `VERBALAB_MODEL_API_KEY`) to serve an ASVspoof-/ADD-trained PAD on GPU.
2. Pass `africanLanguageHint` + `telephonyCodec` so the PAD can specialize on African languages / telephony codecs.
3. Use `POST .../reports/{id}/expert-review` to partner with accredited labs — model never becomes sole evidence.
4. Infra: Tier A GPU for PAD inference; Tier B for training a VerbaLab PAD checkpoint (see Model Release).

## API

| Method | Path | Auth |
|---|---|---|
| GET | `/v1/voice-law-authenticity/engine` | public catalog |
| GET | `/v1/voice-law-authenticity/overview` | Clerk / API key |
| POST | `/v1/voice-law-authenticity/analyze` | multipart `file` + optional fields |
| GET | `/v1/voice-law-authenticity/reports` | list |
| GET | `/v1/voice-law-authenticity/reports/{id}` | fetch |
| POST | `/v1/voice-law-authenticity/reports/{id}/expert-review` | request lab handoff |
| GET | `/v1/voice-law-authenticity/expert-reviews` | list reviews |
| POST | `/v1/voice-law-authenticity/expert-reviews/{id}` | update status / findings |

### Analyze fields

- `file` (required) — audio recording
- `caseRef` — matter / docket reference
- `claimedSpeaker` — attributed person
- `profileId` — enrolled speaker profile for match
- `sealToken` — civic voice seal token
- `appendEvidence=true` — write hash tip into evidence chain
- `threshold` — speaker match threshold
- `africanLanguageHint` — e.g. `sw`, `yo` (PAD specialization)
- `telephonyCodec` — e.g. `amr`, `g711` (false-positive context)

## Console

`/voice-law-authenticity`

## Related

- `/voice-biometrics` — enroll / anti-spoof primitives
- `/civic-voice-seal` — public speaker seals
- `/civic-voice-evidence` — court export chain
- `/civic-truth-guard` — claim / misinformation scoring
- `/justice-language-access` — court language access
- `/model-release` — SKU + GPU tier for PAD upgrade
- `docs/MODEL_RELEASE.md`
