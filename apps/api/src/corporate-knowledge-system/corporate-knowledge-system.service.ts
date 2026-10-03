import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { VcosStoreService } from '../vcos-store/vcos-store.service';
import {
  corporateKnowledgeSystemCapabilities,
  corporateKnowledgeSystemHonesty,
  corporateKnowledgeSystemRoutesTo,
} from './corporate-knowledge-system.catalog';

@Injectable()
export class CorporateKnowledgeSystemService {
  constructor(private readonly store: VcosStoreService) {}

  engine() {
    return {
      product: 'VerbaLab Corporate Knowledge System',
      domain: 'knowledge',
      capabilities: corporateKnowledgeSystemCapabilities(),
      routesTo: corporateKnowledgeSystemRoutesTo(),
      honesty: corporateKnowledgeSystemHonesty(),
      safety: {
        ...corporateKnowledgeSystemHonesty(),
        note: 'VL-360. Policies/SOPs/playbooks/decision records portal — not Confluence OS.',
      },
      docs: '/docs/CORPORATE_KNOWLEDGE_SYSTEM.md',
      note: 'VL-360. Policies/SOPs/playbooks/decision records portal — not Confluence OS.',
    };
  }

  products() {
    return this.engine();
  }

  monitoring() {
    return {
      mode: 'domain',
      domain: 'knowledge',
      capabilities: corporateKnowledgeSystemCapabilities().map((c) => ({ id: c.id, status: c.status })),
      honesty: corporateKnowledgeSystemHonesty(),
      note: 'Corporate Knowledge System monitoring (VL-360).',
    };
  }

  routes() {
    return { routesTo: corporateKnowledgeSystemRoutesTo(), honesty: corporateKnowledgeSystemHonesty() };
  }

  async records(session: SessionContext) {
    await this.store.ensureSeeded(session.organizationId);
    const rows = await this.store.list(session.organizationId, 'knowledge');
    return {
      domain: 'knowledge',
      count: rows.length,
      records: rows,
      honesty: corporateKnowledgeSystemHonesty(),
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
      domain: 'knowledge',
      kind: body.kind,
      title: body.title,
      status: body.status,
      summary: body.summary,
      ownerLabel: body.ownerLabel,
      content: body.content,
    });
    return { record: row, honesty: corporateKnowledgeSystemHonesty() };
  }
}
