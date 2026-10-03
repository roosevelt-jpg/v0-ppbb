import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { AieStoreService } from '../aie-store/aie-store.service';
import {
  researchFundingPlatformCapabilities,
  researchFundingPlatformHonesty,
  researchFundingPlatformRoutesTo,
} from './research-funding-platform.catalog';

@Injectable()
export class ResearchFundingPlatformService {
  constructor(private readonly store: AieStoreService) {}

  engine() {
    return {
      product: 'VerbaLab Research Funding Platform',
      domain: 'funding',
      capabilities: researchFundingPlatformCapabilities(),
      routesTo: researchFundingPlatformRoutesTo(),
      honesty: researchFundingPlatformHonesty(),
      safety: {
        ...researchFundingPlatformHonesty(),
        note: 'Grant/scholarship/innovation funding tracking— not autonomous grant disbursement.',
      },
      docs: '/docs/RESEARCH_FUNDING_PLATFORM.md',
      note: 'Grant/scholarship/innovation funding tracking— not autonomous grant disbursement.',
    };
  }

  products() { return this.engine(); }

  monitoring() {
    return {
      mode: 'domain',
      domain: 'funding',
      capabilities: researchFundingPlatformCapabilities().map((c) => ({ id: c.id, status: c.status })),
      honesty: researchFundingPlatformHonesty(),
      note: 'Research Funding Platform monitoring.',
    };
  }

  routes() {
    return { routesTo: researchFundingPlatformRoutesTo(), honesty: researchFundingPlatformHonesty() };
  }

  async records(session: SessionContext) {
    await this.store.ensureSeeded(session.organizationId);
    const rows = await this.store.list(session.organizationId, 'funding');
    return { domain: 'funding', count: rows.length, records: rows, honesty: researchFundingPlatformHonesty() };
  }

  async createRecord(
    session: SessionContext,
    body: { kind: string; title: string; status?: string; summary?: string; ownerLabel?: string; content?: Record<string, unknown> },
  ) {
    const row = await this.store.create(session.organizationId, {
      domain: 'funding',
      kind: body.kind,
      title: body.title,
      status: body.status,
      summary: body.summary,
      ownerLabel: body.ownerLabel,
      content: body.content,
    });
    return { record: row, honesty: researchFundingPlatformHonesty() };
  }
}
