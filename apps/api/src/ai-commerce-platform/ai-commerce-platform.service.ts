import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { AieStoreService } from '../aie-store/aie-store.service';
import {
  aiCommercePlatformCapabilities,
  aiCommercePlatformHonesty,
  aiCommercePlatformRoutesTo,
} from './ai-commerce-platform.catalog';

@Injectable()
export class AiCommercePlatformService {
  constructor(private readonly store: AieStoreService) {}

  engine() {
    return {
      product: 'VerbaLab AI Commerce Platform',
      domain: 'commerce',
      capabilities: aiCommercePlatformCapabilities(),
      routesTo: aiCommercePlatformRoutesTo(),
      honesty: aiCommercePlatformHonesty(),
      safety: {
        ...aiCommercePlatformHonesty(),
        note: 'Catalogs/subscriptions/invoices via existing Stripe billing — no hand-rolled card handling.',
      },
      docs: '/docs/AI_COMMERCE_PLATFORM.md',
      note: 'Catalogs/subscriptions/invoices via existing Stripe billing — no hand-rolled card handling.',
    };
  }

  products() { return this.engine(); }

  monitoring() {
    return {
      mode: 'domain',
      domain: 'commerce',
      capabilities: aiCommercePlatformCapabilities().map((c) => ({ id: c.id, status: c.status })),
      honesty: aiCommercePlatformHonesty(),
      note: 'AI Commerce Platform monitoring.',
    };
  }

  routes() {
    return { routesTo: aiCommercePlatformRoutesTo(), honesty: aiCommercePlatformHonesty() };
  }

  async records(session: SessionContext) {
    await this.store.ensureSeeded(session.organizationId);
    const rows = await this.store.list(session.organizationId, 'commerce');
    return { domain: 'commerce', count: rows.length, records: rows, honesty: aiCommercePlatformHonesty() };
  }

  async createRecord(
    session: SessionContext,
    body: { kind: string; title: string; status?: string; summary?: string; ownerLabel?: string; content?: Record<string, unknown> },
  ) {
    const row = await this.store.create(session.organizationId, {
      domain: 'commerce',
      kind: body.kind,
      title: body.title,
      status: body.status,
      summary: body.summary,
      ownerLabel: body.ownerLabel,
      content: body.content,
    });
    return { record: row, honesty: aiCommercePlatformHonesty() };
  }
}
