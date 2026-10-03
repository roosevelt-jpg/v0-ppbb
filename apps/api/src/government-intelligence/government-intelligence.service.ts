import { Injectable } from '@nestjs/common';
import { evaluateSectorUnlock } from '../model-runtime/enterprise-unlocks';
import { governmentIntelligenceEngineCatalog } from './government-intelligence.catalog';

@Injectable()
export class GovernmentIntelligenceService {
  private unlockOverlay() {
    const government = evaluateSectorUnlock('government');
    return {
      productionUnlock: {
        sector: 'government' as const,
        productionReady: government.productionReady,
        unlockedAt: government.unlockedAt,
        missing: government.missing,
        honesty: government.honesty,
      },
      modelRuntime: '/model-runtime',
    };
  }

  engine() {
    const catalog = governmentIntelligenceEngineCatalog();
    const overlay = this.unlockOverlay();
    return {
      ...catalog,
      ...overlay,
      honesty: {
        ...catalog.honesty,
        productionGovernment: overlay.productionUnlock.productionReady,
        unlockGates: true,
        note: overlay.productionUnlock.productionReady
          ? 'Government production unlocked via Model Runtime checklist (ADR-0325).'
          : catalog.honesty?.note ??
            'Government intelligence stays non-production until Model Runtime unlock checklist passes.',
      },
    };
  }

  terms(query?: string) {
    const catalog = this.engine();
    const q = (query ?? '').trim().toLowerCase();
    const terms = catalog.terms.filter((t) => {
      if (!q) return true;
      return (
        t.id.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.notes.toLowerCase().includes(q)
      );
    });
    return {
      terms,
      count: terms.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      productionUnlock: catalog.productionUnlock,
      note: catalog.note,
      docs: catalog.docs,
    };
  }

  query(query?: string) {
    return this.terms(query);
  }

  monitoring() {
    const catalog = this.engine();
    return {
      mode: 'domain',
      domain: 'government',
      termCount: catalog.terms.length,
      honesty: catalog.honesty,
      safety: catalog.safety,
      productionUnlock: catalog.productionUnlock,
      note: 'Government Intelligence monitoring snapshot (VL-264) + Model Runtime unlock.',
    };
  }
}
