import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { aiObservabilityCatalog, aiObservabilityHonesty } from './ai-observability.catalog';

@Injectable()
export class AiObservabilityService {
  constructor(private readonly prisma: PrismaService) {}

  engine() {
    return {
      ...aiObservabilityCatalog(),
      capabilities: [
        { id: 'request-ids', name: 'Request IDs', status: 'shipped', api: 'header X-Request-Id' },
        { id: 'audits', name: 'Audit trail', status: 'shipped', api: 'GET /v1/audit' },
        { id: 'health', name: 'Health', status: 'shipped', api: 'GET /health' },
        { id: 'product-monitoring', name: 'Product monitoring hubs', status: 'shipped', api: 'GET /v1/ai-observability/dashboard' },
        { id: 'apm-os', name: 'APM OS', status: 'deferred', api: null },
      ],
      safety: aiObservabilityHonesty(),
    };
  }

  async dashboard(organizationId: string) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [audits24h, errors24h, recent] = await Promise.all([
      this.prisma.auditEvent.count({
        where: { organizationId, createdAt: { gte: since } },
      }),
      this.prisma.auditEvent.count({
        where: {
          organizationId,
          createdAt: { gte: since },
          action: { contains: 'fail' },
        },
      }),
      this.prisma.auditEvent.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { id: true, action: true, createdAt: true, route: true },
      }),
    ]);
    return {
      window: '24h',
      audits24h,
      errors24h,
      recent: recent.map((r) => ({
        id: r.id,
        action: r.action,
        route: r.route,
        at: r.createdAt.toISOString(),
      })),
      surfaces: aiObservabilityCatalog().surfaces,
      honesty: aiObservabilityHonesty(),
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
      dashboard: await this.dashboard(session.organizationId),
      links: {
        self: '/ai-observability',
        intelligenceCloud: '/intelligence-cloud',
        intelligenceAnalytics: '/intelligence-analytics',
        audit: '/audit',
      },
      docs: '/docs/AI_OBSERVABILITY.md',
    };
  }

  monitoring() {
    return {
      status: 'ready',
      honesty: aiObservabilityHonesty(),
      surfaces: aiObservabilityCatalog().surfaces.length,
    };
  }
}
