'use client';

import { SovereignStudio, SOVEREIGN_SIBLINGS } from '@/components/sovereign-studio';

export function OfflineMeshVoiceClient() {
  return (
    <SovereignStudio
      title="Offline Mesh Voice"
      apiBase="/v1/offline-mesh-voice"
      siblingLinks={[...SOVEREIGN_SIBLINGS]}
      actions={[
        {
          id: 'register',
          label: 'Register node',
          path: 'nodes',
          fields: [
            { name: 'nodeId', label: 'Node', placeholder: 'clinic-kisumu-01' },
            { name: 'site', label: 'Site', placeholder: 'Kisumu Level 5' },
            { name: 'country', label: 'Country', placeholder: 'KE' },
            { name: 'capabilities', label: 'Capabilities', placeholder: 'stt,tts' },
          ],
        },
        { id: 'nodes', label: 'Show nodes', path: 'nodes', method: 'GET', fields: [] },
        {
          id: 'enqueue',
          label: 'Queue offline job',
          path: 'queue',
          fields: [
            { name: 'nodeId', label: 'Node', placeholder: 'clinic-kisumu-01' },
            { name: 'kind', label: 'Kind', placeholder: 'stt' },
            { name: 'payload', label: 'Payload', placeholder: 'triage_clip_042.wav' },
          ],
        },
        {
          id: 'sync',
          label: 'Sync when online',
          path: 'sync',
          fields: [{ name: 'nodeId', label: 'Node', placeholder: 'clinic-kisumu-01' }],
        },
      ]}
    />
  );
}
