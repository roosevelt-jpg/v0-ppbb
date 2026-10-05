import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { AieStoreService } from '../aie-store/aie-store.service';
import {
  revenueSharingPlatformCapabilities,
  revenueSharingPlatformHonesty,
  revenueSharingPlatformRoutesTo,
} from './revenue-sharing-platform.catalog';

@Injectable()
export class RevenueSharingPlatformService {
  constructor(private readonly store: AieStoreService) {}

  engine() {
    return {
      product: 'VerbaLab Revenue Sharing Platform',
      domain: 'revenue',
      capabilities: revenueSharingPlatformCapabilities(),
      routesTo: revenueSharingPlatformRoutesTo(),
      honesty: revenueSharingPlatformHonesty(),
      safety: {
        ...revenueSharingPlatformHonesty(),
        note: 'Royalty/payout ledger + workflow. autonomousPayouts=false; finance/legal set terms.',
      },
      docs: '/docs/REVENUE_SHARING_PLATFORM.md',
      note: 'Royalty/payout ledger + workflow. autonomousPayouts=false; finance/legal set terms.',
    };
  }

  products() { return this.engine(); }

  monitoring() {
    return {
      mode: 'domain',
      domain: 'revenue',
      capabilities: revenueSharingPlatformCapabilities().map((c) => ({ id: c.id, status: c.status })),
      honesty: revenueSharingPlatformHonesty(),
      note: 'Revenue Sharing Platform monitoring.',
    };
  }

  routes() {
    return { routesTo: revenueSharingPlatformRoutesTo(), honesty: revenueSharingPlatformHonesty() };
  }

  async records(session: SessionContext) {
    await this.store.ensureSeeded(session.organizationId);
    const rows = await this.store.list(session.organizationId, 'revenue');
    return { domain: 'revenue', count: rows.length, records: rows, honesty: revenueSharingPlatformHonesty() };
  }

  async createRecord(
    session: SessionContext,
    body: { kind: string; title: string; status?: string; summary?: string; ownerLabel?: string; content?: Record<string, unknown> },
  ) {
    const row = await this.store.create(session.organizationId, {
      domain: 'revenue',
      kind: body.kind,
      title: body.title,
      status: body.status,
      summary: body.summary,
      ownerLabel: body.ownerLabel,
      content: body.content,
    });
    return { record: row, honesty: revenueSharingPlatformHonesty() };
  }
}
