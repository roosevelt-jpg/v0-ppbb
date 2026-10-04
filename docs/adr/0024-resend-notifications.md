# ADR-0024: Resend notifications

- Status: Accepted
- Date: 2026-09-06
- Phase: VL-080

## Context

Async jobs and billing need email: job complete, usage thresholds, and membership welcome. We will not build a Notification Cloud.

## Decision

1. **Provider:** Resend via thin `ResendAdapter` (`fetch`); no-op when `RESEND_API_KEY` / `EMAIL_FROM` unset. `NOTIFICATIONS_DISABLED=1` kills sends.
2. **Triggers:** `job.succeeded` / `job.failed` → owners/admins; translate usage at **80%** and **100%** of monthly character quota (deduped per billing period via audit actions); new Clerk-synced membership → welcome email to the member.
3. **Invites:** Clerk Organizations remain the invite IdP; VerbaLab does not ship invite CRUD.
4. **Tests:** `setProviderForTests` memory mailbox; never call live Resend in CI.

## Consequences

- Missing owner emails means job/usage alerts are skipped (threshold still audited when possible).
- Preference UI / digests deferred (VL-081 if needed).

## Update (2026-10-04)

HTML + text templates are fully wired for job complete, usage threshold, member added, workflow notify, and secure alerts (`email-templates.ts`). Console `/notifications` exposes preview + owner/admin test send. `EMAIL_FROM` is required alongside `RESEND_API_KEY` for credentials readiness.

Branded layout: logo header + social icon footer. Assets live under `apps/web/public/email/` and are referenced via absolute URLs (`EMAIL_ASSET_BASE_URL` / `WEB_APP_URL`).
