'use client';

import { MoonshotConsole } from '@/components/moonshot-console';

export function SovereignVoiceOsClient() {
  return (
    <MoonshotConsole
      title="Sovereign Voice OS"
      apiBase="/v1/sovereign-voice-os"
      actions={[
  {
    "id": "pillars",
    "label": "List pillars",
    "path": "pillars",
    "method": "GET",
    "fields": []
  },
  {
    "id": "readiness",
    "label": "Buyer readiness",
    "path": "readiness",
    "method": "GET",
    "fields": []
  },
  {
    "id": "compose",
    "label": "Compose recipe",
    "path": "compose",
    "fields": [
      {
        "name": "countryCode",
        "label": "Country",
        "placeholder": "NG"
      },
      {
        "name": "sectors",
        "label": "Sectors",
        "placeholder": "health,justice,elections"
      },
      {
        "name": "corridors",
        "label": "Corridors",
        "placeholder": "ecowas"
      }
    ]
  }
]}
    />
  );
}
