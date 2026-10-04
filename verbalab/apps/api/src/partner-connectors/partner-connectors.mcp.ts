/**
 * MCP JSON-RPC 2.0 subset for Claude / Cursor / custom agents.
 * HTTP: POST /v1/partner-connectors/mcp
 * Stdio bridge: packages/mcp (verbalab-mcp)
 */
import { PARTNER_TOOLS, invokePartnerTool } from './partner-connectors.tools';

export type JsonRpcRequest = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
};

export type JsonRpcResponse = {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
};

export function mcpServerInfo() {
  return {
    name: 'verbalab-partner-connectors',
    version: '1.0.0',
    protocolVersion: '2024-11-05',
    description:
      'VerbaLab Own AI tools for video/LLM partners (Higgsfield, Claude, Cursor, Runway, …)',
    capabilities: {
      tools: {},
      logging: {},
    },
    instructions:
      'Use verbalab_* tools for African-first translate/TTS/STT/chat/video-voice. Authenticate HTTP with Bearer vl_* API key.',
  };
}

export function mcpManifest() {
  return {
    ...mcpServerInfo(),
    transport: {
      http: {
        url: '/v1/partner-connectors/mcp',
        methods: ['POST'],
      },
      stdio: {
        command: 'npx',
        args: ['verbalab-mcp'],
        package: '@verbalab/mcp',
      },
    },
    tools: PARTNER_TOOLS,
    auth: {
      type: 'bearer',
      prefixes: ['vl_live_', 'vl_test_'],
      header: 'Authorization',
    },
  };
}

export async function handleMcpRpc(body: JsonRpcRequest): Promise<JsonRpcResponse> {
  const id = body.id ?? null;
  const method = body.method?.trim();
  if (!method) {
    return { jsonrpc: '2.0', id, error: { code: -32600, message: 'Invalid Request' } };
  }

  try {
    switch (method) {
      case 'initialize':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            serverInfo: { name: 'verbalab-partner-connectors', version: '1.0.0' },
          },
        };
      case 'notifications/initialized':
      case 'initialized':
        return { jsonrpc: '2.0', id, result: {} };
      case 'ping':
        return { jsonrpc: '2.0', id, result: {} };
      case 'tools/list':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            tools: PARTNER_TOOLS.map((t) => ({
              name: t.name,
              description: t.description,
              inputSchema: t.inputSchema,
            })),
          },
        };
      case 'tools/call': {
        const params = body.params ?? {};
        const name = typeof params.name === 'string' ? params.name : '';
        const args =
          params.arguments && typeof params.arguments === 'object'
            ? (params.arguments as Record<string, unknown>)
            : {};
        const out = await invokePartnerTool(name, args);
        if (!out.ok) {
          return {
            jsonrpc: '2.0',
            id,
            result: {
              isError: true,
              content: [{ type: 'text', text: out.error }],
            },
          };
        }
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: JSON.stringify(out.result, null, 2) }],
            structuredContent: out.result,
          },
        };
      }
      default:
        return {
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Method not found: ${method}` },
        };
    }
  } catch (error) {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32000,
        message: error instanceof Error ? error.message : 'MCP error',
      },
    };
  }
}
