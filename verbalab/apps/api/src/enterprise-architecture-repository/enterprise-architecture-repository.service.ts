import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { VcosStoreService } from '../vcos-store/vcos-store.service';
import {
  enterpriseArchitectureRepositoryCapabilities,
  enterpriseArchitectureRepositoryHonesty,
  enterpriseArchitectureRepositoryRoutesTo,
} from './enterprise-architecture-repository.catalog';

@Injectable()
export class EnterpriseArchitectureRepositoryService {
  constructor(private readonly store: VcosStoreService) {}

  engine() {
    return {
      product: 'VerbaLab Enterprise Architecture Repository',
      domain: 'architecture',
      capabilities: enterpriseArchitectureRepositoryCapabilities(),
      routesTo: enterpriseArchitectureRepositoryRoutesTo(),
      honesty: enterpriseArchitectureRepositoryHonesty(),
      safety: {
        ...enterpriseArchitectureRepositoryHonesty(),
        note: 'Architecture artifact store with TOGAF/ArchiMate-aligned kinds — not a full modeling suite.',
      },
      docs: '/docs/ENTERPRISE_ARCHITECTURE_REPOSITORY.md',
      note: 'Architecture artifact store with TOGAF/ArchiMate-aligned kinds — not a full modeling suite.',
    };
  }

  products() {
    return this.engine();
  }

  monitoring() {
    return {
      mode: 'domain',
      domain: 'architecture',
      capabilities: enterpriseArchitectureRepositoryCapabilities().map((c) => ({ id: c.id, status: c.status })),
      honesty: enterpriseArchitectureRepositoryHonesty(),
      note: 'Enterprise Architecture Repository monitoring.',
    };
  }

  routes() {
    return { routesTo: enterpriseArchitectureRepositoryRoutesTo(), honesty: enterpriseArchitectureRepositoryHonesty() };
  }

  async records(session: SessionContext) {
    await this.store.ensureSeeded(session.organizationId);
    const rows = await this.store.list(session.organizationId, 'architecture');
    return {
      domain: 'architecture',
      count: rows.length,
      records: rows,
      honesty: enterpriseArchitectureRepositoryHonesty(),
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
      domain: 'architecture',
      kind: body.kind,
      title: body.title,
      status: body.status,
      summary: body.summary,
      ownerLabel: body.ownerLabel,
      content: body.content,
    });
    return { record: row, honesty: enterpriseArchitectureRepositoryHonesty() };
  }
}
