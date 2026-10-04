# @verbalab/mcp

Stdio MCP bridge for VerbaLab Partner Connectors (Own AI tools for Claude, Cursor, ChatGPT agents, video platforms).

```bash
export VERBALAB_API_URL=http://localhost:4000
export VERBALAB_API_KEY=vl_test_…
pnpm --filter @verbalab/mcp build
pnpm --filter @verbalab/mcp start
```

Cursor / Claude Desktop `mcp.json`:

```json
{
  "mcpServers": {
    "verbalab": {
      "command": "node",
      "args": ["packages/mcp/dist/stdio.js"],
      "env": {
        "VERBALAB_API_URL": "http://localhost:4000",
        "VERBALAB_API_KEY": "vl_test_…"
      }
    }
  }
}
```

HTTP MCP (no stdio): `POST /v1/partner-connectors/mcp`  
Manifest: `GET /v1/partner-connectors/mcp/manifest`
