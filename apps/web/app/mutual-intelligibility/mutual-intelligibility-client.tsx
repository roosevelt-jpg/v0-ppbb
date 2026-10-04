'use client';

import { SovereignStudio, SOVEREIGN_SIBLINGS } from '@/components/sovereign-studio';

export function MutualIntelligibilityClient() {
  return (
    <SovereignStudio
      title="Mutual Intelligibility"
      apiBase="/v1/mutual-intelligibility"
      siblingLinks={[...SOVEREIGN_SIBLINGS]}
      actions={[
        { id: 'corridors', label: 'Show corridors', path: 'corridors', method: 'GET', fields: [] },
        {
          id: 'bridge',
          label: 'Bridge meaning',
          path: 'bridge',
          fields: [
            { name: 'corridorId', label: 'Corridor', placeholder: 'eac' },
            { name: 'sourceLocale', label: 'From', placeholder: 'rw' },
            { name: 'targetLocale', label: 'To', placeholder: 'sw' },
            {
              name: 'text',
              label: 'Utterance',
              type: 'textarea',
              placeholder: 'Muraho, dukeneye ubufasha bwihutirwa.',
            },
          ],
        },
        {
          id: 'score',
          label: 'Score pair',
          path: 'score',
          fields: [
            { name: 'sourceLocale', label: 'From', placeholder: 'yo' },
            { name: 'targetLocale', label: 'To', placeholder: 'ig' },
            { name: 'text', label: 'Text', type: 'textarea' },
          ],
        },
      ]}
    />
  );
}
