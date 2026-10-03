import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { VgasStoreService } from '../vgas-store/vgas-store.service';
import { vgasCertificationScheme } from '../vgas-store/vgas-iso-process';
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
      scheme: vgasCertificationScheme(),
      honesty: aiCertificationPlatformHonesty(),
      safety: {
        ...aiCertificationPlatformHonesty(),
        note: 'VerbaLab-issued certificates under ISO-aligned scheme. thirdPartyAccreditation=false.',
      },
      docs: '/docs/AI_CERTIFICATION_PLATFORM.md',
      note: 'VerbaLab-issued certificates under ISO-aligned scheme. thirdPartyAccreditation=false.',
    };
  }

  scheme() {
    return {
      scheme: vgasCertificationScheme(),
      honesty: aiCertificationPlatformHonesty(),
      docs: '/docs/vgas-audit/CERTIFICATION_GUIDE.md',
      note: 'Personnel certification scheme inspired by ISO/IEC 17024 principles — not an accredited CB.',
    };
  }

  products() { return this.engine(); }

  monitoring() {
    return {
      mode: 'domain',
      domain: 'certification',
      capabilities: aiCertificationPlatformCapabilities().map((c) => ({ id: c.id, status: c.status })),
      honesty: aiCertificationPlatformHonesty(),
      note: 'AI Certification Platform monitoring.',
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
