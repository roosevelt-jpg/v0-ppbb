'use client';

import { MoonshotConsole } from '@/components/moonshot-console';

export function InterpreterMeshClient() {
  return (
    <MoonshotConsole
      title="Interpreter Mesh"
      apiBase="/v1/interpreter-mesh"
      actions={[
        {
          id: 'sessions',
          label: 'Create session',
          path: 'sessions',
          fields: [{ name: 'title', label: 'Title', placeholder: 'Border / clinic mesh' }],
        },
        {
          id: 'listen',
          label: 'Add listener',
          path: 'listen',
          fields: [
            { name: 'sessionId', label: 'Session id' },
            { name: 'label', label: 'Listener label', placeholder: 'Nurse FR' },
            { name: 'dialect', label: 'Dialect / lang', placeholder: 'fr' },
            { name: 'register', label: 'Register', placeholder: 'formal | market | neutral' },
          ],
        },
        {
          id: 'broadcast',
          label: 'Broadcast utterance',
          path: 'broadcast',
          fields: [
            { name: 'sessionId', label: 'Session id' },
            {
              name: 'text',
              label: 'Speaker text',
              type: 'textarea',
              placeholder: 'Bei ya dawa ni shilingi elfu mbili.',
            },
          ],
        },
        { id: 'backbone', label: 'Backbone model', path: 'backbone', method: 'GET', fields: [] },
      ]}
    />
  );
}
