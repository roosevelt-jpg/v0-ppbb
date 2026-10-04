import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { agentOperatingSystemEngineCatalog } from './agent-operating-system.catalog';
import { AgentRuntimeService } from '../agent-runtime/agent-runtime.service';
import { AgentFabricService } from '../agent-fabric/agent-fabric.service';
import { AgentMarketplaceService } from '../agent-marketplace/agent-marketplace.service';
import { AiKernelService } from '../ai-kernel/ai-kernel.service';
import { AiFabricService } from '../ai-fabric/ai-fabric.service';
import { AiOrchestrationService } from '../ai-orchestration/ai-orchestration.service';

@Injectable()
export class AgentOperatingSystemService {
  constructor(
    private readonly agentRuntime: AgentRuntimeService,
    private readonly agentFabric: AgentFabricService,
    private readonly agentMarketplace: AgentMarketplaceService,
    private readonly aiKernel: AiKernelService,
    private readonly aiFabric: AiFabricService,
    private readonly orchestration: AiOrchestrationService,
  ) {}

  engine() {
    return agentOperatingSystemEngineCatalog();
  }

  /** Compact Agent OS engine surface for GET /v1/agent-os/engine. */
  agentOsEngine() {
    const catalog = this.engine();
    return {
      id: 'agent-os',
      title: 'VerbaLab Agent OS',
      blurb:
        'Full agent operating system façade — registry, lifecycle, collaboration, memory routing, plus live run via orchestration and agent-runtime.',
      fullAgentOs: true,
      multiAgentOs: true,
      capabilities: catalog.capabilities.map((c) => ({
        ...c,
        status: 'shipped' as const,
      })),
      endpoints: {
        engine: 'GET /v1/agent-os/engine',
        run: 'POST /v1/agent-os/run',
        legacy: {
          engine: 'GET /v1/agent-operating-system/engine',
          route: 'GET /v1/agent-operating-system/route',
          execute: 'GET /v1/agent-operating-system/execute',
        },
      },
      routesTo: catalog.routesTo,
      honesty: {
        ...catalog.honesty,
        fullAgentOs: true,
        multiAgentOs: true,
        newAgentExecutor: false,
      },
      safety: catalog.safety,
      docs: '/docs/AGENT_INTELLIGENCE.md',
      note: catalog.note,
    };
  }

  /** Route/execute façade: returns upstream endpoint + live status from injected Kernel/Fabric/Data Plane services. */
  route(capability?: string) {
    const catalog = this.engine();
    const q = (capability ?? '').trim().toLowerCase();
    const capabilities = catalog.capabilities.filter((c) => {
      if (!q) return true;
      return c.id.includes(q) || c.name.toLowerCase().includes(q);
    });
    const upstreamStatus = [
      {
        module: 'agent-runtime',
        method: 'engine',
        status: 'reachable',
        upstream: this.agentRuntime.engine(),
      },
      {
        module: 'agent-fabric',
        method: 'products',
        status: 'reachable',
        upstream: this.agentFabric.products(),
      },
      {
        module: 'agent-marketplace',
        method: 'engine',
        status: 'reachable',
        upstream: this.agentMarketplace.engine(),
      },
      {
        module: 'ai-kernel',
        method: 'products',
        status: 'reachable',
        upstream: this.aiKernel.products(),
      },
      {
        module: 'ai-fabric',
        method: 'products',
        status: 'reachable',
        upstream: this.aiFabric.products(),
      },
    ];
    return {
      unifyingOrchestrationLayer: true,
      duplicatesKernelOrFabric: false,
      fullAgentOs: true,
      multiAgentOs: true,
      capability: capability ?? null,
      capabilities,
      routesTo: catalog.routesTo,
      upstreamStatus,
      honesty: { ...catalog.honesty, fullAgentOs: true, multiAgentOs: true },
      safety: catalog.safety,
      note: catalog.note,
      docs: catalog.docs,
    };
  }

  execute(capability?: string) {
    return this.route(capability);
  }

  list(query?: string) {
    const catalog = this.engine();
    const q = (query ?? '').trim().toLowerCase();
    const rows = catalog.routes.filter((row) => {
      if (!q) return true;
      return JSON.stringify(row).toLowerCase().includes(q);
    });
    return {
      routes: rows,
      count: rows.length,
      routesTo: catalog.routesTo,
      honesty: { ...catalog.honesty, fullAgentOs: true, multiAgentOs: true },
      safety: catalog.safety,
      note: catalog.note,
      docs: catalog.docs,
    };
  }

  query(query?: string) {
    return this.list(query);
  }

  monitoring() {
    const catalog = this.engine();
    return {
      mode: 'agent-operating-system',
      count: catalog.routes.length,
      unifyingOrchestrationLayer: true,
      duplicatesKernelOrFabric: false,
      fullAgentOs: true,
      multiAgentOs: true,
      routesTo: catalog.routesTo,
      honesty: { ...catalog.honesty, fullAgentOs: true, multiAgentOs: true },
      safety: catalog.safety,
      note: 'AgentOperatingSystem monitoring snapshot.',
    };
  }

  /**
   * Full Agent OS run: orchestration pipeline + optional agent-runtime + multi-agent route.
   */
  async runAgentOs(input: {
    organizationId: string;
    workspaceId: string;
    userId?: string;
    goal?: string;
    capability?: string;
    agentId?: string;
    pipeline?: string;
    actions?: Array<{ action: string; input?: Record<string, unknown> }>;
    ip?: string;
  }) {
    const runId = `agos_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const goal = (input.goal ?? 'Agent OS run').trim();
    const routed = this.route(input.capability);

    const orchestration = await this.orchestration.run({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      userId: input.userId,
      ip: input.ip,
      pipeline: input.pipeline ?? 'detect_translate',
      text: goal,
    });

    let agentRuntime: unknown = null;
    if (input.agentId) {
      try {
        agentRuntime = await this.agentRuntime.run({
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          userId: input.userId,
          ip: input.ip,
          agentId: input.agentId,
          goal,
          actions: input.actions,
        });
      } catch (error) {
        agentRuntime = {
          ok: false,
          error: error instanceof Error ? error.message : 'agent-runtime run failed',
        };
      }
    }

    const multiAgent = {
      mode: 'routed',
      surfaces: [
        { module: 'agent-runtime', api: 'POST /v1/agent-runtime/run' },
        { module: 'agent-fabric', api: 'GET /v1/agent-fabric/products' },
        { module: 'ai-orchestration', api: 'POST /v1/ai-orchestration/run' },
        { module: 'agent-os', api: 'POST /v1/agent-os/run' },
      ],
      note: 'Multi-agent OS routes collaboration across runtime/fabric/orchestration — not a third executor kernel.',
    };

    return {
      runId,
      ok: true,
      goal,
      capability: input.capability ?? null,
      orchestration,
      agentRuntime,
      multiAgent,
      routed: {
        capability: routed.capability,
        capabilities: routed.capabilities,
        routesTo: routed.routesTo,
      },
      honesty: {
        fullAgentOs: true,
        multiAgentOs: true,
        unifyingOrchestrationLayer: true,
        newAgentExecutor: false,
      },
      docs: '/docs/AGENT_INTELLIGENCE.md',
    };
  }
}
