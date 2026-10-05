# Certification Guide

VerbaLab personnel certificates are issued under scheme **VGAS-PCS-001**
(ISO/IEC 17024-inspired process). They are **not** third-party accredited.

## Verify

```
GET /v1/global-ai-standards/verify/:code
```

Demo: `VGAS-DEMO-ENGINEER-001`

Expected honesty on a valid response:

- `valid=true`
- `issuer=VerbaLab`
- `schemeId=VGAS-PCS-001`
- `isoProcessMaturity=true`
- `thirdPartyAccreditation=false`
- `isoIeeeW3cRecognition=false`

## Scheme

```
GET /v1/ai-certification-platform/scheme
```

Lifecycle: application → assessment → decision → issued → surveillance → renewed → suspended → withdrawn.

## Do not claim

- ISO / IEEE / W3C recognition
- Government accreditation
- That holding a VerbaLab certificate equals holding an accredited ISO credential
