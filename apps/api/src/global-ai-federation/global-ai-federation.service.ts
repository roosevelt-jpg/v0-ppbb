import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { DcivStoreService } from '../dciv-store/dciv-store.service';
import {
  globalAiFederationCapabilities,
  globalAiFederationHonesty,
  globalAiFederationRoutesTo,
} from './global-ai-federation.catalog';

@Injectable()
export class GlobalAiFederationService {
  constructor(private readonly store: DcivStoreService) {}

  engine() {
    return {
      product: 'VerbaLab Global AI Federation',
      domain: 'federation',
      capabilities: globalAiFederationCapabilities(),
      routesTo: globalAiFederationRoutesTo(),
      honesty: globalAiFederationHonesty(),
      safety: {
        ...globalAiFederationHonesty(),
        note: 'VL-391 Federated learning/cross-border collaboration. federationSecurityReviewRequired=true.',
      },
      docs: '/docs/GLOBAL_AI_FEDERATION.md',
      note: 'VL-391 Federated learning/cross-border collaboration. federationSecurityReviewRequired=true.',
    };
  }

  products() { return this.engine(); }

  monitoring() {
    return {
      mode: 'domain',
      domain: 'federation',
      capabilities: globalAiFederationCapabilities().map((c) => ({ id: c.id, status: c.status })),
      honesty: globalAiFederationHonesty(),
      note: 'Global AI Federation monitoring (VL-391).',
    };
  }

  routes() {
    return { routesTo: globalAiFederationRoutesTo(), honesty: globalAiFederationHonesty() };
  }

  async records(session: SessionContext) {
    await this.store.ensureSeeded(session.organizationId);
    const rows = await this.store.list(session.organizationId, 'federation');
    return { domain: 'federation', count: rows.length, records: rows, honesty: globalAiFederationHonesty() };
  }

  async createRecord(
    session: SessionContext,
    body: { kind: string; title: string; status?: string; summary?: string; ownerLabel?: string; content?: Record<string, unknown> },
  ) {
    const row = await this.store.create(session.organizationId, {
      domain: 'federation',
      kind: body.kind,
      title: body.title,
      status: body.status,
      summary: body.summary,
      ownerLabel: body.ownerLabel,
      content: body.content,
    });
    return { record: row, honesty: globalAiFederationHonesty() };
  }
}
