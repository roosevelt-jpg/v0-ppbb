# ADR-0298: VerbaLab Own AI is the primary inference path

- Status: Accepted (supersedes vendor-default posture in ADR-0041 / ADR-0045 for product routing)
- Date: 2026-10-03

## Context

VerbaLab is the VerbaLab Own AI: we own Voice FM, Translate FM, Echo, Atlas, and related families.
Renting OpenAI / Google / external vendor as the default product path contradicts the company strategy.

## Decision

1. **Gateway primary providers** are VerbaLab Own AI adapters (`verbalab-own-ai.ts`).
2. Live inference uses `VERBALAB_MODEL_BASE_URL` / modality URLs + `VERBALAB_MODEL_API_KEY`.
3. `VERBALAB_OWN_AI_FIXTURE=1` for local/CI — never claim live GPU without endpoints.
4. Vendor adapters remain in-tree only behind `VERBALAB_ALLOW_VENDOR_FALLBACK=1`.
5. Voice cloning primary path is VerbaLab Voice FM (`VERBALAB_CLONE_URL`), not a third-party voice OS.
6. Foundation model hubs (Atlas, Baobab, Echo, Voice/Vision/Vector/Reason FM, Edge, Fusion, Translate FM) are product surfaces over own endpoints.
7. Weight binaries are **not** stored in the monorepo; they are deployed as VerbaLab model services.

## Consequences

- Product messaging and runtime defaults match ownership.
- Production readiness for credentials = setting VerbaLab model env vars at deploy time.
- ADR-0041's "do not start FM program" is superseded for **platform + serving**; competitive SOTA claims still require eval evidence.
