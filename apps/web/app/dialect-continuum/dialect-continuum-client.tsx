'use client';

import { MoonshotConsole } from '@/components/moonshot-console';

export function DialectContinuumClient() {
  return (
    <MoonshotConsole
      title="Dialect Continuum Engine"
      apiBase="/v1/dialect-continuum"
      actions={[
        {
          id: 'detect',
          label: 'Detect spectrum',
          path: 'detect',
          fields: [
            {
              name: 'text',
              label: 'Utterance',
              type: 'textarea',
              placeholder: 'Wakha my brother, no wahala — tutaongea baadaye',
            },
          ],
        },
        {
          id: 'track',
          label: 'Track drift',
          path: 'track',
          fields: [
            { name: 'sessionId', label: 'Session id (optional)', placeholder: 'leave blank to start' },
            { name: 'text', label: 'Next utterance', type: 'textarea', placeholder: 'How far na you? Safi.' },
          ],
        },
        {
          id: 'reply',
          label: 'Reply in mix',
          path: 'reply',
          fields: [
            {
              name: 'text',
              label: 'User message',
              type: 'textarea',
              placeholder: 'Yezzi, chkoun jeya? Tell me price.',
            },
          ],
        },
        { id: 'map', label: 'View map', path: 'map', method: 'GET', fields: [] },
      ]}
    />
  );
}
