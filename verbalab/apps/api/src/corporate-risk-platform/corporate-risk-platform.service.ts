import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { VcosStoreService } from '../vcos-store/vcos-store.service';
import {
  corporateRiskPlatformCapabilities,
  corporateRiskPlatformHonesty,
  corporateRiskPlatformRoutesTo,
} from './corporate-risk-platform.catalog';

@Injectable()
export class CorporateRiskPlatformService {
  constructor(private readonly store: VcosStoreService) {}

  engine() {
    return {
      product: 'VerbaLab Corporate Risk Platform',
      domain: 'risk',
      capabilities: corporateRiskPlatformCapabilities(),
      routesTo: corporateRiskPlatformRoutesTo(),
      honesty: corporateRiskPlatformHonesty(),
      safety: {
        ...corporateRiskPlatformHonesty(),
        note: 'Enterprise risk register tooling across AI/cyber/regulatory domains.',
      },
      docs: '/docs/CORPORATE_RISK_PLATFORM.md',
      note: 'Enterprise risk register tooling across AI/cyber/regulatory domains.',
    };
  }

  products() {
    return this.engine();
  }

  monitoring() {
    return {
      mode: 'domain',
      domain: 'risk',
      capabilities: corporateRiskPlatformCapabilities().map((c) => ({ id: c.id, status: c.status })),
      honesty: corporateRiskPlatformHonesty(),
      note: 'Corporate Risk Platform monitoring.',
    };
  }

  routes() {
    return { routesTo: corporateRiskPlatformRoutesTo(), honesty: corporateRiskPlatformHonesty() };
  }

  async records(session: SessionContext) {
    await this.store.ensureSeeded(session.organizationId);
    const rows = await this.store.list(session.organizationId, 'risk');
    return {
      domain: 'risk',
      count: rows.length,
      records: rows,
      honesty: corporateRiskPlatformHonesty(),
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
      domain: 'risk',
      kind: body.kind,
      title: body.title,
      status: body.status,
      summary: body.summary,
      ownerLabel: body.ownerLabel,
      content: body.content,
    });
    return { record: row, honesty: corporateRiskPlatformHonesty() };
  }
}
