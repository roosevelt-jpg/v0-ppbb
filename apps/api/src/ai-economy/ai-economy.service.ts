import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { UsageService } from '../usage/usage.service';
import { AieStoreService } from '../aie-store/aie-store.service';
import { aieHonesty } from '../aie-store/aie-honesty';
import {
  aiEconomyHonesty,
  aiEconomyLibrary,
  aiEconomyProductCatalog,
  aiEconomyRoutingTable,
} from './ai-economy.catalog';

@Injectable()
export class AiEconomyService {
  constructor(
    private readonly usage: UsageService,
    private readonly store: AieStoreService,
  ) {}

  products() {
    return {
      product: 'VerbaLab AI Economy',
      products: aiEconomyProductCatalog(),
      library: aiEconomyLibrary(),
      honesty: aiEconomyHonesty(),
      safety: {
        ...aiEconomyHonesty(),
        note: 'Marketplace/commerce software — not world-largest economy status; Stripe for payments; investment dashboard only.',
      },
      docs: '/docs/AI_ECONOMY.md',
      note: 'AI Economy Foundation (VL-374). worldsLargestAiEconomy=false.',
    };
  }

  routing() {
    return {
      routes: aiEconomyRoutingTable(),
      products: aiEconomyProductCatalog().map((p) => ({ id: p.id, status: p.status, api: p.api })),
      honesty: aiEconomyHonesty(),
      note: 'Static AIE discovery catalog.',
      docs: '/docs/AI_ECONOMY.md',
    };
  }

  guards() {
    return {
      product: 'VerbaLab AI Economy Guards',
      honesty: aieHonesty(),
      rules: [
        'Do not hand-roll card/PAN handling — use existing Stripe / Monetization Cloud.',
        'Revenue share and payouts are ledger/workflow records; autonomousPayouts=false.',
        'AI Investment Platform is a dashboard/reporting tool only — not a funding portal.',
        'Tax/1099 and securities structuring require human finance/legal — not this code.',
      ],
      docs: '/docs/aie-audit/PRODUCTION_READINESS.md',
      note: 'Volume 23 money/securities honesty guards.',
    };
  }

  async overview(session: SessionContext) {
    const usageSummary = await this.usage.summary(session.organizationId);
    const aie = await this.store.summary(session.organizationId);
    return {
      session: { organizationId: session.organizationId, workspaceId: session.workspaceId, role: session.role },
      usage: { periodStart: usageSummary.periodStart, chat: usageSummary.chat, embeddings: usageSummary.embeddings },
      products: aiEconomyProductCatalog(),
      library: aiEconomyLibrary(),
      aie,
      honesty: aiEconomyHonesty(),
      links: Object.fromEntries(aiEconomyProductCatalog().filter((p) => p.console).map((p) => [p.id, p.console])),
      docs: '/docs/AI_ECONOMY.md',
      note: 'AIE overview (VL-374-383).',
    };
  }

  async records(session: SessionContext, domain?: string) {
    await this.store.ensureSeeded(session.organizationId);
    const rows = await this.store.list(session.organizationId, domain);
    return { domain: domain ?? 'all', count: rows.length, records: rows, honesty: aiEconomyHonesty() };
  }

  async createRecord(
    session: SessionContext,
    body: { domain: string; kind: string; title: string; status?: string; summary?: string; ownerLabel?: string; content?: Record<string, unknown> },
  ) {
    const row = await this.store.create(session.organizationId, body);
    return { record: row, honesty: aiEconomyHonesty() };
  }

  monitoring() {
    return {
      mode: 'foundation',
      products: aiEconomyProductCatalog().map((p) => ({ id: p.id, status: p.status })),
      honesty: aiEconomyHonesty(),
      note: 'AIE monitoring snapshot (VL-374).',
    };
  }
}
