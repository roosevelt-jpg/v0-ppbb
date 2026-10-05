export function secureTranscriptAlertsHonesty() {
  return {
    product: 'secure-transcript-alerts',
    shipped: true,
    channels: ['email', 'sms'],
    consentRequired: true,
    note:
      'Secure Transcript Alerts transcribe a conversation and deliver a sealed summary to a trusted email or SMS contact — a people-protection protocol with audit receipts. Live SMS needs Twilio; email needs Resend.',
  };
}

export function secureTranscriptAlertsCatalog() {
  return {
    id: 'secure-transcript-alerts',
    title: 'Secure Transcript Alerts',
    blurb:
      'Transcribe a conversation and notify a trusted person by email or SMS — consent-bound security protocol for personal and institutional protection.',
    honesty: secureTranscriptAlertsHonesty(),
    docs: '/docs/SECURE_TRANSCRIPT_ALERTS.md',
    residency: { primaryRegion: 'af-south-1', verbalabRegion: 'af', flyRegion: 'jnb' },
    capabilities: [
      {
        id: 'protect',
        name: 'Transcribe + alert trusted contact',
        status: 'shipped' as const,
        api: 'POST /v1/secure-transcript-alerts/protect',
      },
      {
        id: 'notify',
        name: 'Re-send sealed alert',
        status: 'shipped' as const,
        api: 'POST /v1/secure-transcript-alerts/notify',
      },
      {
        id: 'verify',
        name: 'Verify alert receipt',
        status: 'shipped' as const,
        api: 'POST /v1/secure-transcript-alerts/verify',
      },
      {
        id: 'protocols',
        name: 'List protection protocols',
        status: 'shipped' as const,
        api: 'GET /v1/secure-transcript-alerts/protocols',
      },
    ],
  };
}
