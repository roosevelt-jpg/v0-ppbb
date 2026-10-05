import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { DcivStoreService } from '../dciv-store/dciv-store.service';
import {
  evaluateAllEnterpriseUnlocks,
  evaluateSectorUnlock,
} from '../model-runtime/enterprise-unlocks';
import {
  enterpriseNationPlatformCapabilities,
  enterpriseNationPlatformHonesty,
  enterpriseNationPlatformRoutesTo,
} from './enterprise-nation-platform.catalog';

@Injectable()
export class EnterpriseNationPlatformService {
  constructor(private readonly store: DcivStoreService) {}

  private verticalUnlockOverlay() {
    const unlocks = evaluateAllEnterpriseUnlocks();
    const banking = evaluateSectorUnlock('banking');
    const hospital = evaluateSectorUnlock('hospital');
    const government = evaluateSectorUnlock('government');
    return {
      unlocks,
      verticalProduction: {
        banking: {
          productionReady: banking.productionReady,
          unlockedAt: banking.unlockedAt,
          missing: banking.missing,
        },
        hospital: {
          productionReady: hospital.productionReady,
          unlockedAt: hospital.unlockedAt,
          missing: hospital.missing,
        },
        government: {
          productionReady: government.productionReady,
          unlockedAt: government.unlockedAt,
          missing: government.missing,
        },
      },
      honesty: {
        ...enterpriseNationPlatformHonesty(),
        productionBanking: banking.productionReady,
        productionHospital: hospital.productionReady,
        productionGovernmentEnterprise: government.productionReady,
        unlockGates: true,
        note: banking.productionReady || hospital.productionReady || government.productionReady
          ? 'Selected verticals unlocked via Model Runtime enterprise checklist (ADR-0325). Remaining high-stakes domains stay demo-locked.'
          : enterpriseNationPlatformHonesty().note,
      },
    };
  }

  engine() {
    const overlay = this.verticalUnlockOverlay();
    return {
      product: 'VerbaLab Enterprise Nation Platform',
      domain: 'enterprise',
      capabilities: enterpriseNationPlatformCapabilities().map((c) => {
        if (c.id === 'bank') {
          return {
            ...c,
            status: overlay.verticalProduction.banking.productionReady ? 'production' : c.status,
            productionReady: overlay.verticalProduction.banking.productionReady,
          };
        }
        if (c.id === 'hospital') {
          return {
            ...c,
            status: overlay.verticalProduction.hospital.productionReady ? 'production' : c.status,
            productionReady: overlay.verticalProduction.hospital.productionReady,
          };
        }
        if (c.id === 'government_enterprise') {
          return {
            ...c,
            status: overlay.verticalProduction.government.productionReady ? 'production' : c.status,
            productionReady: overlay.verticalProduction.government.productionReady,
          };
        }
        return { ...c, productionReady: false };
      }),
      routesTo: enterpriseNationPlatformRoutesTo(),
      ...overlay,
      safety: {
        ...overlay.honesty,
        note: '+ ADR-0325 — bank/hospital/government unlock via Model Runtime gates.',
      },
      docs: '/docs/ENTERPRISE_NATION_PLATFORM.md',
      modelRuntime: '/model-runtime',
      note: 'Vertical platform for banks/hospitals/universities/telecoms — production unlocks gated.',
    };
  }

  products() {
    return this.engine();
  }

  monitoring() {
    const overlay = this.verticalUnlockOverlay();
    return {
      mode: 'domain',
      domain: 'enterprise',
      capabilities: enterpriseNationPlatformCapabilities().map((c) => ({ id: c.id, status: c.status })),
      ...overlay,
      note: 'Enterprise Nation Platform monitoring with Model Runtime unlock overlay.',
    };
  }

  routes() {
    return {
      routesTo: enterpriseNationPlatformRoutesTo(),
      honesty: this.verticalUnlockOverlay().honesty,
    };
  }

  async records(session: SessionContext) {
    await this.store.ensureSeeded(session.organizationId);
    const rows = await this.store.list(session.organizationId, 'enterprise');
    const overlay = this.verticalUnlockOverlay();
    return {
      domain: 'enterprise',
      count: rows.length,
      records: rows,
      ...overlay,
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
    const overlay = this.verticalUnlockOverlay();
    const row = await this.store.create(session.organizationId, {
      domain: 'enterprise',
      kind: body.kind,
      title: body.title,
      status: body.status,
      summary: body.summary,
      ownerLabel: body.ownerLabel,
      content: {
        ...(body.content ?? {}),
        productionUnlock: overlay.verticalProduction,
      },
    });
    return { record: row, ...overlay };
  }
}
