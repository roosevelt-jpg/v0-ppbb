'use client';

import { MoonshotConsole } from '@/components/moonshot-console';

export function AfricaEvalMatrixClient() {
  return (
    <MoonshotConsole
      title="Africa Eval Matrix"
      apiBase="/v1/africa-eval-matrix"
      actions={[
        {
          id: 'score',
          label: 'Score sample',
          path: 'score',
          fields: [
          { name: 'language', label: 'Language', placeholder: 'sw' },
          { name: 'domain', label: 'Domain', placeholder: 'banking' },
          {
            name: 'hypothesis',
            label: 'Hypothesis',
            type: 'textarea',
            placeholder: 'karibu benki',
          },
          {
            name: 'reference',
            label: 'Reference',
            type: 'textarea',
            placeholder: 'karibu benki',
          }
          ],
        },
        {
          id: 'compare',
          label: 'Compare models',
          path: 'compare',
          fields: [
          { name: 'language', label: 'Language', placeholder: 'yo' },
          { name: 'models', label: 'Models', placeholder: 'echo,whisper-stub' },
          { name: 'metric', label: 'Metric', placeholder: 'wer' }
          ],
        },
        {
          id: 'suite',
          label: 'Run matrix suite',
          path: 'suite',
          fields: [
          { name: 'suiteId', label: 'Suite id', placeholder: 'af-core-40' },
          { name: 'models', label: 'Models', placeholder: 'echo' }
          ],
        },
        {
          id: 'publish',
          label: 'Publish slice',
          path: 'publish',
          fields: [
          { name: 'suiteId', label: 'Suite id', placeholder: 'af-core-40' },
          { name: 'visibility', label: 'Visibility', placeholder: 'buyer' }
          ],
        },
        {
          id: 'matrix',
          label: 'View matrix',
          path: 'matrix',
          method: 'GET',
          fields: [

          ],
        },
        {
          id: 'languages',
          label: 'Covered languages',
          path: 'languages',
          method: 'GET',
          fields: [

          ],
        }
      ]}
    />
  );
}
