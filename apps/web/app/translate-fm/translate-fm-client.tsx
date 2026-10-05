'use client';

import { OwnModelStudio } from '@/components/own-model-studio';

export function TranslateFmClient() {
  return (
    <OwnModelStudio
      modelId="translate-fm"
      enginePath="/v1/translate-fm/engine"
      crumbExtra={[{ href: '/atlas', label: 'Atlas' }]}
    />
  );
}
