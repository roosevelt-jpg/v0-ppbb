'use client';

import { MoonshotConsole } from '@/components/moonshot-console';

export function CivicTruthGuardClient() {
  return (
    <MoonshotConsole
      title="Civic Truth Guard"
      apiBase="/v1/civic-truth-guard"
      actions={[
        {
          id: 'signals',
          label: 'Integrity signals',
          path: 'signals',
          method: 'GET',
          fields: [

          ],
        },
        {
          id: 'assess',
          label: 'Assess claim',
          path: 'assess',
          fields: [
            { name: 'claim', label: 'Claim / caption', placeholder: 'BREAKING — share before deleted. This AI voice proves the minister said…', type: 'textarea' },
            { name: 'speakerName', label: 'Claimed speaker', placeholder: 'Minister Example', type: 'text' },
            { name: 'url', label: 'Source URL', placeholder: 'https://bit.ly/forwarded', type: 'text' },
            { name: 'sealToken', label: 'Seal token (optional)', placeholder: '', type: 'text' }
          ],
        },
        {
          id: 'verify-seal',
          label: 'Verify seal',
          path: 'verify-seal',
          fields: [
            { name: 'token', label: 'Civic seal token', placeholder: '', type: 'text' }
          ],
        },
        {
          id: 'report',
          label: 'Publish report',
          path: 'report',
          fields: [
            { name: 'assessmentId', label: 'Assessment id', placeholder: '', type: 'text' }
          ],
        }
      ]}
    />
  );
}
