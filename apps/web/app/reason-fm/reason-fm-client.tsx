'use client';

import { OwnModelStudio } from '@/components/own-model-studio';

export function ReasonFmClient() {
  return (
    <OwnModelStudio
      modelId="reason-fm"
      enginePath="/v1/reason-fm/engine"
      crumbExtra={[{ href: '/atlas', label: 'Atlas' }]}
    />
  );
}
