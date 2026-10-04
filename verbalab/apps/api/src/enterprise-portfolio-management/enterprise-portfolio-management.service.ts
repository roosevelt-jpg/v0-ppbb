import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { VcosStoreService } from '../vcos-store/vcos-store.service';
import {
  enterprisePortfolioManagementCapabilities,
  enterprisePortfolioManagementHonesty,
  enterprisePortfolioManagementRoutesTo,
} from './enterprise-portfolio-management.catalog';

@Injectable()
export class EnterprisePortfolioManagementService {
  constructor(private readonly store: VcosStoreService) {}

  engine() {
    return {
      product: 'VerbaLab Enterprise Portfolio Management',
      domain: 'portfolio',
      capabilities: enterprisePortfolioManagementCapabilities(),
      routesTo: enterprisePortfolioManagementRoutesTo(),
      honesty: enterprisePortfolioManagementHonesty(),
      safety: {
        ...enterprisePortfolioManagementHonesty(),
        note: 'Products/programs/projects/budgets/capacity tracking.',
      },
      docs: '/docs/ENTERPRISE_PORTFOLIO_MANAGEMENT.md',
      note: 'Products/programs/projects/budgets/capacity tracking.',
    };
  }

  products() {
    return this.engine();
  }

  monitoring() {
    return {
      mode: 'domain',
      domain: 'portfolio',
      capabilities: enterprisePortfolioManagementCapabilities().map((c) => ({ id: c.id, status: c.status })),
      honesty: enterprisePortfolioManagementHonesty(),
      note: 'Enterprise Portfolio Management monitoring.',
    };
  }

  routes() {
    return { routesTo: enterprisePortfolioManagementRoutesTo(), honesty: enterprisePortfolioManagementHonesty() };
  }

  async records(session: SessionContext) {
    await this.store.ensureSeeded(session.organizationId);
    const rows = await this.store.list(session.organizationId, 'portfolio');
    return {
      domain: 'portfolio',
      count: rows.length,
      records: rows,
      honesty: enterprisePortfolioManagementHonesty(),
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
      domain: 'portfolio',
      kind: body.kind,
      title: body.title,
      status: body.status,
      summary: body.summary,
      ownerLabel: body.ownerLabel,
      content: body.content,
    });
    return { record: row, honesty: enterprisePortfolioManagementHonesty() };
  }
}
