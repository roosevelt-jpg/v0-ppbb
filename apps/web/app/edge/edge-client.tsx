'use client';

import { OwnModelStudio } from '@/components/own-model-studio';

export function EdgeClient() {
  return (
    <OwnModelStudio
      modelId="edge"
      enginePath="/v1/edge/engine"
      crumbExtra={[{ href: '/atlas', label: 'Atlas' }]}
    />
  );
}
