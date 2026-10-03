# VCOS — Deployment

1. `prisma migrate deploy` (includes `20261003270000_vcos`).
2. API boot seeds demo org records if empty.
3. Console routes under `/corporate-*` and related hubs require `/dev-login` for records mutations.
