'use client';

import { MoonshotConsole } from '@/components/moonshot-console';

export function AfricaInstitutionsClient() {
  return (
    <MoonshotConsole
      title="Africa Institutions Hub"
      apiBase="/v1/africa-institutions"
      actions={[
        {
          id: 'pillars',
          label: 'View pillars',
          path: 'pillars',
          method: 'GET',
          fields: [

          ],
        },
        {
          id: 'playbooks',
          label: 'View playbooks',
          path: 'playbooks',
          method: 'GET',
          fields: [

          ],
        },
        {
          id: 'route',
          label: 'Route a need',
          path: 'route',
          fields: [
            { name: 'need', label: 'Need / question', placeholder: 'protect witness with sms alert', type: 'textarea' }
          ],
        }
      ]}
    />
  );
}
