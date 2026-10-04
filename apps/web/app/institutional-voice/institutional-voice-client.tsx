'use client';

import { MoonshotConsole } from '@/components/moonshot-console';

export function InstitutionalVoiceClient() {
  return (
    <MoonshotConsole
      title="Policy-Bound Institutional Voice"
      apiBase="/v1/institutional-voice"
      actions={[
  {
    "id": "agency",
    "label": "Register agency",
    "path": "agencies",
    "fields": [
      {
        "name": "agencyId",
        "label": "Agency id",
        "placeholder": "moh-ke"
      },
      {
        "name": "name",
        "label": "Agency name",
        "placeholder": "Ministry of Health Kenya"
      },
      {
        "name": "voiceId",
        "label": "Voice id",
        "placeholder": "alloy"
      }
    ]
  },
  {
    "id": "ingest",
    "label": "Ingest policy",
    "path": "corpus",
    "fields": [
      {
        "name": "agencyId",
        "label": "Agency id",
        "placeholder": "moh-ke"
      },
      {
        "name": "title",
        "label": "Document title",
        "placeholder": "Gazette Notice 12/2026"
      },
      {
        "name": "body",
        "label": "Policy text",
        "type": "textarea",
        "placeholder": "Vaccination is free at public clinics\u2026"
      }
    ]
  },
  {
    "id": "list",
    "label": "List corpus",
    "path": "corpus",
    "method": "GET",
    "fields": []
  },
  {
    "id": "speak",
    "label": "Policy-bound speak",
    "path": "speak",
    "fields": [
      {
        "name": "agencyId",
        "label": "Agency id",
        "placeholder": "moh-ke"
      },
      {
        "name": "question",
        "label": "Citizen question",
        "type": "textarea",
        "placeholder": "Is childhood vaccination free?"
      }
    ]
  }
]}
    />
  );
}
