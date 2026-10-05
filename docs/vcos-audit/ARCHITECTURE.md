# VCOS — Architecture Validation

## Role

Corporate Operating System is **internal business software** for VerbaLab as an African AI company:
governance tracking, strategy/OKRs, portfolio, business architecture, EA repository,
knowledge portal, executive KPIs, risk register, and Digital Constitution.

## Pattern

1. Shared `VcosStore` + Prisma `VcosRecord` (domain/kind/title/content).
2. Foundation hub catalogs all products + constitution + overview.
3. Domain hubs expose engine catalogs + authenticated records CRUD.
4. Honesty flags prevent mistaking tooling for real governance.

## Extends

| Upstream | Volume | Role |
| --- | --- | --- |
| Enterprise Engineering System | 20 | Engineering OS for humans+Cursor |
| AI Governance / Trust | 15 | Human sign-off / trust |
| Compliance Platform | 15 | Compliance tooling (related, distinct) |
