'use client';

import { SovereignStudio, SOVEREIGN_SIBLINGS } from '@/components/sovereign-studio';

export function CivicVoiceEvidenceClient() {
  return (
    <SovereignStudio
      title="Civic Voice Evidence"
      apiBase="/v1/civic-voice-evidence"
      siblingLinks={[...SOVEREIGN_SIBLINGS]}
      actions={[
        {
          id: 'append',
          label: 'Seal utterance',
          path: 'append',
          fields: [
            { name: 'utterance', label: 'Utterance', type: 'textarea', placeholder: 'Official statement' },
            { name: 'actor', label: 'Actor', placeholder: 'ministry_spokesperson' },
            { name: 'consentId', label: 'Consent', placeholder: 'consent_…' },
            { name: 'watermarkTip', label: 'Watermark', placeholder: 'wm_…' },
          ],
        },
        { id: 'verify', label: 'Verify integrity', path: 'verify', fields: [] },
        {
          id: 'export',
          label: 'Prepare court package',
          path: 'export',
          fields: [
            { name: 'fromSeq', label: 'From', placeholder: '1' },
            { name: 'toSeq', label: 'To', placeholder: '10' },
          ],
        },
        { id: 'chain', label: 'Show recent seals', path: 'chain', method: 'GET', fields: [] },
      ]}
    />
  );
}
