'use client';

import { MoonshotConsole } from '@/components/moonshot-console';

export function CivicVoiceSealClient() {
  return (
    <MoonshotConsole
      title="Civic Voice Seal"
      apiBase="/v1/civic-voice-seal"
      actions={[
        {
          id: 'issue',
          label: 'Issue seal',
          path: 'issue',
          fields: [
            { name: 'subjectName', label: 'Public figure / org', placeholder: 'Ministry Spokesperson' },
            { name: 'role', label: 'Role', placeholder: 'public_official' },
            { name: 'country', label: 'Country', placeholder: 'KE' },
          ],
        },
        {
          id: 'verify',
          label: 'Verify token',
          path: 'verify',
          fields: [{ name: 'token', label: 'Seal token', placeholder: 'vseal.…' }],
        },
        {
          id: 'challenge',
          label: 'Challenge',
          path: 'challenge',
          fields: [{ name: 'sealId', label: 'Seal id' }],
        },
        {
          id: 'revoke',
          label: 'Revoke',
          path: 'revoke',
          fields: [
            { name: 'sealId', label: 'Seal id' },
            { name: 'reason', label: 'Reason', placeholder: 'Compromised voice' },
          ],
        },
        { id: 'directory', label: 'Directory', path: 'directory', method: 'GET', fields: [] },
      ]}
    />
  );
}
