'use client';

import { MoonshotConsole } from '@/components/moonshot-console';

export function SovereignFlywheelClient() {
  return (
    <MoonshotConsole
      title="Sovereign Data Flywheel"
      apiBase="/v1/sovereign-flywheel"
      actions={[
        {
          id: 'ingest',
          label: 'Ingest consented batch',
          path: 'ingest',
          fields: [
          { name: 'source', label: 'Source', placeholder: 'call-center' },
          { name: 'language', label: 'Language', placeholder: 'ha' },
          { name: 'consentToken', label: 'Consent token', placeholder: 'cns_demo' }
          ],
        },
        {
          id: 'curate',
          label: 'Curate dataset',
          path: 'curate',
          fields: [
          { name: 'datasetId', label: 'Dataset id', placeholder: '' },
          { name: 'minQuality', label: 'Min quality', placeholder: '0.7' }
          ],
        },
        {
          id: 'finetune',
          label: 'Start fine-tune job',
          path: 'finetune',
          fields: [
          { name: 'datasetId', label: 'Dataset id', placeholder: '' },
          { name: 'baseModel', label: 'Base model', placeholder: 'atlas' },
          { name: 'region', label: 'Region', placeholder: 'af' }
          ],
        },
        {
          id: 'promote',
          label: 'Promote model drop',
          path: 'promote',
          fields: [
          { name: 'jobId', label: 'Job id', placeholder: '' },
          { name: 'channel', label: 'Channel', placeholder: 'model-keys' }
          ],
        },
        {
          id: 'datasets',
          label: 'List datasets',
          path: 'datasets',
          method: 'GET',
          fields: [

          ],
        },
        {
          id: 'jobs',
          label: 'List jobs',
          path: 'jobs',
          method: 'GET',
          fields: [

          ],
        }
      ]}
    />
  );
}
