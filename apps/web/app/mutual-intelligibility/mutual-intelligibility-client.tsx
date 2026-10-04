'use client';

import { MoonshotConsole } from '@/components/moonshot-console';

export function MutualIntelligibilityClient() {
  return (
    <MoonshotConsole
      title="African Mutual-Intelligibility Fabric"
      apiBase="/v1/mutual-intelligibility"
      actions={[
  {
    "id": "corridors",
    "label": "List corridors",
    "path": "corridors",
    "method": "GET",
    "fields": []
  },
  {
    "id": "bridge",
    "label": "Bridge utterance",
    "path": "bridge",
    "fields": [
      {
        "name": "corridorId",
        "label": "Corridor",
        "placeholder": "eac"
      },
      {
        "name": "sourceLocale",
        "label": "Source locale",
        "placeholder": "rw"
      },
      {
        "name": "targetLocale",
        "label": "Target locale",
        "placeholder": "sw"
      },
      {
        "name": "text",
        "label": "Utterance",
        "type": "textarea",
        "placeholder": "Muraho, dukeneye ubufasha bwihutirwa."
      }
    ]
  },
  {
    "id": "score",
    "label": "Score pair",
    "path": "score",
    "fields": [
      {
        "name": "sourceLocale",
        "label": "Source",
        "placeholder": "yo"
      },
      {
        "name": "targetLocale",
        "label": "Target",
        "placeholder": "ig"
      },
      {
        "name": "text",
        "label": "Text",
        "type": "textarea"
      }
    ]
  }
]}
    />
  );
}
