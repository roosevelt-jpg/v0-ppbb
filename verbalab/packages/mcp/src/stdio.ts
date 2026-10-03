#!/usr/bin/env node
/**
 * Stdio MCP bridge → VerbaLab Partner Connectors HTTP MCP endpoint.
 *
 * Claude Desktop / Cursor mcp.json example:
 * {
 *   "mcpServers": {
 *     "verbalab": {
 *       "command": "npx",
 *       "args": ["verbalab-mcp"],
 *       "env": {
 *         "VERBALAB_API_URL": "http://localhost:4000",
 *         "VERBALAB_API_KEY": "vl_test_…"
 *       }
 *     }
 *   }
 * }
 */
import { createInterface } from 'node:readline';

const API_URL = (process.env.VERBALAB_API_URL || process.env.VERBALAB_BASE_URL || 'http://localhost:4000').replace(
  /\/$/,
  '',
);
const API_KEY = process.env.VERBALAB_API_KEY || process.env.VERBALAB_TOKEN || '';

async function forward(message: unknown): Promise<unknown> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (API_KEY) headers.Authorization = `Bearer ${API_KEY}`;
  const res = await fetch(`${API_URL}/v1/partner-connectors/mcp`, {
    method: 'POST',
    headers,
    body: JSON.stringify(message),
  });
  return res.json();
}

const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });

rl.on('line', (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  let msg: unknown;
  try {
    msg = JSON.parse(trimmed);
  } catch {
    const err = {
      jsonrpc: '2.0',
      id: null,
      error: { code: -32700, message: 'Parse error' },
    };
    process.stdout.write(`${JSON.stringify(err)}\n`);
    return;
  }
  void forward(msg)
    .then((out) => {
      process.stdout.write(`${JSON.stringify(out)}\n`);
    })
    .catch((error: unknown) => {
      const id =
        msg && typeof msg === 'object' && 'id' in msg
          ? (msg as { id: string | number | null }).id
          : null;
      const err = {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32000,
          message: error instanceof Error ? error.message : 'bridge failed',
        },
      };
      process.stdout.write(`${JSON.stringify(err)}\n`);
    });
});
