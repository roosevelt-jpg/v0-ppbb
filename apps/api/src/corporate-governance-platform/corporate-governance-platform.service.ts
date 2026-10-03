import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { VcosStoreService } from '../vcos-store/vcos-store.service';
import {
  corporateGovernancePlatformCapabilities,
  corporateGovernancePlatformHonesty,
  corporateGovernancePlatformRoutesTo,
} from './corporate-governance-platform.catalog';

@Injectable()
export class CorporateGovernancePlatformService {
  constructor(private readonly store: VcosStoreService) {}

  engine() {
    return {
      product: 'VerbaLab Corporate Governance Platform',
      domain: 'governance',
      capabilities: corporateGovernancePlatformCapabilities(),
      routesTo: corporateGovernancePlatformRoutesTo(),
      honesty: corporateGovernancePlatformHonesty(),
      safety: {
        ...corporateGovernancePlatformHonesty(),
        note: 'VL-355. Board/committee tracking tooling — not a real board.',
      },
      docs: '/docs/CORPORATE_GOVERNANCE_PLATFORM.md',
      note: 'VL-355. Board/committee tracking tooling — not a real board.',
    };
  }

  products() {
    return this.engine();
  }

  monitoring() {
    return {
      mode: 'domain',
      domain: 'governance',
      capabilities: corporateGovernancePlatformCapabilities().map((c) => ({ id: c.id, status: c.status })),
      honesty: corporateGovernancePlatformHonesty(),
      note: 'Corporate Governance Platform monitoring (VL-355).',
    };
  }

  routes() {
    return { routesTo: corporateGovernancePlatformRoutesTo(), honesty: corporateGovernancePlatformHonesty() };
  }

  async records(session: SessionContext) {
    await this.store.ensureSeeded(session.organizationId);
    const rows = await this.store.list(session.organizationId, 'governance');
    return {
      domain: 'governance',
      count: rows.length,
      records: rows,
      honesty: corporateGovernancePlatformHonesty(),
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
      domain: 'governance',
      kind: body.kind,
      title: body.title,
      status: body.status,
      summary: body.summary,
      ownerLabel: body.ownerLabel,
      content: body.content,
    });
    return { record: row, honesty: corporateGovernancePlatformHonesty() };
  }
}
