'use client';

import { MoonshotConsole } from '@/components/moonshot-console';

export function SecureTranscriptAlertsClient() {
  return (
    <MoonshotConsole
      title="Secure Transcript Alerts"
      apiBase="/v1/secure-transcript-alerts"
      actions={[
        {
          id: 'protocols',
          label: 'List protocols',
          path: 'protocols',
          method: 'GET',
          fields: [

          ],
        },
        {
          id: 'protect',
          label: 'Protect (text → alert)',
          path: 'protect',
          fields: [
            { name: 'text', label: 'Transcript / conversation text', placeholder: 'I need help — please listen carefully.', type: 'textarea' },
            { name: 'channel', label: 'Channel email|sms', placeholder: 'email', type: 'text' },
            { name: 'to', label: 'Destination', placeholder: 'safety@example.org', type: 'text' },
            { name: 'consentToken', label: 'Consent token', placeholder: 'cns_demo', type: 'text' },
            { name: 'protocol', label: 'Protocol', placeholder: 'trusted-contact', type: 'text' },
            { name: 'trustedName', label: 'Trusted contact name', placeholder: 'Amina', type: 'text' },
            { name: 'language', label: 'Language', placeholder: 'en', type: 'text' }
          ],
        },
        {
          id: 'verify',
          label: 'Verify receipt',
          path: 'verify',
          fields: [
            { name: 'alertId', label: 'Alert id', placeholder: '', type: 'text' },
            { name: 'receiptToken', label: 'Receipt token', placeholder: '', type: 'text' }
          ],
        }
      ]}
    />
  );
}
