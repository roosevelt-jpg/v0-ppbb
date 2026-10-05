'use client';

import { MoonshotConsole } from '@/components/moonshot-console';

export function IntentPreservingDubClient() {
  return (
    <MoonshotConsole
      title="Intent-Preserving Dub"
      apiBase="/v1/intent-preserving-dub"
      actions={[
        {
          id: 'analyze',
          label: 'Analyze pragmatics',
          path: 'analyze',
          fields: [
            {
              name: 'text',
              label: 'Source line',
              type: 'textarea',
              placeholder: 'Mheshimiwa, inshallah the price will drop — haha!',
            },
          ],
        },
        {
          id: 'dub',
          label: 'Dub with intent',
          path: 'dub',
          fields: [
            {
              name: 'text',
              label: 'Source',
              type: 'textarea',
              placeholder: 'Karibu sana — asante, mheshimiwa.',
            },
            { name: 'target', label: 'Target lang', placeholder: 'fr' },
            { name: 'source', label: 'Source lang', placeholder: 'auto' },
          ],
        },
        {
          id: 'score',
          label: 'Score social effect',
          path: 'score',
          fields: [
            { name: 'sourceText', label: 'Source text', type: 'textarea' },
            { name: 'dubbed', label: 'Dubbed text', type: 'textarea' },
          ],
        },
        { id: 'profiles', label: 'Culture profiles', path: 'profiles', method: 'GET', fields: [] },
      ]}
    />
  );
}
