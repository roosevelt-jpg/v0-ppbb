import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { VgasStoreService } from '../vgas-store/vgas-store.service';
import {
  standardsAnalyticsCapabilities,
  standardsAnalyticsHonesty,
  standardsAnalyticsRoutesTo,
} from './standards-analytics.catalog';

@Injectable()
export class StandardsAnalyticsService {
  constructor(private readonly store: VgasStoreService) {}

  engine() {
    return {
      product: 'VerbaLab Standards Analytics',
      domain: 'analytics',
      capabilities: standardsAnalyticsCapabilities(),
      routesTo: standardsAnalyticsRoutesTo(),
      honesty: standardsAnalyticsHonesty(),
      safety: {
        ...standardsAnalyticsHonesty(),
        note: 'Adoption analytics.',
      },
      docs: '/docs/STANDARDS_ANALYTICS.md',
      note: 'Adoption analytics.',
    };
  }

  products() { return this.engine(); }

  monitoring() {
    return {
      mode: 'domain',
      domain: 'analytics',
      capabilities: standardsAnalyticsCapabilities().map((c) => ({ id: c.id, status: c.status })),
      honesty: standardsAnalyticsHonesty(),
      note: 'Standards Analytics monitoring.',
    };
  }

  routes() {
    return { routesTo: standardsAnalyticsRoutesTo(), honesty: standardsAnalyticsHonesty() };
  }

  async records(session: SessionContext) {
    await this.store.ensureSeeded(session.organizationId);
    const rows = await this.store.list(session.organizationId, 'analytics');
    return { domain: 'analytics', count: rows.length, records: rows, honesty: standardsAnalyticsHonesty() };
  }

  async createRecord(
    session: SessionContext,
    body: {
      kind: string;
      title: string;
      status?: string;
      summary?: string;
      ownerLabel?: string;
      verifyCode?: string;
      content?: Record<string, unknown>;
    },
  ) {
    const row = await this.store.create(session.organizationId, {
      domain: 'analytics',
      kind: body.kind,
      title: body.title,
      status: body.status,
      summary: body.summary,
      ownerLabel: body.ownerLabel,
      verifyCode: body.verifyCode,
      content: body.content,
    });
    return { record: row, honesty: standardsAnalyticsHonesty() };
  }
}
