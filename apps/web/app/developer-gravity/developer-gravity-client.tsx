'use client';

import { MoonshotConsole } from '@/components/moonshot-console';

export function DeveloperGravityClient() {
  return (
    <MoonshotConsole
      title="Developer Gravity"
      apiBase="/v1/developer-gravity"
      actions={[
        {
          id: 'sandbox',
          label: 'Create sandbox',
          path: 'sandbox',
          fields: [
          { name: 'name', label: 'Name', placeholder: 'hackathon-ng' },
          { name: 'tier', label: 'Tier', placeholder: 'trial' }
          ],
        },
        {
          id: 'quickstart',
          label: 'Generate quickstart',
          path: 'quickstart',
          fields: [
          { name: 'language', label: 'Language', placeholder: 'typescript' },
          { name: 'product', label: 'Product', placeholder: 'verba-voice' }
          ],
        },
        {
          id: 'refs',
          label: 'Resolve API refs',
          path: 'refs',
          fields: [
          { name: 'product', label: 'Product', placeholder: 'meeting-transcription' }
          ],
        },
        {
          id: 'sample',
          label: 'Scaffold sample app',
          path: 'sample',
          fields: [
          { name: 'template', label: 'Template', placeholder: 'voice-chat' },
          { name: 'stack', label: 'Stack', placeholder: 'next' }
          ],
        },
        {
          id: 'catalog',
          label: 'DX catalog',
          path: 'catalog',
          method: 'GET',
          fields: [

          ],
        }
      ]}
    />
  );
}
