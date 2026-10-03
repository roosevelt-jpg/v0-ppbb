import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { UsageService } from '../usage/usage.service';
import { VgasStoreService } from '../vgas-store/vgas-store.service';
import {
  globalAiStandardsHonesty,
  globalAiStandardsLibrary,
  globalAiStandardsProductCatalog,
  globalAiStandardsRoutingTable,
} from './global-ai-standards.catalog';

@Injectable()
export class GlobalAiStandardsService {
  constructor(
    private readonly usage: UsageService,
    private readonly store: VgasStoreService,
  ) {}

  products() {
    return {
      product: 'VerbaLab Global AI Standards',
      products: globalAiStandardsProductCatalog(),
      library: globalAiStandardsLibrary(),
      honesty: globalAiStandardsHonesty(),
      safety: {
        ...globalAiStandardsHonesty(),
        note: 'VerbaLab standards platform software - not external ISO/IEEE/W3C adoption.',
      },
      docs: '/docs/GLOBAL_AI_STANDARDS.md',
      note: 'Global AI Standards Foundation (VL-364). internationalStandardAdoption=false; thirdPartyAccreditation=false.',
    };
  }

  routing() {
    return {
      routes: globalAiStandardsRoutingTable(),
      products: globalAiStandardsProductCatalog().map((p) => ({ id: p.id, status: p.status, api: p.api })),
      honesty: globalAiStandardsHonesty(),
      note: 'Static VGAS discovery catalog.',
      docs: '/docs/GLOBAL_AI_STANDARDS.md',
    };
  }

  async overview(session: SessionContext) {
    const usageSummary = await this.usage.summary(session.organizationId);
    const vgas = await this.store.summary(session.organizationId);
    return {
      session: { organizationId: session.organizationId, workspaceId: session.workspaceId, role: session.role },
      usage: { periodStart: usageSummary.periodStart, chat: usageSummary.chat, embeddings: usageSummary.embeddings },
      products: globalAiStandardsProductCatalog(),
      library: globalAiStandardsLibrary(),
      vgas,
      honesty: globalAiStandardsHonesty(),
      links: Object.fromEntries(globalAiStandardsProductCatalog().filter((p) => p.console).map((p) => [p.id, p.console])),
      docs: '/docs/GLOBAL_AI_STANDARDS.md',
      note: 'VGAS overview (VL-364-373).',
    };
  }

  async records(session: SessionContext, domain?: string) {
    await this.store.ensureSeeded(session.organizationId);
    const rows = await this.store.list(session.organizationId, domain);
    return { domain: domain ?? 'all', count: rows.length, records: rows, honesty: globalAiStandardsHonesty() };
  }

  async createRecord(
    session: SessionContext,
    body: { domain: string; kind: string; title: string; status?: string; summary?: string; ownerLabel?: string; verifyCode?: string; content?: Record<string, unknown> },
  ) {
    const row = await this.store.create(session.organizationId, body);
    return { record: row, honesty: globalAiStandardsHonesty() };
  }

  verify(code: string) {
    return this.store.verify(code);
  }

  monitoring() {
    return {
      mode: 'foundation',
      products: globalAiStandardsProductCatalog().map((p) => ({ id: p.id, status: p.status })),
      honesty: globalAiStandardsHonesty(),
      note: 'VGAS monitoring snapshot (VL-364).',
    };
  }
}
