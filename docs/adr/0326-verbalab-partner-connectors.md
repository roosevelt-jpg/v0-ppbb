# ADR-0326 — VerbaLab Partner Connectors (MCP / CLI / REST)

## Status

Accepted — 2026-10-03

## Context

VerbaLab had Slack connectors + a Connector Marketplace of entitlement SKUs, but no first-class APIs for video/LLM platforms (Higgsfield, Claude, Cursor, Runway, …) to consume Own AI via MCP, CLI, or partner REST.

## Decision

Ship **Partner Connectors** (`/partner-connectors`, `/v1/partner-connectors/*`):

1. Platform catalog — Higgsfield, Claude, Cursor, ChatGPT, Runway, Pika, Luma, Kling, HeyGen, Synthesia, custom.
2. Own AI tool surface — translate, detect, TTS, STT, chat, embed, voice clone, video-voice, African eval, runtime status.
3. **MCP** — HTTP JSON-RPC (`POST …/mcp`) + stdio bridge (`@verbalab/mcp` / `verbalab-mcp`).
4. **CLI/SDK** — `partner-*` commands and SDK methods.
5. Installations + webhook ping for async video pipelines.
6. Marketplace catalog entries with real `api` paths (ADR-0158 extended, still not Zapier iPaaS OS).

## Honesty

- APIs are real and callable over Own AI.
- Signed production listings inside Higgsfield/Claude marketplaces are business/deploy steps (`liveHiggsfieldContractSigned=false`, `liveClaudePluginStoreListing=false`).
- Not an iPaaS / Zapier OS.

## Consequences

External video and agent platforms can integrate VerbaLab as the African Own AI layer without renting ElevenLabs/OpenAI for those modalities.
