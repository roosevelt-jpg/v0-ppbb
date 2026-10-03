# VCOS — Performance Notes

- Catalog endpoints are static/in-memory and cheap.
- Records queries are indexed by `(organizationId, domain)`.
- Seed runs once per org when empty; no background jobs.
