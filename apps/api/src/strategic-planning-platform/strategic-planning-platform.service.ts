import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { VcosStoreService } from '../vcos-store/vcos-store.service';
import {
  strategicPlanningPlatformCapabilities,
  strategicPlanningPlatformHonesty,
  strategicPlanningPlatformRoutesTo,
} from './strategic-planning-platform.catalog';

@Injectable()
export class StrategicPlanningPlatformService {
  constructor(private readonly store: VcosStoreService) {}

  engine() {
    return {
      product: 'VerbaLab Strategic Planning Platform',
      domain: 'strategy',
      capabilities: strategicPlanningPlatformCapabilities(),
      routesTo: strategicPlanningPlatformRoutesTo(),
      honesty: strategicPlanningPlatformHonesty(),
      safety: {
        ...strategicPlanningPlatformHonesty(),
        note: 'VL-356. Strategy/OKR/roadmap tooling for 3/5/10/20-year horizons.',
      },
      docs: '/docs/STRATEGIC_PLANNING_PLATFORM.md',
      note: 'VL-356. Strategy/OKR/roadmap tooling for 3/5/10/20-year horizons.',
    };
  }

  products() {
    return this.engine();
  }

  monitoring() {
    return {
      mode: 'domain',
      domain: 'strategy',
      capabilities: strategicPlanningPlatformCapabilities().map((c) => ({ id: c.id, status: c.status })),
      honesty: strategicPlanningPlatformHonesty(),
      note: 'Strategic Planning Platform monitoring (VL-356).',
    };
  }

  routes() {
    return { routesTo: strategicPlanningPlatformRoutesTo(), honesty: strategicPlanningPlatformHonesty() };
  }

  async records(session: SessionContext) {
    await this.store.ensureSeeded(session.organizationId);
    const rows = await this.store.list(session.organizationId, 'strategy');
    return {
      domain: 'strategy',
      count: rows.length,
      records: rows,
      honesty: strategicPlanningPlatformHonesty(),
    };
  }

  async createRecord(
    session: SessionContext,
    body: {
      kind: string;
      title: string;
      status?: string;
      summary?: string;
      ownerLabel?: string;
      content?: Record<string, unknown>;
    },
  ) {
    const row = await this.store.create(session.organizationId, {
      domain: 'strategy',
      kind: body.kind,
      title: body.title,
      status: body.status,
      summary: body.summary,
      ownerLabel: body.ownerLabel,
      content: body.content,
    });
    return { record: row, honesty: strategicPlanningPlatformHonesty() };
  }
}
