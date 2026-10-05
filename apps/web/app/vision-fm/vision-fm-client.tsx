'use client';

import { OwnModelStudio } from '@/components/own-model-studio';

export function VisionFmClient() {
  return (
    <OwnModelStudio
      modelId="vision-fm"
      enginePath="/v1/vision-fm/engine"
      crumbExtra={[{ href: '/atlas', label: 'Atlas' }]}
    />
  );
}
