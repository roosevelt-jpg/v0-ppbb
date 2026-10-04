import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { VgasStoreService } from '../vgas-store/vgas-store.service';
import {
  globalPartnerProgramCapabilities,
  globalPartnerProgramHonesty,
  globalPartnerProgramRoutesTo,
} from './global-partner-program.catalog';

@Injectable()
export class GlobalPartnerProgramService {
  constructor(private readonly store: VgasStoreService) {}

  engine() {
    return {
      product: 'VerbaLab Global Partner Program',
      domain: 'partner',
      capabilities: globalPartnerProgramCapabilities(),
      routesTo: globalPartnerProgramRoutesTo(),
      honesty: globalPartnerProgramHonesty(),
      safety: {
        ...globalPartnerProgramHonesty(),
        note: 'Partner onboarding portal.',
      },
      docs: '/docs/GLOBAL_PARTNER_PROGRAM.md',
      note: 'Partner onboarding portal.',
    };
  }

  products() { return this.engine(); }

  monitoring() {
    return {
      mode: 'domain',
      domain: 'partner',
      capabilities: globalPartnerProgramCapabilities().map((c) => ({ id: c.id, status: c.status })),
      honesty: globalPartnerProgramHonesty(),
      note: 'Global Partner Program monitoring.',
    };
  }

  routes() {
    return { routesTo: globalPartnerProgramRoutesTo(), honesty: globalPartnerProgramHonesty() };
  }

  async records(session: SessionContext) {
    await this.store.ensureSeeded(session.organizationId);
    const rows = await this.store.list(session.organizationId, 'partner');
    return { domain: 'partner', count: rows.length, records: rows, honesty: globalPartnerProgramHonesty() };
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
      domain: 'partner',
      kind: body.kind,
      title: body.title,
      status: body.status,
      summary: body.summary,
      ownerLabel: body.ownerLabel,
      verifyCode: body.verifyCode,
      content: body.content,
    });
    return { record: row, honesty: globalPartnerProgramHonesty() };
  }
}
