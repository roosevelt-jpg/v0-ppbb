'use client';

import { MoonshotConsole } from '@/components/moonshot-console';

export function AgentVoiceTrainingClient() {
  return (
    <MoonshotConsole
      title="Agent Voice Training"
      apiBase="/v1/agent-voice-training"
      actions={[
        {
          id: 'models',
          label: 'List VerbaLab speech models',
          path: 'models',
          method: 'GET',
          fields: [],
        },
        {
          id: 'languages',
          label: 'List Africa + beyond languages',
          path: 'languages',
          method: 'GET',
          fields: [{ name: 'q', label: 'Filter', placeholder: 'swahili' }],
        },
        {
          id: 'create',
          label: 'Create agent speech persona',
          path: 'personas',
          fields: [
            { name: 'name', label: 'Persona name', placeholder: 'Support agent — East Africa' },
            { name: 'baseModelId', label: 'Base model', placeholder: 'atlas-tts' },
            { name: 'languages', label: 'Languages (csv)', placeholder: 'sw,yo,en,fr' },
            { name: 'style', label: 'Style', placeholder: 'warm-professional' },
            {
              name: 'systemPrompt',
              label: 'System prompt (optional)',
              placeholder: 'Speak like VerbaLab models…',
            },
          ],
        },
        {
          id: 'train',
          label: 'Train persona',
          path: 'personas/{id}/train',
          fields: [
            { name: 'id', label: 'Persona id', placeholder: 'avp_…' },
            { name: 'epochs', label: 'Epochs', placeholder: '3' },
          ],
        },
        {
          id: 'preview',
          label: 'Preview speak line',
          path: 'personas/{id}/preview',
          fields: [
            { name: 'id', label: 'Persona id', placeholder: 'avp_…' },
            { name: 'language', label: 'Language', placeholder: 'sw' },
            { name: 'text', label: 'Text', placeholder: 'Habari! Ninafurahi kukusaidia.' },
          ],
        },
        {
          id: 'sdk',
          label: 'Export SDK pack',
          path: 'personas/{id}/sdk',
          method: 'GET',
          fields: [{ name: 'id', label: 'Persona id', placeholder: 'avp_…' }],
        },
        {
          id: 'export',
          label: 'Export training pack',
          path: 'export-pack',
          fields: [{ name: 'personaId', label: 'Persona id', placeholder: 'avp_…' }],
        },
        {
          id: 'personas',
          label: 'List personas',
          path: 'personas',
          method: 'GET',
          fields: [],
        },
      ]}
    />
  );
}
