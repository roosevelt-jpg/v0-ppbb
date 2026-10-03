import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { VgasStoreService } from '../vgas-store/vgas-store.service';
import {
  aiCertificationPlatformCapabilities,
  aiCertificationPlatformHonesty,
  aiCertificationPlatformRoutesTo,
} from './ai-certification-platform.catalog';

@Injectable()
export class AiCertificationPlatformService {
  constructor(private readonly store: VgasStoreService) {}

  engine() {
    return {
      product: 'VerbaLab AI Certification Platform',
      domain: 'certification',
      capabilities: aiCertificationPlatformCapabilities(),
      routesTo: aiCertificationPlatformRoutesTo(),
      honesty: aiCertificationPlatformHonesty(),
      safety: {
        ...aiCertificationPlatformHonesty(),
        note: 'VL-365 VerbaLab-issued certificates. thirdPartyAccreditation=false.',
      },
      docs: '/docs/AI_CERTIFICATION_PLATFORM.md',
      note: 'VL-365 VerbaLab-issued certificates. thirdPartyAccreditation=false.',
    };
  }

  products() { return this.engine(); }

  monitoring() {
    return {
      mode: 'domain',
      domain: 'certification',
      capabilities: aiCertificationPlatformCapabilities().map((c) => ({ id: c.id, status: c.status })),
      honesty: aiCertificationPlatformHonesty(),
      note: 'AI Certification Platform monitoring (VL-365).',
    };
  }

  routes() {
    return { routesTo: aiCertificationPlatformRoutesTo(), honesty: aiCertificationPlatformHonesty() };
  }

  async records(session: SessionContext) {
    await this.store.ensureSeeded(session.organizationId);
    const rows = await this.store.list(session.organizationId, 'certification');
    return { domain: 'certification', count: rows.length, records: rows, honesty: aiCertificationPlatformHonesty() };
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
      domain: 'certification',
      kind: body.kind,
      title: body.title,
      status: body.status,
      summary: body.summary,
      ownerLabel: body.ownerLabel,
      verifyCode: body.verifyCode,
      content: body.content,
    });
    return { record: row, honesty: aiCertificationPlatformHonesty() };
  }
}
