import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import {
  PARTNER_PLATFORMS,
  partnerConnectorsCatalog,
  partnerConnectorsHonesty,
} from './partner-connectors.catalog';
import { handleMcpRpc, mcpManifest, mcpServerInfo, type JsonRpcRequest } from './partner-connectors.mcp';
import { PARTNER_TOOLS, invokePartnerTool } from './partner-connectors.tools';

export type PartnerInstallation = {
  id: string;
  organizationId: string;
  platformId: string;
  label: string;
  webhookUrl: string | null;
  scopes: string[];
  status: 'active' | 'paused';
  createdAt: string;
  updatedAt: string;
};

@Injectable()
export class PartnerConnectorsService {
  private readonly installations = new Map<string, PartnerInstallation>();
  private readonly webhookDeliveries: Array<Record<string, unknown>> = [];

  engine() {
    return {
      ...partnerConnectorsCatalog(),
      platforms: PARTNER_PLATFORMS,
      tools: PARTNER_TOOLS.map((t) => ({ name: t.name, description: t.description })),
      mcp: mcpServerInfo(),
      safety: {
        ...partnerConnectorsHonesty(),
        note:
          'Partner connectors expose VerbaLab Own AI to external video/LLM platforms via REST/MCP/CLI/SDK. Not a Zapier iPaaS OS; not a claim of signed Higgsfield/Claude marketplace listings.',
      },
    };
  }

  platforms(kind?: string) {
    const rows = PARTNER_PLATFORMS.filter((p) => (kind ? p.kind === kind : true));
    return { platforms: rows, count: rows.length, honesty: partnerConnectorsHonesty() };
  }

  platform(id: string) {
    const row = PARTNER_PLATFORMS.find((p) => p.id === id);
    if (!row) return null;
    return {
      platform: row,
      recommendedTools: PARTNER_TOOLS.map((t) => t.name),
      quickstart: {
        rest: `POST /v1/partner-connectors/invoke {"tool":"verbalab_translate","arguments":{...}}`,
        mcp: `POST /v1/partner-connectors/mcp {"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"verbalab_translate","arguments":{...}}}`,
        cli: `verbalab partner-invoke --tool verbalab_translate --args '{"text":"hello","source":"en","target":"sw"}'`,
        mcpStdio: `npx verbalab-mcp  # or pnpm --filter @verbalab/mcp start`,
      },
      honesty: partnerConnectorsHonesty(),
    };
  }

  tools() {
    return {
      tools: PARTNER_TOOLS,
      count: PARTNER_TOOLS.length,
      mcp: '/v1/partner-connectors/mcp',
      honesty: partnerConnectorsHonesty(),
    };
  }

  async invoke(tool: string, args: Record<string, unknown>, meta?: { platformId?: string }) {
    const started = Date.now();
    const out = await invokePartnerTool(tool, args);
    const event = {
      type: out.ok ? 'partner.tool.completed' : 'partner.tool.failed',
      tool,
      platformId: meta?.platformId ?? 'custom',
      ok: out.ok,
      latencyMs: Date.now() - started,
      at: new Date().toISOString(),
    };
    this.webhookDeliveries.unshift(event);
    if (this.webhookDeliveries.length > 100) this.webhookDeliveries.pop();
    return { ...out, meta: event, honesty: partnerConnectorsHonesty() };
  }

  mcpManifest() {
    return mcpManifest();
  }

  async mcp(body: JsonRpcRequest) {
    return handleMcpRpc(body);
  }

  listInstallations(organizationId: string) {
    const rows = [...this.installations.values()].filter((i) => i.organizationId === organizationId);
    return { installations: rows, count: rows.length, honesty: partnerConnectorsHonesty() };
  }

  install(
    session: SessionContext,
    body: {
      platformId?: string;
      label?: string;
      webhookUrl?: string;
      scopes?: string[];
    },
  ) {
    const platformId = (body.platformId ?? 'custom').toLowerCase();
    const platform = PARTNER_PLATFORMS.find((p) => p.id === platformId) ?? PARTNER_PLATFORMS.find((p) => p.id === 'custom')!;
    const now = new Date().toISOString();
    const row: PartnerInstallation = {
      id: randomUUID(),
      organizationId: session.organizationId,
      platformId: platform.id,
      label: body.label?.trim() || `${platform.name} install`,
      webhookUrl: body.webhookUrl?.trim() || null,
      scopes: body.scopes?.length ? body.scopes : PARTNER_TOOLS.map((t) => t.name),
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };
    this.installations.set(row.id, row);
    return { installation: row, honesty: partnerConnectorsHonesty() };
  }

  async testWebhook(organizationId: string, installationId?: string) {
    const install = installationId
      ? this.installations.get(installationId)
      : [...this.installations.values()].find((i) => i.organizationId === organizationId);
    const payload = {
      type: 'partner.connectors.ping',
      at: new Date().toISOString(),
      installationId: install?.id ?? null,
      platformId: install?.platformId ?? 'custom',
      tools: PARTNER_TOOLS.map((t) => t.name),
    };
    let delivery: Record<string, unknown> = {
      attempted: Boolean(install?.webhookUrl),
      status: 'skipped_no_url',
      payload,
    };
    if (install?.webhookUrl) {
      try {
        const res = await fetch(install.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-VerbaLab-Event': 'partner.connectors.ping' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(5_000),
        });
        delivery = {
          attempted: true,
          status: res.ok ? 'delivered' : `http_${res.status}`,
          webhookUrl: install.webhookUrl,
          payload,
        };
      } catch (error) {
        delivery = {
          attempted: true,
          status: 'failed',
          error: error instanceof Error ? error.message : 'webhook failed',
          webhookUrl: install.webhookUrl,
          payload,
        };
      }
    }
    this.webhookDeliveries.unshift(delivery);
    return { delivery, recent: this.webhookDeliveries.slice(0, 10), honesty: partnerConnectorsHonesty() };
  }

  async overview(session: SessionContext) {
    return {
      session: {
        organizationId: session.organizationId,
        workspaceId: session.workspaceId,
        role: session.role,
      },
      engine: this.engine(),
      installations: this.listInstallations(session.organizationId),
      links: {
        self: '/partner-connectors',
        connectors: '/connectors',
        connectorMarketplace: '/connector-marketplace',
        modelRuntime: '/model-runtime',
        videoVoice: '/video-voice',
        developers: '/developers',
      },
      unbeatableSurface: [
        'REST partner invoke for every Own AI modality',
        'MCP HTTP + stdio for Claude/Cursor/ChatGPT agents',
        'CLI + TypeScript SDK',
        'First-class video platform adapters (Higgsfield, Runway, Pika, Luma, Kling, HeyGen, Synthesia)',
        'Installations + webhook ping for async video pipelines',
      ],
      docs: '/docs/PARTNER_CONNECTORS.md',
    };
  }

  monitoring() {
    return {
      status: 'ready',
      platformCount: PARTNER_PLATFORMS.length,
      toolCount: PARTNER_TOOLS.length,
      installationCount: this.installations.size,
      webhookDeliveries: this.webhookDeliveries.length,
      honesty: partnerConnectorsHonesty(),
    };
  }
}
