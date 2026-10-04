# Agent Intelligence

Hub over agent-runtime, voice FAQ, AI orchestration pipelines, partner MCP tools, and the **full Agent OS**.

- Console: `/agent-intelligence`
- API: `GET /v1/agent-intelligence/engine`
- Agent OS engine: `GET /v1/agent-os/engine`
- Agent OS run: `POST /v1/agent-os/run`

## Full Agent OS

Shipped via the agent-operating-system module:

| Endpoint | Purpose |
| --- | --- |
| `GET /v1/agent-os/engine` | Agent OS capabilities + honesty (`fullAgentOs` / `multiAgentOs`) |
| `POST /v1/agent-os/run` | Run goal through orchestration (+ optional agent-runtime) |
| `GET /v1/agent-operating-system/engine` | Legacy façade catalog |
| `GET /v1/agent-operating-system/route` | Capability routing |

Honesty: `fullAgentOs: true`, `multiAgentOs: true`. This is a unifying orchestration layer over existing runtime/fabric/kernel surfaces — not a literal OS kernel or third agent executor.
