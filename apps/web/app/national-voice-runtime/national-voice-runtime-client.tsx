'use client';

import { MoonshotConsole } from '@/components/moonshot-console';

export function NationalVoiceRuntimeClient() {
  return (
    <MoonshotConsole
      title="National Voice Sovereignty Runtime"
      apiBase="/v1/national-voice-runtime"
      actions={[
  {
    "id": "create",
    "label": "Create zone",
    "path": "zones",
    "fields": [
      {
        "name": "countryCode",
        "label": "ISO country",
        "placeholder": "KE"
      },
      {
        "name": "ministry",
        "label": "Controlling ministry",
        "placeholder": "ICT"
      },
      {
        "name": "region",
        "label": "Residency region",
        "placeholder": "af"
      }
    ]
  },
  {
    "id": "list",
    "label": "List zones",
    "path": "zones",
    "method": "GET",
    "fields": []
  },
  {
    "id": "dialects",
    "label": "Enable dialect pack",
    "path": "zones/{zoneId}/dialects",
    "fields": [
      {
        "name": "zoneId",
        "label": "Zone id"
      },
      {
        "name": "dialect",
        "label": "Dialect id",
        "placeholder": "sw-KE"
      }
    ]
  },
  {
    "id": "kill",
    "label": "Kill-switch",
    "path": "zones/{zoneId}/kill-switch",
    "fields": [
      {
        "name": "zoneId",
        "label": "Zone id"
      },
      {
        "name": "reason",
        "label": "Reason",
        "placeholder": "Election quiet period"
      },
      {
        "name": "armed",
        "label": "Arm (true/false)",
        "placeholder": "true"
      }
    ]
  },
  {
    "id": "audit",
    "label": "Audit export",
    "path": "zones/{zoneId}/audit-export",
    "fields": [
      {
        "name": "zoneId",
        "label": "Zone id"
      }
    ]
  }
]}
    />
  );
}
