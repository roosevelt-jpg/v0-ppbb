'use client';

import { SovereignStudio, SOVEREIGN_SIBLINGS } from '@/components/sovereign-studio';

export function InstitutionalVoiceClient() {
  return (
    <SovereignStudio
      title="Institutional Voice"
      apiBase="/v1/institutional-voice"
      siblingLinks={[...SOVEREIGN_SIBLINGS]}
      actions={[
        {
          id: 'agency',
          label: 'Register agency',
          path: 'agencies',
          fields: [
            { name: 'agencyId', label: 'Agency', placeholder: 'moh-ke' },
            { name: 'name', label: 'Name', placeholder: 'Ministry of Health Kenya' },
            { name: 'voiceId', label: 'Voice', placeholder: 'own:sw-aisha' },
          ],
        },
        {
          id: 'ingest',
          label: 'Ingest policy',
          path: 'corpus',
          fields: [
            { name: 'agencyId', label: 'Agency', placeholder: 'moh-ke' },
            { name: 'title', label: 'Title', placeholder: 'Gazette Notice' },
            {
              name: 'body',
              label: 'Policy text',
              type: 'textarea',
              placeholder: 'Vaccination is free at public clinics…',
            },
          ],
        },
        { id: 'list', label: 'Show corpus', path: 'corpus', method: 'GET', fields: [] },
        {
          id: 'speak',
          label: 'Answer from policy',
          path: 'speak',
          fields: [
            { name: 'agencyId', label: 'Agency', placeholder: 'moh-ke' },
            {
              name: 'question',
              label: 'Question',
              type: 'textarea',
              placeholder: 'Is childhood vaccination free?',
            },
            { name: 'speak', label: 'Also synthesize audio', placeholder: 'true' },
          ],
        },
      ]}
    />
  );
}
