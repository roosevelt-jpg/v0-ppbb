# Agent Voice Training

Train AI agents to **speak like VerbaLab models** across African languages and beyond.

## Who it’s for

Agent builders wiring VerbaLab STT/TTS/voice-LLM into LangChain, custom runtimes, contact-center bots, or civic agents.

## What’s wired

| Endpoint | Purpose |
|---|---|
| `GET /v1/agent-voice-training/engine` | Product catalog + honesty |
| `GET /v1/agent-voice-training/models` | VerbaLab speech models (Atlas, Echo, VerbaVoice, clones…) |
| `GET /v1/agent-voice-training/languages` | African Language Registry + global trade languages |
| `POST /v1/agent-voice-training/personas` | Create a speech persona (model + languages + style) |
| `POST /v1/agent-voice-training/personas/:id/train` | Bind routing/style pack → `ready` |
| `POST /v1/agent-voice-training/personas/:id/preview` | Preview a spoken line in a selected language |
| `GET /v1/agent-voice-training/personas/:id/sdk` | Export system prompt + client snippet |
| `POST /v1/agent-voice-training/export-pack` | Audit + return full pack |

## Flow

1. List models and languages  
2. Create a persona (`baseModelId`, `languages`, optional `systemPrompt`)  
3. Train → status `ready`  
4. Preview speech / export SDK pack into your agent runtime  
5. Call VerbaLab STT + TTS APIs with the persona’s `voiceProfile`

## Honesty

Persona training configures **routing and style packs** against VerbaLab APIs. It does not ship proprietary model weights. Voice clone enrollment still requires consent via Voice Cloning.

## Console

`/agent-voice-training`
