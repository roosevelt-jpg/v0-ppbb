# ADR-0276 — VGAS ISO process maturity without false recognition

## Status

Accepted — Volume 22 follow-up.

## Context

The Volume 22 README states that becoming an international standard (ISO/IEEE/W3C-style)
cannot be delivered by code alone. Users still need certificates and standards documents
that operate with professional, ISO-comparable rigor — without implying accreditation that
does not exist.

## Decision

1. Ship **ISO-aligned process maturity** inside VGAS:
   - document-control stage model
   - normative document structure
   - personnel certification scheme inspired by ISO/IEC 17024 principles
   - recognition pathway checklist for external steps
2. Keep honesty flags:
   - `isoProcessMaturity=true`
   - `internationalStandardAdoption=false`
   - `isoIeeeW3cRecognition=false`
   - `thirdPartyAccreditation=false`
3. Public verify responses must include scheme identity and the false recognition flags.

## Consequences

- Product can honestly say “ISO-level process maturity.”
- Product must not market certificates as ISO-accredited or internationally adopted standards.
- External recognition remains an institutional program outside this codebase.
