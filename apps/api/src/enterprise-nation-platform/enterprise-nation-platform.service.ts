import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { DcivStoreService } from '../dciv-store/dciv-store.service';
import {
  enterpriseNationPlatformCapabilities,
  enterpriseNationPlatformHonesty,
  enterpriseNationPlatformRoutesTo,
} from './enterprise-nation-platform.catalog';

@Injectable()
export class EnterpriseNationPlatformService {
  constructor(private readonly store: DcivStoreService) {}

  engine() {
    return {
      product: 'VerbaLab Enterprise Nation Platform',
      domain: 'enterprise',
      capabilities: enterpriseNationPlatformCapabilities(),
      routesTo: enterpriseNationPlatformRoutesTo(),
      honesty: enterpriseNationPlatformHonesty(),
      safety: {
        ...enterpriseNationPlatformHonesty(),
        note: 'VL-387 Vertical platform for banks/hospitals/universities/telecoms — licensable product groundwork.',
      },
      docs: '/docs/ENTERPRISE_NATION_PLATFORM.md',
      note: 'VL-387 Vertical platform for banks/hospitals/universities/telecoms — licensable product groundwork.',
    };
  }

  products() { return this.engine(); }

  monitoring() {
    return {
      mode: 'domain',
      domain: 'enterprise',
      capabilities: enterpriseNationPlatformCapabilities().map((c) => ({ id: c.id, status: c.status })),
      honesty: enterpriseNationPlatformHonesty(),
      note: 'Enterprise Nation Platform monitoring (VL-387).',
    };
  }

  routes() {
    return { routesTo: enterpriseNationPlatformRoutesTo(), honesty: enterpriseNationPlatformHonesty() };
  }

  async records(session: SessionContext) {
    await this.store.ensureSeeded(session.organizationId);
    const rows = await this.store.list(session.organizationId, 'enterprise');
    return { domain: 'enterprise', count: rows.length, records: rows, honesty: enterpriseNationPlatformHonesty() };
  }

  async createRecord(
    session: SessionContext,
    body: { kind: string; title: string; status?: string; summary?: string; ownerLabel?: string; content?: Record<string, unknown> },
  ) {
    const row = await this.store.create(session.organizationId, {
      domain: 'enterprise',
      kind: body.kind,
      title: body.title,
      status: body.status,
      summary: body.summary,
      ownerLabel: body.ownerLabel,
      content: body.content,
    });
    return { record: row, honesty: enterpriseNationPlatformHonesty() };
  }
}
