'use client';

import { MoonshotConsole } from '@/components/moonshot-console';

export function VerbaVoiceClient() {
  return (
    <MoonshotConsole
      title="Verba Voice"
      apiBase="/v1/verba-voice"
      actions={[
        {
          id: 'sessions',
          label: 'Open voice session',
          path: 'sessions',
          fields: [
            { name: 'language', label: 'Language', placeholder: 'sw' },
            { name: 'voice', label: 'Voice', placeholder: 'alloy' },
          ],
        },
        {
          id: 'text-turns',
          label: 'Text turn (+ spoken reply)',
          path: 'text-turns',
          fields: [
            { name: 'sessionId', label: 'Session id', placeholder: 'from open session' },
            {
              name: 'text',
              label: 'What you said',
              type: 'textarea',
              placeholder: 'Habari yako? Tell me about markets in Nairobi.',
            },
            { name: 'language', label: 'Language', placeholder: 'sw' },
          ],
        },
      ]}
    />
  );
}
