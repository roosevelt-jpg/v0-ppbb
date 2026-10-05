'use client';

import { MoonshotConsole } from '@/components/moonshot-console';

export function VoiceTrustGraphClient() {
  return (
    <MoonshotConsole
      title="Voice Trust Graph"
      apiBase="/v1/voice-trust-graph"
      actions={[
        {
          id: 'nodes',
          label: 'Add node',
          path: 'nodes',
          fields: [
            { name: 'name', label: 'Name', placeholder: 'Amina Diallo' },
            { name: 'kind', label: 'Kind', placeholder: 'person | community | org' },
            { name: 'country', label: 'Country', placeholder: 'SN' },
          ],
        },
        {
          id: 'consent',
          label: 'Grant consent',
          path: 'consent',
          fields: [
            { name: 'fromNodeId', label: 'From node id', placeholder: 'cuid…' },
            { name: 'toNodeId', label: 'To node id', placeholder: 'cuid…' },
            { name: 'purpose', label: 'Purpose', placeholder: 'voice_clone' },
            { name: 'country', label: 'Country', placeholder: 'KE' },
          ],
        },
        {
          id: 'witness',
          label: 'Add witness',
          path: 'witness',
          fields: [
            { name: 'edgeId', label: 'Consent edge id', placeholder: 'cuid…' },
            { name: 'witnessName', label: 'Witness name', placeholder: 'Community elder' },
          ],
        },
        {
          id: 'check',
          label: 'Authorize clone',
          path: 'check',
          fields: [
            { name: 'fromNodeId', label: 'From node id' },
            { name: 'toNodeId', label: 'To node id' },
            { name: 'purpose', label: 'Purpose', placeholder: 'voice_clone' },
            { name: 'country', label: 'Country', placeholder: 'KE' },
          ],
          buildBody: (v) => ({ ...v }),
        },
        {
          id: 'revoke',
          label: 'Revoke',
          path: 'revoke',
          fields: [
            { name: 'edgeId', label: 'Edge id' },
            { name: 'reason', label: 'Reason', placeholder: 'Consent withdrawn' },
          ],
        },
      ]}
    />
  );
}
