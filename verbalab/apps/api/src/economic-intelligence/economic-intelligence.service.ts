import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { AieStoreService } from '../aie-store/aie-store.service';
import {
  economicIntelligenceCapabilities,
  economicIntelligenceHonesty,
  economicIntelligenceRoutesTo,
} from './economic-intelligence.catalog';

@Injectable()
export class EconomicIntelligenceService {
  constructor(private readonly store: AieStoreService) {}

  engine() {
    return {
      product: 'VerbaLab Economic Intelligence',
      domain: 'intelligence',
      capabilities: economicIntelligenceCapabilities(),
      routesTo: economicIntelligenceRoutesTo(),
      honesty: economicIntelligenceHonesty(),
      safety: {
        ...economicIntelligenceHonesty(),
        note: 'Executive/adoption/revenue analytics dashboards — reporting tooling.',
      },
      docs: '/docs/ECONOMIC_INTELLIGENCE.md',
      note: 'Executive/adoption/revenue analytics dashboards — reporting tooling.',
    };
  }

  products() { return this.engine(); }

  monitoring() {
    return {
      mode: 'domain',
      domain: 'intelligence',
      capabilities: economicIntelligenceCapabilities().map((c) => ({ id: c.id, status: c.status })),
      honesty: economicIntelligenceHonesty(),
      note: 'Economic Intelligence monitoring.',
    };
  }

  routes() {
    return { routesTo: economicIntelligenceRoutesTo(), honesty: economicIntelligenceHonesty() };
  }

  async records(session: SessionContext) {
    await this.store.ensureSeeded(session.organizationId);
    const rows = await this.store.list(session.organizationId, 'intelligence');
    return { domain: 'intelligence', count: rows.length, records: rows, honesty: economicIntelligenceHonesty() };
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
    return { record: row, honesty: economicIntelligenceHonesty() };
  }
}
