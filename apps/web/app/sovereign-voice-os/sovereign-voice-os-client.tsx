'use client';

import { SovereignStudio, SOVEREIGN_SIBLINGS } from '@/components/sovereign-studio';

export function SovereignVoiceOsClient() {
  return (
    <SovereignStudio
      title="Sovereign Voice OS"
      apiBase="/v1/sovereign-voice-os"
      siblingLinks={[...SOVEREIGN_SIBLINGS]}
      actions={[
        { id: 'pillars', label: 'Explore pillars', path: 'pillars', method: 'GET', fields: [] },
        { id: 'readiness', label: 'Buyer readiness', path: 'readiness', method: 'GET', fields: [] },
        { id: 'integrations', label: 'Integrations', path: 'integrations', method: 'GET', fields: [] },
        {
          id: 'compose',
          label: 'Compose deployment',
          path: 'compose',
          fields: [
            { name: 'countryCode', label: 'Country', placeholder: 'NG' },
            { name: 'sectors', label: 'Sectors', placeholder: 'health,justice,elections' },
            { name: 'corridors', label: 'Corridors', placeholder: 'ecowas' },
          ],
        },
      ]}
    />
  );
}
