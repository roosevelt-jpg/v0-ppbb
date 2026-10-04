'use client';

import { MoonshotConsole } from '@/components/moonshot-console';

export function ComplianceAttestationsClient() {
  return (
    <MoonshotConsole
      title="Compliance Attestations"
      apiBase="/v1/compliance-attestations"
      actions={[
        {
          id: 'issue',
          label: 'Issue attestation',
          path: 'issue',
          fields: [
          { name: 'industry', label: 'Industry', placeholder: 'banking' },
          { name: 'framework', label: 'Framework', placeholder: 'POPIA' },
          { name: 'region', label: 'Region', placeholder: 'af' }
          ],
        },
        {
          id: 'verify',
          label: 'Verify attestation',
          path: 'verify',
          fields: [
          { name: 'attestationId', label: 'Attestation id', placeholder: '' },
          { name: 'token', label: 'Token', placeholder: '' }
          ],
        },
        {
          id: 'dpa',
          label: 'Generate industry DPA',
          path: 'dpa',
          fields: [
          { name: 'industry', label: 'Industry', placeholder: 'healthcare' },
          { name: 'counterparty', label: 'Counterparty', placeholder: 'Acme Bank KE' }
          ],
        },
        {
          id: 'evidence',
          label: 'Export evidence pack',
          path: 'evidence',
          fields: [
          { name: 'attestationId', label: 'Attestation id', placeholder: '' },
          { name: 'format', label: 'Format', placeholder: 'json' }
          ],
        },
        {
          id: 'frameworks',
          label: 'List frameworks',
          path: 'frameworks',
          method: 'GET',
          fields: [

          ],
        },
        {
          id: 'industries',
          label: 'List industries',
          path: 'industries',
          method: 'GET',
          fields: [

          ],
        }
      ]}
    />
  );
}
