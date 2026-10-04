'use client';

import { SovereignStudio, SOVEREIGN_SIBLINGS } from '@/components/sovereign-studio';

export function NationalVoiceRuntimeClient() {
  return (
    <SovereignStudio
      title="National Voice Sovereignty"
      apiBase="/v1/national-voice-runtime"
      siblingLinks={[...SOVEREIGN_SIBLINGS]}
      actions={[
        {
          id: 'create',
          label: 'Create zone',
          path: 'zones',
          fields: [
            { name: 'countryCode', label: 'Country', placeholder: 'KE' },
            { name: 'ministry', label: 'Ministry', placeholder: 'ICT' },
            { name: 'region', label: 'Residency region', placeholder: 'af' },
          ],
        },
        { id: 'list', label: 'Show zones', path: 'zones', method: 'GET', fields: [] },
        {
          id: 'dialects',
          label: 'Enable dialect',
          path: 'zones/{zoneId}/dialects',
          fields: [
            { name: 'zoneId', label: 'Zone' },
            { name: 'dialect', label: 'Dialect', placeholder: 'sw-KE' },
          ],
        },
        {
          id: 'kill',
          label: 'Toggle hold',
          path: 'zones/{zoneId}/kill-switch',
          fields: [
            { name: 'zoneId', label: 'Zone' },
            { name: 'reason', label: 'Reason', placeholder: 'Election quiet period' },
            { name: 'armed', label: 'Arm', placeholder: 'true' },
          ],
        },
        {
          id: 'audit',
          label: 'Export audit',
          path: 'zones/{zoneId}/audit-export',
          fields: [{ name: 'zoneId', label: 'Zone' }],
        },
      ]}
    />
  );
}
