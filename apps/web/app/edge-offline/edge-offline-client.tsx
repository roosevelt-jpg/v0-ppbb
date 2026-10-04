'use client';

import { MoonshotConsole } from '@/components/moonshot-console';

export function EdgeOfflineClient() {
  return (
    <MoonshotConsole
      title="Edge Offline Packs"
      apiBase="/v1/edge-offline"
      actions={[
        {
          id: 'build',
          label: 'Build offline pack',
          path: 'build',
          fields: [
          { name: 'models', label: 'Models', placeholder: 'echo,voice-fm' },
          { name: 'locales', label: 'Locales', placeholder: 'sw,yo,ha,ar' },
          { name: 'deviceClass', label: 'Device class', placeholder: 'mobile' }
          ],
        },
        {
          id: 'sign',
          label: 'Sign pack',
          path: 'sign',
          fields: [
          { name: 'packId', label: 'Pack id', placeholder: '' },
          { name: 'signer', label: 'Signer', placeholder: 'verbalab-edge' }
          ],
        },
        {
          id: 'sync',
          label: 'Sync pack delta',
          path: 'sync',
          fields: [
          { name: 'packId', label: 'Pack id', placeholder: '' },
          { name: 'deviceId', label: 'Device id', placeholder: 'device-1' }
          ],
        },
        {
          id: 'verify',
          label: 'Verify pack integrity',
          path: 'verify',
          fields: [
          { name: 'packId', label: 'Pack id', placeholder: '' },
          { name: 'checksum', label: 'Checksum', placeholder: '' }
          ],
        },
        {
          id: 'catalog',
          label: 'Pack catalog',
          path: 'catalog',
          method: 'GET',
          fields: [

          ],
        }
      ]}
    />
  );
}
