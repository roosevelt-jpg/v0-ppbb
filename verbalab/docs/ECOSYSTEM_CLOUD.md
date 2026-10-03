# VerbaLab Ecosystem Cloud

**Status:** Foundation shipped (VL-249); Plugin Marketplace shipped (VL-250). Remaining: VL-251–257 marketplaces, Creator Economy VL-258, audit VL-259.  
**Rule:** Ecosystem Cloud is the **marketplace + monetization hub** over existing VL-090+ content marketplace and voice marketplace — **not** a payment-processor OS, card vault, or regenerate of Volumes 1–10. Roadmap: [`docs/roadmap/volume11-ecosystem-cloud/`](./roadmap/volume11-ecosystem-cloud/).

Volume 11 README: this is a **real-money** volume (payments, licensing, royalty payouts). Use an established processor (Stripe, etc.); never store raw card data. Plugin/Agent marketplaces must enforce Volume 8 sandboxes + Policy hard-gate before third-party code runs. Creator Economy payout math must be hand-checked before live creators.

---

## Library term → VerbaLab

| Library ask | VerbaLab reality |
| --- | --- |
| Ecosystem Foundation | **VL-249** — `/ecosystem-cloud` + product catalog / routing |
| Plugin Marketplace | **Shipped** — VL-250 — [`PLUGIN_MARKETPLACE.md`](./PLUGIN_MARKETPLACE.md); sandbox + Policy required |
| Model Marketplace | **Deferred** — VL-251 |
| Dataset Marketplace | **Deferred** — VL-252 — extends content `dataset` kind |
| Prompt Marketplace | **Deferred** — VL-253 — extends content `prompt` kind |
| Agent Marketplace | **Deferred** — VL-254 — sandbox + Policy required |
| Workflow Marketplace | **Deferred** — VL-255 |
| Connector Marketplace | **Deferred** — VL-256 |
| Voice & Language Marketplace | **Deferred** — VL-257 — extends voice marketplace |
| Creator Economy | **Partial** — VL-092 Stripe Connect exists; VL-258 expands |
| Content Marketplace (prior) | **Shipped** — VL-090–092 `/marketplace` |
| Voice Marketplace (prior) | **Shipped** — VL-177 `/voice-marketplace` |
| Production Audit | **Deferred** — VL-259 |
| DDD / CQRS / Hexagonal | Bounded catalog CQRS slice — `hexagonalRewrite: false` |
| Terraform / Kubernetes | Shared platform — Fly default; optional EKS `af-south-1` |

---

## Surfaces

| Surface | Path |
| --- | --- |
| Console | `/ecosystem-cloud` |
| REST catalog | `GET /v1/ecosystem-cloud/products` (public) |
| REST engine | `GET /v1/ecosystem-cloud/engine` |
| REST routing | `GET /v1/ecosystem-cloud/routing` |
| REST overview | `GET /v1/ecosystem-cloud/overview` (Clerk session) |
| Monitoring | `GET /v1/ecosystem-cloud/monitoring` |
| GraphQL | `ecosystemProducts` |
| SDK | `ecosystemCloudProducts()` |
| CLI | `verbalab ecosystem-cloud-products` |

## Action safety (README)

1. **Payments** — Stripe (or equivalent) only; `storesRawCardData: false`.
2. **Plugin / Agent marketplaces** — Volume 8 Plugin/Agent Runtime sandbox + Policy Fabric hard-gate before third-party code executes for other users.
3. **Creator Economy** — hand-check payout math; tax/dispute/1099 coverage must be explicit gaps until documented.

## Honesty

| Flag | Value |
| --- | --- |
| `paymentProcessorOs` | false |
| `storesRawCardData` | false |
| `stripeOrEquivalentRequired` | true |
| `regeneratesVolumes1to10` | false |
| `regeneratesMarketplaceVl090` | false |
| `pluginAgentSandboxRequired` | true |
| `taxHandlingComplete` | false |
| `disputeChargebackComplete` | false |
| `realMoneyRiskCategory` | true |

See ADR-0151. Existing marketplaces: [`VOICE_MARKETPLACE.md`](./VOICE_MARKETPLACE.md), VL-090–092 ADRs 0031–0033.
