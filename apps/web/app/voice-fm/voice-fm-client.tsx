'use client';

import { OwnModelStudio } from '@/components/own-model-studio';

export function VoiceFmClient() {
  return (
    <OwnModelStudio
      modelId="voice-fm"
      enginePath="/v1/voice-fm/engine"
      crumbExtra={[{ href: '/atlas', label: 'Atlas' }]}
    />
  );
}
