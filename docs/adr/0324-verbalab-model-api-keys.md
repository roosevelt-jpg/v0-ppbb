# ADR-0324: VerbaLab-owned model API keys

- Status: Accepted
- Date: 2026-10-03

## Decision

1. Mint VerbaLab model keys in-product: `vmod_live_` / `vmod_test_` (serving) and `vmod_root_` (platform → `VERBALAB_MODEL_API_KEY`).
2. Store only SHA-256 hashes in `model_api_keys`; secret shown once.
3. These replace vendor API keys as the Own AI auth story (ADR-0298).
4. Deploy guide: `docs/CREDENTIALS.md`.
