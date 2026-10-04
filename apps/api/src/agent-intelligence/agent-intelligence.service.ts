import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { AgentOperatingSystemService } from '../agent-operating-system/agent-operating-system.service';
import {
  agentIntelligenceCatalog,
  agentIntelligenceHonesty,
} from './agent-intelligence.catalog';

@Injectable()
export class AgentIntelligenceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly agentOs: AgentOperatingSystemService,
  ) {}

  engine() {
    return {
      ...agentIntelligenceCatalog(),
      capabilities: [
        {
          id: 'agent-runtime',
          name: 'Agent Runtime hub',
          status: 'shipped',
          api: 'GET /v1/agent-runtime/engine',
        },
        {
          id: 'voice-faq',
          name: 'Voice FAQ agents',
          status: 'shipped',
          api: 'GET /v1/voice/products',
        },
        {
          id: 'orchestration',
          name: 'Tool/model pipelines',
          status: 'shipped',
          api: 'POST /v1/ai-orchestration/run',
        },
        {
          id: 'partner-tools',
          name: 'Partner MCP tools',
          status: 'shipped',
          api: 'POST /v1/partner-connectors/invoke',
        },
        {
          id: 'full-agent-os',
          name: 'Full agent OS',
          status: 'shipped',
          api: 'POST /v1/agent-os/run',
        },
        {
          id: 'multi-agent-os',
          name: 'Multi-agent OS',
          status: 'shipped',
          api: 'GET /v1/agent-os/engine',
        },
      ],
      agentOs: this.agentOs.agentOsEngine(),
      safety: agentIntelligenceHonesty(),
    };
  }

  async activity(organizationId: string) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const rows = await this.prisma.auditEvent.findMany({
      where: {
        organizationId,
        createdAt: { gte: since },
        OR: [
          { action: { contains: 'agent' } },
          { action: { contains: 'faq' } },
          { action: { contains: 'orchestration' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: { id: true, action: true, createdAt: true },
    });
    return {
      window: '7d',
      count: rows.length,
      events: rows.map((r) => ({
        id: r.id,
        action: r.action,
        at: r.createdAt.toISOString(),
      })),
      honesty: agentIntelligenceHonesty(),
    };
  }

  async overview(session: SessionContext) {
    return {
      session: {
        organizationId: session.organizationId,
        workspaceId: session.workspaceId,
        role: session.role,
      },
      engine: this.engine(),
      activity: await this.activity(session.organizationId),
      links: {
        self: '/agent-intelligence',
        agentOs: '/agent-intelligence',
        agentRuntime: '/agent-runtime',
        orchestration: '/ai-orchestration',
        voice: '/voice',
        partnerConnectors: '/partner-connectors',
        agentOperatingSystem: '/agent-operating-system',
      },
      docs: '/docs/AGENT_INTELLIGENCE.md',
    };
  }

  monitoring() {
    return { status: 'ready', honesty: agentIntelligenceHonesty() };
  }
}
