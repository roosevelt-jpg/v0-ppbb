import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { DcivStoreService } from '../dciv-store/dciv-store.service';
import {
  globalLanguagePreservationCapabilities,
  globalLanguagePreservationHonesty,
  globalLanguagePreservationRoutesTo,
} from './global-language-preservation.catalog';

@Injectable()
export class GlobalLanguagePreservationService {
  constructor(private readonly store: DcivStoreService) {}

  engine() {
    return {
      product: 'VerbaLab Global Language Preservation',
      domain: 'preservation',
      capabilities: globalLanguagePreservationCapabilities(),
      routesTo: globalLanguagePreservationRoutesTo(),
      honesty: globalLanguagePreservationHonesty(),
      safety: {
        ...globalLanguagePreservationHonesty(),
        note: 'Endangered-language archives/digital museums. consentRequiredForCulturalArchives=true.',
      },
      docs: '/docs/GLOBAL_LANGUAGE_PRESERVATION.md',
      note: 'Endangered-language archives/digital museums. consentRequiredForCulturalArchives=true.',
    };
  }

  products() { return this.engine(); }

  monitoring() {
    return {
      mode: 'domain',
      domain: 'preservation',
      capabilities: globalLanguagePreservationCapabilities().map((c) => ({ id: c.id, status: c.status })),
      honesty: globalLanguagePreservationHonesty(),
      note: 'Global Language Preservation monitoring.',
    };
  }

  routes() {
    return { routesTo: globalLanguagePreservationRoutesTo(), honesty: globalLanguagePreservationHonesty() };
  }

  async records(session: SessionContext) {
    await this.store.ensureSeeded(session.organizationId);
    const rows = await this.store.list(session.organizationId, 'preservation');
    return { domain: 'preservation', count: rows.length, records: rows, honesty: globalLanguagePreservationHonesty() };
  }

  async createRecord(
    session: SessionContext,
    body: { kind: string; title: string; status?: string; summary?: string; ownerLabel?: string; content?: Record<string, unknown> },
  ) {
    const row = await this.store.create(session.organizationId, {
      domain: 'preservation',
      kind: body.kind,
      title: body.title,
      status: body.status,
      summary: body.summary,
      ownerLabel: body.ownerLabel,
      content: body.content,
    });
    return { record: row, honesty: globalLanguagePreservationHonesty() };
  }
}
