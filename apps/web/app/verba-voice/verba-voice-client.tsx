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
        {
          id: 'turns',
          label: 'Audio turn',
          path: 'turns',
          fields: [
            { name: 'sessionId', label: 'Session id', placeholder: 'from open session' },
            { name: 'file', label: 'Voice clip', type: 'file' },
            { name: 'language', label: 'Language', placeholder: 'sw' },
          ],
        },
        {
          id: 'webrtc',
          label: 'Open duplex WebRTC',
          path: 'webrtc',
          fields: [
            { name: 'sessionId', label: 'Session id', placeholder: 'from open session' },
            { name: 'bargeIn', label: 'Barge-in (true/false)', placeholder: 'true' },
          ],
        },
        {
          id: 'webrtc-signal',
          label: 'WebRTC signal',
          path: 'webrtc/signal',
          fields: [
            { name: 'sessionId', label: 'Session id', placeholder: 'from open session' },
            { name: 'kind', label: 'Kind', placeholder: 'offer' },
            {
              name: 'sdp',
              label: 'SDP (optional)',
              type: 'textarea',
              placeholder: 'v=0...',
            },
          ],
        },
        {
          id: 'barge-in',
          label: 'Barge-in control',
          path: 'webrtc/barge-in',
          fields: [
            { name: 'sessionId', label: 'Session id', placeholder: 'from open session' },
            { name: 'action', label: 'Action', placeholder: 'interrupt' },
          ],
        },
      ]}
    />
  );
}
