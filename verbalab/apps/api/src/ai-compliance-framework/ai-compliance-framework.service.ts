import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { VgasStoreService } from '../vgas-store/vgas-store.service';
import {
  aiComplianceFrameworkCapabilities,
  aiComplianceFrameworkHonesty,
  aiComplianceFrameworkRoutesTo,
} from './ai-compliance-framework.catalog';

@Injectable()
export class AiComplianceFrameworkService {
  constructor(private readonly store: VgasStoreService) {}

  engine() {
    return {
      product: 'VerbaLab AI Compliance Framework',
      domain: 'compliance',
      capabilities: aiComplianceFrameworkCapabilities(),
      routesTo: aiComplianceFrameworkRoutesTo(),
      honesty: aiComplianceFrameworkHonesty(),
      safety: {
        ...aiComplianceFrameworkHonesty(),
        note: 'Self-assessment gap-analysis tooling.',
      },
      docs: '/docs/AI_COMPLIANCE_FRAMEWORK.md',
      note: 'Self-assessment gap-analysis tooling.',
    };
  }

  products() { return this.engine(); }

  monitoring() {
    return {
      mode: 'domain',
      domain: 'compliance',
      capabilities: aiComplianceFrameworkCapabilities().map((c) => ({ id: c.id, status: c.status })),
      honesty: aiComplianceFrameworkHonesty(),
      note: 'AI Compliance Framework monitoring.',
    };
  }

  routes() {
    return { routesTo: aiComplianceFrameworkRoutesTo(), honesty: aiComplianceFrameworkHonesty() };
  }

  async records(session: SessionContext) {
    await this.store.ensureSeeded(session.organizationId);
    const rows = await this.store.list(session.organizationId, 'compliance');
    return { domain: 'compliance', count: rows.length, records: rows, honesty: aiComplianceFrameworkHonesty() };
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
      domain: 'compliance',
      kind: body.kind,
      title: body.title,
      status: body.status,
      summary: body.summary,
      ownerLabel: body.ownerLabel,
      verifyCode: body.verifyCode,
      content: body.content,
    });
    return { record: row, honesty: aiComplianceFrameworkHonesty() };
  }
}
