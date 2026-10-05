'use client';

import { MoonshotConsole } from '@/components/moonshot-console';

export function JusticeLanguageAccessClient() {
  return (
    <MoonshotConsole
      title="Justice Language Access"
      apiBase="/v1/justice-language-access"
      actions={[
        {
          id: 'cases',
          label: 'List cases',
          path: 'cases',
          method: 'GET',
          fields: [

          ],
        },
        {
          id: 'ingest',
          label: 'Ingest testimony',
          path: 'ingest',
          fields: [
            { name: 'testimony', label: 'Testimony', placeholder: 'Nilielewa mashtaka lakini nahitaji mkalimani.', type: 'textarea' },
            { name: 'speakerLanguage', label: 'Speaker language', placeholder: 'sw', type: 'text' },
            { name: 'courtLanguage', label: 'Court language', placeholder: 'en', type: 'text' },
            { name: 'country', label: 'Country', placeholder: 'KE', type: 'text' },
            { name: 'matter', label: 'Matter', placeholder: 'criminal_defense', type: 'text' },
            { name: 'role', label: 'Role', placeholder: 'defendant', type: 'text' }
          ],
        },
        {
          id: 'brief',
          label: 'Build defense brief',
          path: 'brief',
          fields: [
            { name: 'caseId', label: 'Case id (optional)', placeholder: '', type: 'text' },
            { name: 'testimony', label: 'Testimony if no caseId', placeholder: 'Sijaelewa hati ninayoulizwa kusaini.', type: 'textarea' },
            { name: 'speakerLanguage', label: 'Speaker language', placeholder: 'sw', type: 'text' },
            { name: 'courtLanguage', label: 'Court language', placeholder: 'en', type: 'text' },
            { name: 'country', label: 'Country', placeholder: 'KE', type: 'text' }
          ],
        },
        {
          id: 'rights',
          label: 'Rights plain summary',
          path: 'rights',
          fields: [
            { name: 'country', label: 'Country', placeholder: 'KE', type: 'text' },
            { name: 'speakerLanguage', label: 'Speaker language', placeholder: 'sw', type: 'text' },
            { name: 'courtLanguage', label: 'Court language', placeholder: 'en', type: 'text' }
          ],
        }
      ]}
    />
  );
}
