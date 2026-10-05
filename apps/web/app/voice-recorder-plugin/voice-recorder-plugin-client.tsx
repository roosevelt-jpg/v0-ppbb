'use client';

import { MoonshotConsole } from '@/components/moonshot-console';

export function VoiceRecorderPluginClient() {
  return (
    <MoonshotConsole
      title="Phone Voice Recorder Plugin"
      apiBase="/v1/voice-recorder-plugin"
      actions={[
        {
          id: 'manifest',
          label: 'Install manifest',
          path: 'manifest?platform=android',
          method: 'GET',
          fields: [],
        },
        {
          id: 'sessions',
          label: 'Start recording session',
          path: 'sessions',
          fields: [
            { name: 'platform', label: 'Platform', placeholder: 'android' },
            { name: 'language', label: 'Language', placeholder: 'sw' },
            { name: 'tier', label: 'Speed tier', placeholder: 'standard' },
            { name: 'label', label: 'Label', placeholder: 'Field visit' },
          ],
        },
        {
          id: 'transcribe',
          label: 'Upload recording → text',
          path: 'transcribe',
          fields: [
            { name: 'sessionId', label: 'Session id', placeholder: 'from start session' },
            { name: 'file', label: 'Voice recording', type: 'file' },
            { name: 'language', label: 'Language', placeholder: 'sw' },
            { name: 'tier', label: 'Speed tier', placeholder: 'standard' },
            { name: 'title', label: 'Clip title', placeholder: 'Note 1' },
          ],
        },
        {
          id: 'finalize',
          label: 'Finalize session',
          path: 'finalize',
          fields: [
            { name: 'sessionId', label: 'Session id', placeholder: 'from start session' },
          ],
        },
      ]}
    />
  );
}
