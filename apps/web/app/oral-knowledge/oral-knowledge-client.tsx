'use client';

import { MoonshotConsole } from '@/components/moonshot-console';

export function OralKnowledgeClient() {
  return (
    <MoonshotConsole
      title="Oral-First Knowledge OS"
      apiBase="/v1/oral-knowledge"
      actions={[
        {
          id: 'ingest',
          label: 'Ingest oral source',
          path: 'ingest',
          fields: [
            { name: 'title', label: 'Title', placeholder: 'Elder market story' },
            { name: 'collection', label: 'Collection', placeholder: 'elders' },
            { name: 'sourceKind', label: 'Source kind', placeholder: 'radio | whatsapp | market | elder' },
            { name: 'dialect', label: 'Dialect', placeholder: 'yo' },
            {
              name: 'transcript',
              label: 'Transcript / oral text',
              type: 'textarea',
              placeholder: 'Consented transcript of the voice note…',
            },
            { name: 'speakerConsent', label: 'Speaker consented', type: 'checkbox' },
          ],
          buildBody: (v) => ({
            ...v,
            speakerConsent: v.speakerConsent === 'true',
          }),
        },
        {
          id: 'query',
          label: 'Ask oral knowledge',
          path: 'query',
          fields: [
            {
              name: 'question',
              label: 'Question',
              type: 'textarea',
              placeholder: 'What did elders say about market prices?',
            },
          ],
        },
        {
          id: 'cite',
          label: 'Cite source',
          path: 'cite',
          fields: [{ name: 'itemId', label: 'Item id', placeholder: 'from ingest result' }],
        },
        { id: 'collections', label: 'Collections', path: 'collections', method: 'GET', fields: [] },
      ]}
    />
  );
}
