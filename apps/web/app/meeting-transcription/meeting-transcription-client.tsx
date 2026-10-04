'use client';

import { MoonshotConsole } from '@/components/moonshot-console';

export function MeetingTranscriptionClient() {
  return (
    <MoonshotConsole
      title="Meeting Transcription"
      apiBase="/v1/meeting-transcription"
      actions={[
        {
          id: 'languages',
          label: 'Africa-wide languages',
          path: 'languages',
          method: 'GET',
          fields: [],
        },
        {
          id: 'sessions',
          label: 'Start meeting session',
          path: 'sessions',
          fields: [
            { name: 'title', label: 'Title', placeholder: 'Board standup' },
            { name: 'language', label: 'Source language', placeholder: 'sw' },
            { name: 'translateTo', label: 'Translate to', placeholder: 'en' },
          ],
        },
        {
          id: 'recap',
          label: 'Spoken recap',
          path: 'recap',
          fields: [
            {
              name: 'text',
              label: 'Transcript',
              type: 'textarea',
              placeholder: 'Paste meeting transcript…',
            },
            { name: 'language', label: 'Language', placeholder: 'en' },
            { name: 'voice', label: 'Voice', placeholder: 'alloy' },
          ],
        },
      ]}
    />
  );
}
