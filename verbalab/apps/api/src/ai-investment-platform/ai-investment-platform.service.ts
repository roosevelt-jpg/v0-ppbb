import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { AieStoreService } from '../aie-store/aie-store.service';
import {
  aiInvestmentPlatformCapabilities,
  aiInvestmentPlatformHonesty,
  aiInvestmentPlatformRoutesTo,
} from './ai-investment-platform.catalog';

@Injectable()
export class AiInvestmentPlatformService {
  constructor(private readonly store: AieStoreService) {}

  engine() {
    return {
      product: 'VerbaLab AI Investment Platform',
      domain: 'investment',
      capabilities: aiInvestmentPlatformCapabilities(),
      routesTo: aiInvestmentPlatformRoutesTo(),

      investmentMode: 'dashboard_reporting_only',
      fundingPortalOs: false,
      securitiesOfferingOs: false,
      honesty: aiInvestmentPlatformHonesty(),
      safety: {
        ...aiInvestmentPlatformHonesty(),
        note: 'Investment *dashboard/reporting only*. fundingPortalOs=false; securitiesOfferingOs=false.',
      },
      docs: '/docs/AI_INVESTMENT_PLATFORM.md',
      note: 'Investment *dashboard/reporting only*. fundingPortalOs=false; securitiesOfferingOs=false.',
    };
  }

  products() { return this.engine(); }

  monitoring() {
    return {
      mode: 'domain',
      domain: 'investment',
      capabilities: aiInvestmentPlatformCapabilities().map((c) => ({ id: c.id, status: c.status })),
      honesty: aiInvestmentPlatformHonesty(),
      note: 'AI Investment Platform monitoring.',
    };
  }

  routes() {
    return { routesTo: aiInvestmentPlatformRoutesTo(), honesty: aiInvestmentPlatformHonesty() };
  }

  async records(session: SessionContext) {
    await this.store.ensureSeeded(session.organizationId);
    const rows = await this.store.list(session.organizationId, 'investment');
    return { domain: 'investment', count: rows.length, records: rows, honesty: aiInvestmentPlatformHonesty() };
  }

  async createRecord(
    session: SessionContext,
    body: { kind: string; title: string; status?: string; summary?: string; ownerLabel?: string; content?: Record<string, unknown> },
  ) {
    const row = await this.store.create(session.organizationId, {
      domain: 'investment',
      kind: body.kind,
      title: body.title,
      status: body.status,
      summary: body.summary,
      ownerLabel: body.ownerLabel,
      content: body.content,
    });
    return { record: row, honesty: aiInvestmentPlatformHonesty() };
  }
}
