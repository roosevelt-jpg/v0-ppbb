import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { DcivStoreService } from '../dciv-store/dciv-store.service';
import {
  globalKnowledgeNetworkCapabilities,
  globalKnowledgeNetworkHonesty,
  globalKnowledgeNetworkRoutesTo,
} from './global-knowledge-network.catalog';

@Injectable()
export class GlobalKnowledgeNetworkService {
  constructor(private readonly store: DcivStoreService) {}

  engine() {
    return {
      product: 'VerbaLab Global Knowledge Network',
      domain: 'knowledge',
      capabilities: globalKnowledgeNetworkCapabilities(),
      routesTo: globalKnowledgeNetworkRoutesTo(),
      honesty: globalKnowledgeNetworkHonesty(),
      safety: {
        ...globalKnowledgeNetworkHonesty(),
        note: 'VL-390 Research/library/museum knowledge sharing network product.',
      },
      docs: '/docs/GLOBAL_KNOWLEDGE_NETWORK.md',
      note: 'VL-390 Research/library/museum knowledge sharing network product.',
    };
  }

  products() { return this.engine(); }

  monitoring() {
    return {
      mode: 'domain',
      domain: 'knowledge',
      capabilities: globalKnowledgeNetworkCapabilities().map((c) => ({ id: c.id, status: c.status })),
      honesty: globalKnowledgeNetworkHonesty(),
      note: 'Global Knowledge Network monitoring (VL-390).',
    };
  }

  routes() {
    return { routesTo: globalKnowledgeNetworkRoutesTo(), honesty: globalKnowledgeNetworkHonesty() };
  }

  async records(session: SessionContext) {
    await this.store.ensureSeeded(session.organizationId);
    const rows = await this.store.list(session.organizationId, 'knowledge');
    return { domain: 'knowledge', count: rows.length, records: rows, honesty: globalKnowledgeNetworkHonesty() };
  }

  async createRecord(
    session: SessionContext,
    body: { kind: string; title: string; status?: string; summary?: string; ownerLabel?: string; content?: Record<string, unknown> },
  ) {
    const row = await this.store.create(session.organizationId, {
      domain: 'knowledge',
      kind: body.kind,
      title: body.title,
      status: body.status,
      summary: body.summary,
      ownerLabel: body.ownerLabel,
      content: body.content,
    });
    return { record: row, honesty: globalKnowledgeNetworkHonesty() };
  }
}
