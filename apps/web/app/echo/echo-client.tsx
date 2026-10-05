'use client';

import { OwnModelStudio } from '@/components/own-model-studio';

export function EchoClient() {
  return (
    <OwnModelStudio
      modelId="echo"
      enginePath="/v1/echo/engine"
      crumbExtra={[{ href: '/atlas', label: 'Atlas' }]}
    />
  );
}
