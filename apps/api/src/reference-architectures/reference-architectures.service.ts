import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { VgasStoreService } from '../vgas-store/vgas-store.service';
import {
  referenceArchitecturesCapabilities,
  referenceArchitecturesHonesty,
  referenceArchitecturesRoutesTo,
} from './reference-architectures.catalog';

@Injectable()
export class ReferenceArchitecturesService {
  constructor(private readonly store: VgasStoreService) {}

  engine() {
    return {
      product: 'VerbaLab Reference Architectures',
      domain: 'reference',
      capabilities: referenceArchitecturesCapabilities(),
      routesTo: referenceArchitecturesRoutesTo(),
      honesty: referenceArchitecturesHonesty(),
      safety: {
        ...referenceArchitecturesHonesty(),
        note: 'Industry vertical blueprints.',
      },
      docs: '/docs/REFERENCE_ARCHITECTURES.md',
      note: 'Industry vertical blueprints.',
    };
  }

  products() { return this.engine(); }

  monitoring() {
    return {
      mode: 'domain',
      domain: 'reference',
      capabilities: referenceArchitecturesCapabilities().map((c) => ({ id: c.id, status: c.status })),
      honesty: referenceArchitecturesHonesty(),
      note: 'Reference Architectures monitoring.',
    };
  }

  routes() {
    return { routesTo: referenceArchitecturesRoutesTo(), honesty: referenceArchitecturesHonesty() };
  }

  async records(session: SessionContext) {
    await this.store.ensureSeeded(session.organizationId);
    const rows = await this.store.list(session.organizationId, 'reference');
    return { domain: 'reference', count: rows.length, records: rows, honesty: referenceArchitecturesHonesty() };
  }

  async createRecord(
    session: SessionContext,
    body: {
      kind: string;
      title: string;
      status?: string;
      summary?: string;
      ownerLabel?: string;
      verifyCode?: string;
      content?: Record<string, unknown>;
    },
  ) {
    const row = await this.store.create(session.organizationId, {
      domain: 'reference',
      kind: body.kind,
      title: body.title,
      status: body.status,
      summary: body.summary,
      ownerLabel: body.ownerLabel,
      verifyCode: body.verifyCode,
      content: body.content,
    });
    return { record: row, honesty: referenceArchitecturesHonesty() };
  }
}
