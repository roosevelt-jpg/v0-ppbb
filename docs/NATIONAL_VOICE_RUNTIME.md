# National Voice Sovereignty Runtime

Sealed per-country voice zones for ministries and regulated enterprises.

## What shipped
- `POST /v1/national-voice-runtime/zones` — create/pin a national zone
- Dialect pack enablement per zone
- Ministry kill-switch (arms/disarms mutations)
- Sovereignty audit export (hashed control-plane package)

## Honesty
Pinning does **not** migrate historical audio/transcripts across residency islands. A zone whose `region` mismatches `VERBALAB_REGION` will still hit `residency_mismatch` on live speech routes until you deploy the matching island.

## Console
`/national-voice-runtime` · umbrella `/sovereign-voice-os`
