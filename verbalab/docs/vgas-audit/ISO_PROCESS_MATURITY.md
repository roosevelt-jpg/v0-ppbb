# VGAS ISO Process Maturity

Volume 22 enhancement: VerbaLab runs its standards and certification program with
**ISO-aligned process rigor**. That is not the same as ISO/IEEE/W3C recognition.

## What “ISO-level” means here

| Capability | Status | Claim |
| --- | --- | --- |
| Document control stages (NP→WD→CD→DIS→FDIS→publication analogy) | Shipped | Process maturity |
| Normative clause structure (shall / should / conformance) | Shipped | Process maturity |
| Personnel certification scheme (ISO/IEC 17024-inspired) | Shipped | Process maturity |
| Public certificate verification API | Shipped | VerbaLab-issued only |
| International standard adoption | **false** | Requires external SDO |
| ISO/IEEE/W3C recognition | **false** | Requires external bodies |
| Third-party accreditation | **false** | Requires accreditation body |

## APIs

- `GET /v1/global-ai-standards/iso-process` — stages, normative structure, scheme, recognition pathway
- `GET /v1/ai-certification-platform/scheme` — VGAS-PCS-001 scheme document summary
- `GET /v1/global-ai-standards/verify/:code` — includes `schemeId`, `isoProcessMaturity=true`, recognition flags false

Demo code: `VGAS-DEMO-ENGINEER-001`

## Honesty flags

```json
{
  "isoProcessMaturity": true,
  "internationalStandardAdoption": false,
  "isoIeeeW3cRecognition": false,
  "thirdPartyAccreditation": false
}
```

## External path (not software)

Real ISO-level *recognition* still needs national-body/SDO liaison, multi-stakeholder
ballot, publication by that body, and (for accredited credentials) an accreditation-body
assessment under ISO/IEC 17024. See the `recognitionPathway` object on the iso-process API.
