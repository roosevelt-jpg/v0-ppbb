# VerbaLab Partner Connectors

Own-AI connector APIs for video generators, LLM agents, and IDEs — **REST, MCP, CLI, SDK, webhooks**.

## Platforms

Higgsfield · Claude · Cursor · ChatGPT · Runway · Pika · Luma · Kling · HeyGen · Synthesia · custom

## Protocols

| Protocol | How |
| --- | --- |
| REST | `POST /v1/partner-connectors/invoke` with Bearer `vl_*` |
| MCP HTTP | `POST /v1/partner-connectors/mcp` (JSON-RPC `tools/list`, `tools/call`) |
| MCP stdio | `@verbalab/mcp` → `verbalab-mcp` |
| CLI | `verbalab partner-invoke …` |
| SDK | `vl.partnerInvoke` / `vl.partnerMcp` |
| Webhooks | Install platform + `POST /v1/partner-connectors/webhooks/test` |

## Tools

`verbalab_translate` · `verbalab_detect_language` · `verbalab_tts` · `verbalab_list_voices` · `verbalab_stt` · `verbalab_chat` · `verbalab_embed` · `verbalab_voice_clone` · `verbalab_video_voice` · `verbalab_african_eval` · `verbalab_runtime_status`

## Claude / Cursor MCP

```json
{
  "mcpServers": {
    "verbalab": {
      "command": "node",
      "args": ["packages/mcp/dist/stdio.js"],
      "env": {
        "VERBALAB_API_URL": "https://api.your-domain.com",
        "VERBALAB_API_KEY": "vl_live_…"
      }
    }
  }
}
```

Or point HTTP MCP clients at `/v1/partner-connectors/mcp` using the manifest from `/v1/partner-connectors/mcp/manifest`.

### Higgsfield

Use `platformId: "higgsfield"` with `verbalab_video_voice`, `verbalab_tts`, `verbalab_translate` for dubbing / voiceover / subs. Register a webhook on install for async job pings.

### Claude

Prefer MCP (`tools/list` / `tools/call`) so Claude can call African Own AI tools directly.

### Custom

Any platform: OpenAPI + invoke + MCP. See ADR-0326.

## Console

`/partner-connectors`

## Honesty

Shipped connector contracts are VerbaLab-owned and production-callable. Marketplace store listings inside third-party platforms remain a business step.
