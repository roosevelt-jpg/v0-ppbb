# Voice Law Authenticity

Law-facing **assistive** screening for synthetic / impersonated voice recordings.

## What it is

`vl-law-voice-auth-v1` combines:

1. Heuristic anti-spoof / replay / TTS-ish risk signals (`certifiedPad: false`)
2. Optional speaker match against an enrolled Voice Biometrics / Speaker Intelligence profile
3. Optional Civic Voice Seal verification
4. Optional append into the Civic Voice Evidence hash chain
5. A structured authenticity report with an explicit legal disclaimer

## What it is not

- Not a court verdict
- Not NIST PAD / ASVspoof certified
- Not sole admissible proof of authenticity or forgery
- Not a replacement for a qualified forensic audio examiner

## API

| Method | Path | Auth |
|---|---|---|
| GET | `/v1/voice-law-authenticity/engine` | public catalog |
| GET | `/v1/voice-law-authenticity/overview` | Clerk / API key |
| POST | `/v1/voice-law-authenticity/analyze` | multipart `file` + optional fields |
| GET | `/v1/voice-law-authenticity/reports` | list |
| GET | `/v1/voice-law-authenticity/reports/{id}` | fetch |

### Analyze fields

- `file` (required) — audio recording
- `caseRef` — matter / docket reference
- `claimedSpeaker` — attributed person
- `profileId` — enrolled speaker profile for match
- `sealToken` — civic voice seal token
- `appendEvidence=true` — write hash tip into evidence chain
- `threshold` — speaker match threshold

## Console

`/voice-law-authenticity`

## Related

- `/voice-biometrics` — enroll / anti-spoof primitives
- `/civic-voice-seal` — public speaker seals
- `/civic-voice-evidence` — court export chain
- `/civic-truth-guard` — claim / misinformation scoring
- `/justice-language-access` — court language access
