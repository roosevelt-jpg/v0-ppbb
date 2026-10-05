# Notifications, jobs, alerts & email (Resend)

## What’s wired

| Layer | Status | Notes |
|---|---|---|
| **Email (Resend)** | Shipped | `ResendAdapter` → `https://api.resend.com/emails` with HTML + text templates |
| **Alerts** | Shipped | Job complete/fail, usage 80%/100%, member added, workflow notify, secure transcript alerts |
| **Async jobs** | Shipped | BullMQ worker on Redis (`JOBS_INLINE=1` for local/dev without Redis) |
| **SMS** | Optional | Twilio via `notifySecureAlert` when `TWILIO_*` set |
| **Cron OS** | Not a Nest cron fleet | No `@nestjs/schedule`. Schedulers are catalog/control-plane hubs; work runs through the jobs queue |

## Enable Resend

```bash
# apps/api/.env
RESEND_API_KEY=re_xxxxxxxx
EMAIL_FROM="VerbaLab <noreply@your-verified-domain.com>"
# Optional: absolute host for logo/social images in HTML (defaults to WEB_APP_URL / app.verbalab.ai)
# EMAIL_ASSET_BASE_URL=https://app.verbalab.ai
# NOTIFICATIONS_DISABLED=1   # only to kill sends
```

1. Create an API key at [resend.com](https://resend.com)
2. Verify your sending domain in Resend
3. Set `EMAIL_FROM` to that verified address
4. Check console **Credentials** (`/credentials-readiness`) — both `RESEND_API_KEY` and `EMAIL_FROM` must be present
5. Preview templates: `GET /v1/notifications/templates/:id/preview`
6. Send a test (owner/admin): `POST /v1/notifications/test` `{ "to": "you@example.com", "templateId": "member_added" }`

## HTML templates (fully wired)

| Template id | Trigger |
|---|---|
| `job_complete` | Async job succeeded/failed |
| `usage_threshold` | Translate quota 80% / 100% |
| `member_added` | Clerk membership sync |
| `workflow_message` | Workflow / email connector notify |
| `secure_alert` | Secure Transcript Alerts |

Each render returns **subject + text + html**. Resend sends both `text` and `html`.

### Branding

Every HTML message uses a shared layout:

- **Header:** VerbaLab logo (`apps/web/public/email/verbalab-logo.png` or CMS `emailLogoUrl`) on the brand green band
- **Body:** title, content, primary CTA
- **Footer:** social icon row (X, LinkedIn, GitHub, YouTube, Instagram, Facebook) + short residency note
- **Copyright bar:** bottom brand bar with `© {year} VerbaLab…` (overridable via CMS `copyrightText`)

Image URLs are absolute: `{EMAIL_ASSET_BASE_URL|WEB_APP_URL|https://app.verbalab.ai}/email/...`. Serve the web app (or CDN) so those paths resolve in inbox clients. Admins set header/footer/email logos and favicon under **CMS → Site settings**.

## API

| Method | Path | Notes |
|---|---|---|
| `GET` | `/v1/notifications/engine` | Config + template catalog |
| `GET` | `/v1/notifications/templates` | Template list |
| `GET` | `/v1/notifications/templates/:id/preview` | HTML/text preview |
| `POST` | `/v1/notifications/test` | Owner/admin test send |
| `GET` | `/v1/notifications/overview` | Org overview |

## Console

`/notifications`

## Related

- ADR: `docs/adr/0024-resend-notifications.md`
- Credentials: `docs/CREDENTIALS.md`
- Secure alerts: `docs/SECURE_TRANSCRIPT_ALERTS.md`
