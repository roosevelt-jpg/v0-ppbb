'use client';

import { MoonshotConsole } from '@/components/moonshot-console';

export function CivicVoiceEvidenceClient() {
  return (
    <MoonshotConsole
      title="Civic Voice Evidence Chain"
      apiBase="/v1/civic-voice-evidence"
      actions={[
  {
    "id": "append",
    "label": "Append evidence",
    "path": "append",
    "fields": [
      {
        "name": "utterance",
        "label": "Utterance / transcript",
        "type": "textarea",
        "placeholder": "Official statement text"
      },
      {
        "name": "actor",
        "label": "Actor / role",
        "placeholder": "ministry_spokesperson"
      },
      {
        "name": "consentId",
        "label": "Consent id",
        "placeholder": "consent_\u2026"
      },
      {
        "name": "watermarkTip",
        "label": "Watermark tip",
        "placeholder": "wm_\u2026"
      }
    ]
  },
  {
    "id": "verify",
    "label": "Verify chain",
    "path": "verify",
    "fields": []
  },
  {
    "id": "export",
    "label": "Court export",
    "path": "export",
    "fields": [
      {
        "name": "fromSeq",
        "label": "From sequence",
        "placeholder": "1"
      },
      {
        "name": "toSeq",
        "label": "To sequence",
        "placeholder": "10"
      }
    ]
  },
  {
    "id": "chain",
    "label": "Chain tip",
    "path": "chain",
    "method": "GET",
    "fields": []
  }
]}
    />
  );
}
