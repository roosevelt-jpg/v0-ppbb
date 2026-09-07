# ADR-0041: Foundation model program deferred

- Status: Accepted (do not start)
- Date: 2026-09-07
- Phase: VL-112

## Context

Roadmap VL-112 asks for named foundation models (Atlas, Baobab, Echo, …) as products on trained weights. Buy-vs-build says **Do not start** without a research org and capital. M10–M11 already deliver vendor MT, coverage eval, datasets, fine-tunes for failed pairs, a model registry, and rented-GPU training jobs.

## Decision

1. **Do not start VL-112.** No foundation-model training stack, no named FM product shells, no empty “Foundation Model Cloud” folders.
2. **Use instead:** bought providers (Google/OpenAI/etc.), open weights only via VL-104/VL-111 fine-tunes when coverage fails, and VL-110 registry for what is live.
3. **Status:** `Blocked` on hires + budget. Re-open only with an explicit research charter and funding — not by another “next” coding pass.

## Consequences

- Executable roadmap through M11 is complete for a small team.
- Vision backlog items (VAIOS, FM Cloud, AI Internet, …) remain unscheduled.
- Marking VL-112 Done without weights and eval would violate engineering standards (no fake completeness).
