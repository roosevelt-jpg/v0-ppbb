'use client';

import { OwnModelStudio } from '@/components/own-model-studio';

export function FusionClient() {
  return (
    <OwnModelStudio
      modelId="fusion"
      enginePath="/v1/fusion/engine"
      crumbExtra={[{ href: '/atlas', label: 'Atlas' }]}
    />
  );
}
