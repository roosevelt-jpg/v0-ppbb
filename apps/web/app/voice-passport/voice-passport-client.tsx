'use client';

import { MoonshotConsole } from '@/components/moonshot-console';

export function VoicePassportClient() {
  return (
    <MoonshotConsole
      title="Voice Passport"
      apiBase="/v1/voice-passport"
      actions={[
        {
          id: 'issue',
          label: 'Issue passport',
          path: 'issue',
          fields: [
          { name: 'holderName', label: 'Holder name', placeholder: 'Amina Diallo' },
          { name: 'country', label: 'Country', placeholder: 'SN' },
          { name: 'scopes', label: 'Scopes', placeholder: 'tts,clone' }
          ],
        },
        {
          id: 'endorse',
          label: 'Endorse passport',
          path: 'endorse',
          fields: [
          { name: 'passportId', label: 'Passport id', placeholder: '' },
          { name: 'endorser', label: 'Endorser', placeholder: 'Elder Council' }
          ],
        },
        {
          id: 'check',
          label: 'Check authorization',
          path: 'check',
          fields: [
          { name: 'passportId', label: 'Passport id', placeholder: '' },
          { name: 'purpose', label: 'Purpose', placeholder: 'voice_clone' },
          { name: 'country', label: 'Country', placeholder: 'SN' }
          ],
        },
        {
          id: 'revoke',
          label: 'Revoke passport',
          path: 'revoke',
          fields: [
          { name: 'passportId', label: 'Passport id', placeholder: '' },
          { name: 'reason', label: 'Reason', placeholder: 'holder request' }
          ],
        },
        {
          id: 'directory',
          label: 'Directory',
          path: 'directory',
          method: 'GET',
          fields: [

          ],
        }
      ]}
    />
  );
}
