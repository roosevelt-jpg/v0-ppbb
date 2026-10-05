'use client';

import { OwnModelStudio } from '@/components/own-model-studio';

export function VectorFmClient() {
  return (
    <OwnModelStudio
      modelId="vector-fm"
      enginePath="/v1/vector-fm/engine"
      crumbExtra={[{ href: '/atlas', label: 'Atlas' }]}
    />
  );
}
