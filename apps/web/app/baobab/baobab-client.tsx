'use client';

import { OwnModelStudio } from '@/components/own-model-studio';

export function BaobabClient() {
  return (
    <OwnModelStudio
      modelId="baobab"
      enginePath="/v1/baobab/engine"
      crumbExtra={[{ href: '/atlas', label: 'Atlas' }]}
    />
  );
}
