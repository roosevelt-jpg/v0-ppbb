import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { UsageService } from '../usage/usage.service';
import { VcosStoreService } from '../vcos-store/vcos-store.service';
import {
  corporateOperatingSystemHonesty,
  corporateOperatingSystemProductCatalog,
  corporateOperatingSystemRoutingTable,
  digitalConstitutionLayers,
} from './corporate-operating-system.catalog';

@Injectable()
export class CorporateOperatingSystemService {
  constructor(
    private readonly usage: UsageService,
    private readonly store: VcosStoreService,
  ) {}

  products() {
    return {
      product: 'VerbaLab Corporate Operating System',
      products: corporateOperatingSystemProductCatalog(),
      honesty: corporateOperatingSystemHonesty(),
      safety: {
        ...corporateOperatingSystemHonesty(),
        note: 'Tooling for how the company runs — not a real board or legal counsel.',
      },
      docs: '/docs/CORPORATE_OPERATING_SYSTEM.md',
      note: 'Corporate Operating System Foundation. internalBusinessSoftware=true; realCorporateGovernance=false.',
    };
  }

  routing() {
    return {
      routes: corporateOperatingSystemRoutingTable(),
      products: corporateOperatingSystemProductCatalog().map((p) => ({
        id: p.id,
        status: p.status,
        api: p.api,
      })),
      honesty: corporateOperatingSystemHonesty(),
      note: 'Static VCOS discovery catalog.',
      docs: '/docs/CORPORATE_OPERATING_SYSTEM.md',
    };
  }

  constitution() {
    return {
      product: 'VerbaLab Digital Constitution',
      version: '1.0.0',
      layers: digitalConstitutionLayers(),
      honesty: corporateOperatingSystemHonesty(),
      docs: '/docs/DIGITAL_CONSTITUTION.md',
      note: 'Version-controlled constitutional principles. Not legal incorporation documents.',
    };
  }

  async overview(session: SessionContext) {
    const usageSummary = await this.usage.summary(session.organizationId);
    const vcos = await this.store.summary(session.organizationId);
    return {
      session: {
        organizationId: session.organizationId,
        workspaceId: session.workspaceId,
        role: session.role,
      },
      usage: {
        periodStart: usageSummary.periodStart,
        chat: usageSummary.chat,
        embeddings: usageSummary.embeddings,
      },
      products: corporateOperatingSystemProductCatalog(),
      vcos,
      constitution: digitalConstitutionLayers(),
      honesty: corporateOperatingSystemHonesty(),
      links: Object.fromEntries(
        corporateOperatingSystemProductCatalog()
          .filter((p) => p.console)
          .map((p) => [p.id, p.console]),
      ),
      docs: '/docs/CORPORATE_OPERATING_SYSTEM.md',
      note: 'VCOS overview. Internal business software for African AI company operations.',
    };
  }

  async records(session: SessionContext, domain?: string) {
    await this.store.ensureSeeded(session.organizationId);
    const rows = await this.store.list(session.organizationId, domain);
    return {
      domain: domain ?? 'all',
      count: rows.length,
      records: rows,
      honesty: corporateOperatingSystemHonesty(),
    };
  }

  async createRecord(
    session: SessionContext,
    body: {
      domain: string;
      kind: string;
      title: string;
      status?: string;
      summary?: string;
      ownerLabel?: string;
      content?: Record<string, unknown>;
    },
  ) {
    const row = await this.store.create(session.organizationId, body);
    return { record: row, honesty: corporateOperatingSystemHonesty() };
  }

  monitoring() {
    return {
      mode: 'foundation',
      products: corporateOperatingSystemProductCatalog().map((p) => ({ id: p.id, status: p.status })),
      honesty: corporateOperatingSystemHonesty(),
      note: 'VCOS monitoring snapshot.',
    };
  }
}
