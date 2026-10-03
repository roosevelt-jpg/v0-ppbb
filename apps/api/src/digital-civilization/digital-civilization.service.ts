import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { UsageService } from '../usage/usage.service';
import { DcivStoreService } from '../dciv-store/dciv-store.service';
import { dcivHonesty } from '../dciv-store/dciv-honesty';
import {
  digitalCivilizationHonesty,
  digitalCivilizationLibrary,
  digitalCivilizationProductCatalog,
  digitalCivilizationRoutingTable,
} from './digital-civilization.catalog';

@Injectable()
export class DigitalCivilizationService {
  constructor(
    private readonly usage: UsageService,
    private readonly store: DcivStoreService,
  ) {}

  products() {
    return {
      product: 'VerbaLab Digital Civilization',
      products: digitalCivilizationProductCatalog(),
      library: digitalCivilizationLibrary(),
      honesty: digitalCivilizationHonesty(),
      safety: {
        ...digitalCivilizationHonesty(),
        note: 'Platform products for demos/licensing — not civilization infrastructure already running nations.',
      },
      docs: '/docs/DIGITAL_CIVILIZATION.md',
      note: 'Digital Civilization Foundation (VL-384). civilizationInfrastructureOs=false.',
    };
  }

  routing() {
    return {
      routes: digitalCivilizationRoutingTable(),
      products: digitalCivilizationProductCatalog().map((p) => ({ id: p.id, status: p.status, api: p.api })),
      honesty: digitalCivilizationHonesty(),
      note: 'Static DCIV discovery catalog.',
      docs: '/docs/DIGITAL_CIVILIZATION.md',
    };
  }

  guards() {
    return {
      product: 'VerbaLab Digital Civilization Guards',
      honesty: dcivHonesty(),
      rules: [
        'Demo/public-sector platforms only — runsNationalInfrastructure=false.',
        'Do not treat AI output as authoritative in courts, immigration, police, or military contexts.',
        'Do not connect citizen digital identity / portals to real authentication without legal review.',
        'Do not wire emergency-services / public-safety integrations to live dispatch.',
        'Cultural archives require consent/provenance gates.',
        'Federated/cross-border AI requires security review before data movement.',
      ],
      docs: '/docs/dciv-audit/PRODUCTION_READINESS.md',
      note: 'Volume 24 high-stakes domain honesty guards.',
    };
  }

  async overview(session: SessionContext) {
    const usageSummary = await this.usage.summary(session.organizationId);
    const dciv = await this.store.summary(session.organizationId);
    return {
      session: { organizationId: session.organizationId, workspaceId: session.workspaceId, role: session.role },
      usage: { periodStart: usageSummary.periodStart, chat: usageSummary.chat, embeddings: usageSummary.embeddings },
      products: digitalCivilizationProductCatalog(),
      library: digitalCivilizationLibrary(),
      dciv,
      honesty: digitalCivilizationHonesty(),
      links: Object.fromEntries(digitalCivilizationProductCatalog().filter((p) => p.console).map((p) => [p.id, p.console])),
      docs: '/docs/DIGITAL_CIVILIZATION.md',
      note: 'DCIV overview (VL-384-393).',
    };
  }

  async records(session: SessionContext, domain?: string) {
    await this.store.ensureSeeded(session.organizationId);
    const rows = await this.store.list(session.organizationId, domain);
    return { domain: domain ?? 'all', count: rows.length, records: rows, honesty: digitalCivilizationHonesty() };
  }

  async createRecord(
    session: SessionContext,
    body: { domain: string; kind: string; title: string; status?: string; summary?: string; ownerLabel?: string; content?: Record<string, unknown> },
  ) {
    const row = await this.store.create(session.organizationId, body);
    return { record: row, honesty: digitalCivilizationHonesty() };
  }

  monitoring() {
    return {
      mode: 'foundation',
      products: digitalCivilizationProductCatalog().map((p) => ({ id: p.id, status: p.status })),
      honesty: digitalCivilizationHonesty(),
      note: 'DCIV monitoring snapshot (VL-384).',
    };
  }
}
