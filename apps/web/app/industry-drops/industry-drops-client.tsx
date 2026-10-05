'use client';

import { MoonshotConsole } from '@/components/moonshot-console';

export function IndustryDropsClient() {
  return (
    <MoonshotConsole
      title="Industry Drops"
      apiBase="/v1/industry-drops"
      actions={[
        {
          id: 'install',
          label: 'Install drop',
          path: 'install',
          fields: [
          { name: 'packId', label: 'Pack id', placeholder: 'banking-af' },
          { name: 'workspaceName', label: 'Workspace name', placeholder: 'KE Retail Bank' }
          ],
        },
        {
          id: 'configure',
          label: 'Configure drop',
          path: 'configure',
          fields: [
          { name: 'installId', label: 'Install id', placeholder: '' },
          { name: 'residency', label: 'Residency', placeholder: 'af' },
          { name: 'languages', label: 'Languages', placeholder: 'en,sw,yo' }
          ],
        },
        {
          id: 'evaluate',
          label: 'Run drop eval gate',
          path: 'evaluate',
          fields: [
          { name: 'installId', label: 'Install id', placeholder: '' },
          { name: 'suite', label: 'Suite', placeholder: 'smoke' }
          ],
        },
        {
          id: 'export',
          label: 'Export drop manifest',
          path: 'export',
          fields: [
          { name: 'packId', label: 'Pack id', placeholder: 'healthcare-af' }
          ],
        },
        {
          id: 'packs',
          label: 'List packs',
          path: 'packs',
          method: 'GET',
          fields: [

          ],
        }
      ]}
    />
  );
}
