import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { VcosStoreService } from '../vcos-store/vcos-store.service';
import {
  businessArchitectureCapabilities,
  businessArchitectureHonesty,
  businessArchitectureRoutesTo,
} from './business-architecture.catalog';

@Injectable()
export class BusinessArchitectureService {
  constructor(private readonly store: VcosStoreService) {}

  engine() {
    return {
      product: 'VerbaLab Business Architecture',
      domain: 'capability',
      capabilities: businessArchitectureCapabilities(),
      routesTo: businessArchitectureRoutesTo(),
      honesty: businessArchitectureHonesty(),
      safety: {
        ...businessArchitectureHonesty(),
        note: 'Capability, value-stream, process, journey modeling.',
      },
      docs: '/docs/BUSINESS_ARCHITECTURE.md',
      note: 'Capability, value-stream, process, journey modeling.',
    };
  }

  products() {
    return this.engine();
  }

  monitoring() {
    return {
      mode: 'domain',
      domain: 'capability',
      capabilities: businessArchitectureCapabilities().map((c) => ({ id: c.id, status: c.status })),
      honesty: businessArchitectureHonesty(),
      note: 'Business Architecture monitoring.',
    };
  }

  routes() {
    return { routesTo: businessArchitectureRoutesTo(), honesty: businessArchitectureHonesty() };
  }

  async records(session: SessionContext) {
    await this.store.ensureSeeded(session.organizationId);
    const rows = await this.store.list(session.organizationId, 'capability');
    return {
      domain: 'capability',
      count: rows.length,
      records: rows,
      honesty: businessArchitectureHonesty(),
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
      domain: 'capability',
      kind: body.kind,
      title: body.title,
      status: body.status,
      summary: body.summary,
      ownerLabel: body.ownerLabel,
      content: body.content,
    });
    return { record: row, honesty: businessArchitectureHonesty() };
  }
}
