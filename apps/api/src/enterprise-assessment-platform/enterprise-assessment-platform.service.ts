import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { VgasStoreService } from '../vgas-store/vgas-store.service';
import {
  enterpriseAssessmentPlatformCapabilities,
  enterpriseAssessmentPlatformHonesty,
  enterpriseAssessmentPlatformRoutesTo,
} from './enterprise-assessment-platform.catalog';

@Injectable()
export class EnterpriseAssessmentPlatformService {
  constructor(private readonly store: VgasStoreService) {}

  engine() {
    return {
      product: 'VerbaLab Enterprise Assessment Platform',
      domain: 'assessment',
      capabilities: enterpriseAssessmentPlatformCapabilities(),
      routesTo: enterpriseAssessmentPlatformRoutesTo(),
      honesty: enterpriseAssessmentPlatformHonesty(),
      safety: {
        ...enterpriseAssessmentPlatformHonesty(),
        note: 'Maturity assessment tooling.',
      },
      docs: '/docs/ENTERPRISE_ASSESSMENT_PLATFORM.md',
      note: 'Maturity assessment tooling.',
    };
  }

  products() { return this.engine(); }

  monitoring() {
    return {
      mode: 'domain',
      domain: 'assessment',
      capabilities: enterpriseAssessmentPlatformCapabilities().map((c) => ({ id: c.id, status: c.status })),
      honesty: enterpriseAssessmentPlatformHonesty(),
      note: 'Enterprise Assessment Platform monitoring.',
    };
  }

  routes() {
    return { routesTo: enterpriseAssessmentPlatformRoutesTo(), honesty: enterpriseAssessmentPlatformHonesty() };
  }

  async records(session: SessionContext) {
    await this.store.ensureSeeded(session.organizationId);
    const rows = await this.store.list(session.organizationId, 'assessment');
    return { domain: 'assessment', count: rows.length, records: rows, honesty: enterpriseAssessmentPlatformHonesty() };
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
      domain: 'assessment',
      kind: body.kind,
      title: body.title,
      status: body.status,
      summary: body.summary,
      ownerLabel: body.ownerLabel,
      verifyCode: body.verifyCode,
      content: body.content,
    });
    return { record: row, honesty: enterpriseAssessmentPlatformHonesty() };
  }
}
