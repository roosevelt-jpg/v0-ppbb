import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { VcosStoreService } from '../vcos-store/vcos-store.service';
import {
  executiveIntelligencePlatformCapabilities,
  executiveIntelligencePlatformHonesty,
  executiveIntelligencePlatformRoutesTo,
} from './executive-intelligence-platform.catalog';

@Injectable()
export class ExecutiveIntelligencePlatformService {
  constructor(private readonly store: VcosStoreService) {}

  engine() {
    return {
      product: 'VerbaLab Executive Intelligence Platform',
      domain: 'executive',
      capabilities: executiveIntelligencePlatformCapabilities(),
      routesTo: executiveIntelligencePlatformRoutesTo(),
      honesty: executiveIntelligencePlatformHonesty(),
      safety: {
        ...executiveIntelligencePlatformHonesty(),
        note: 'Executive/board KPI cockpit — reporting tooling, not executive judgment.',
      },
      docs: '/docs/EXECUTIVE_INTELLIGENCE_PLATFORM.md',
      note: 'Executive/board KPI cockpit — reporting tooling, not executive judgment.',
    };
  }

  products() {
    return this.engine();
  }

  monitoring() {
    return {
      mode: 'domain',
      domain: 'executive',
      capabilities: executiveIntelligencePlatformCapabilities().map((c) => ({ id: c.id, status: c.status })),
      honesty: executiveIntelligencePlatformHonesty(),
      note: 'Executive Intelligence Platform monitoring.',
    };
  }

  routes() {
    return { routesTo: executiveIntelligencePlatformRoutesTo(), honesty: executiveIntelligencePlatformHonesty() };
  }

  async records(session: SessionContext) {
    await this.store.ensureSeeded(session.organizationId);
    const rows = await this.store.list(session.organizationId, 'executive');
    return {
      domain: 'executive',
      count: rows.length,
      records: rows,
      honesty: executiveIntelligencePlatformHonesty(),
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
      domain: 'executive',
      kind: body.kind,
      title: body.title,
      status: body.status,
      summary: body.summary,
      ownerLabel: body.ownerLabel,
      content: body.content,
    });
    return { record: row, honesty: executiveIntelligencePlatformHonesty() };
  }
}
