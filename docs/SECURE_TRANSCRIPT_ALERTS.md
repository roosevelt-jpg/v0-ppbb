# Secure Transcript Alerts

Transcribe a conversation and notify a trusted contact by **email or SMS** as a people-protection protocol.

## Consent

`consentToken` is required. No token → no send.

## Channels

- **Email** — Resend when `RESEND_API_KEY` + `EMAIL_FROM` are set; otherwise queued with audit receipt
- **SMS** — Twilio when `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` are set; otherwise queued

## Endpoints

| Method | Path | Notes |
|---|---|---|
| `POST` | `/v1/secure-transcript-alerts/protect` | Audio or text → transcript → alert |
| `POST` | `/v1/secure-transcript-alerts/notify` | Resend |
| `POST` | `/v1/secure-transcript-alerts/verify` | Verify receipt token |
| `GET` | `/v1/secure-transcript-alerts/protocols` | Protocol catalog |

## Console

`/secure-transcript-alerts`
