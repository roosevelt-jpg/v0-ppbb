import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { DcivStoreService } from '../dciv-store/dciv-store.service';
import {
  civilizationIntelligenceDashboardCapabilities,
  civilizationIntelligenceDashboardHonesty,
  civilizationIntelligenceDashboardRoutesTo,
} from './civilization-intelligence-dashboard.catalog';

@Injectable()
export class CivilizationIntelligenceDashboardService {
  constructor(private readonly store: DcivStoreService) {}

  engine() {
    return {
      product: 'VerbaLab Civilization Intelligence Dashboard',
      domain: 'intelligence',
      capabilities: civilizationIntelligenceDashboardCapabilities(),
      routesTo: civilizationIntelligenceDashboardRoutesTo(),
      honesty: civilizationIntelligenceDashboardHonesty(),
      safety: {
        ...civilizationIntelligenceDashboardHonesty(),
        note: 'VL-392 Adoption/impact analytics dashboards — reporting tooling.',
      },
      docs: '/docs/CIVILIZATION_INTELLIGENCE_DASHBOARD.md',
      note: 'VL-392 Adoption/impact analytics dashboards — reporting tooling.',
    };
  }

  products() { return this.engine(); }

  monitoring() {
    return {
      mode: 'domain',
      domain: 'intelligence',
      capabilities: civilizationIntelligenceDashboardCapabilities().map((c) => ({ id: c.id, status: c.status })),
      honesty: civilizationIntelligenceDashboardHonesty(),
      note: 'Civilization Intelligence Dashboard monitoring (VL-392).',
    };
  }

  routes() {
    return { routesTo: civilizationIntelligenceDashboardRoutesTo(), honesty: civilizationIntelligenceDashboardHonesty() };
  }

  async records(session: SessionContext) {
    await this.store.ensureSeeded(session.organizationId);
    const rows = await this.store.list(session.organizationId, 'intelligence');
    return { domain: 'intelligence', count: rows.length, records: rows, honesty: civilizationIntelligenceDashboardHonesty() };
  }

  async createRecord(
    session: SessionContext,
    body: { kind: string; title: string; status?: string; summary?: string; ownerLabel?: string; content?: Record<string, unknown> },
  ) {
    const row = await this.store.create(session.organizationId, {
      domain: 'intelligence',
      kind: body.kind,
      title: body.title,
      status: body.status,
      summary: body.summary,
      ownerLabel: body.ownerLabel,
      content: body.content,
    });
    return { record: row, honesty: civilizationIntelligenceDashboardHonesty() };
  }
}
