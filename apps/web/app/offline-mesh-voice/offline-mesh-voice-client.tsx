'use client';

import { MoonshotConsole } from '@/components/moonshot-console';

export function OfflineMeshVoiceClient() {
  return (
    <MoonshotConsole
      title="Offline Mesh Voice"
      apiBase="/v1/offline-mesh-voice"
      actions={[
  {
    "id": "register",
    "label": "Register node",
    "path": "nodes",
    "fields": [
      {
        "name": "nodeId",
        "label": "Node id",
        "placeholder": "clinic-kisumu-01"
      },
      {
        "name": "site",
        "label": "Site",
        "placeholder": "Kisumu Level 5"
      },
      {
        "name": "country",
        "label": "Country",
        "placeholder": "KE"
      },
      {
        "name": "capabilities",
        "label": "Capabilities",
        "placeholder": "stt,tts"
      }
    ]
  },
  {
    "id": "nodes",
    "label": "List nodes",
    "path": "nodes",
    "method": "GET",
    "fields": []
  },
  {
    "id": "enqueue",
    "label": "Enqueue job",
    "path": "queue",
    "fields": [
      {
        "name": "nodeId",
        "label": "Node id",
        "placeholder": "clinic-kisumu-01"
      },
      {
        "name": "kind",
        "label": "Kind",
        "placeholder": "stt"
      },
      {
        "name": "payload",
        "label": "Payload note",
        "placeholder": "triage_clip_042.wav"
      }
    ]
  },
  {
    "id": "sync",
    "label": "Sync node",
    "path": "sync",
    "fields": [
      {
        "name": "nodeId",
        "label": "Node id",
        "placeholder": "clinic-kisumu-01"
      }
    ]
  }
]}
    />
  );
}
