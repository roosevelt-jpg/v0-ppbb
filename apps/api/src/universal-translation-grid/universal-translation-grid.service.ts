import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { DcivStoreService } from '../dciv-store/dciv-store.service';
import {
  universalTranslationGridCapabilities,
  universalTranslationGridHonesty,
  universalTranslationGridRoutesTo,
} from './universal-translation-grid.catalog';

@Injectable()
export class UniversalTranslationGridService {
  constructor(private readonly store: DcivStoreService) {}

  engine() {
    return {
      product: 'VerbaLab Universal Translation Grid',
      domain: 'grid',
      capabilities: universalTranslationGridCapabilities(),
      routesTo: universalTranslationGridRoutesTo(),
      honesty: universalTranslationGridHonesty(),
      safety: {
        ...universalTranslationGridHonesty(),
        note: 'VL-389 Translation infrastructure across speech/doc/broadcast/IoT channels.',
      },
      docs: '/docs/UNIVERSAL_TRANSLATION_GRID.md',
      note: 'VL-389 Translation infrastructure across speech/doc/broadcast/IoT channels.',
    };
  }

  products() { return this.engine(); }

  monitoring() {
    return {
      mode: 'domain',
      domain: 'grid',
      capabilities: universalTranslationGridCapabilities().map((c) => ({ id: c.id, status: c.status })),
      honesty: universalTranslationGridHonesty(),
      note: 'Universal Translation Grid monitoring (VL-389).',
    };
  }

  routes() {
    return { routesTo: universalTranslationGridRoutesTo(), honesty: universalTranslationGridHonesty() };
  }

  async records(session: SessionContext) {
    await this.store.ensureSeeded(session.organizationId);
    const rows = await this.store.list(session.organizationId, 'grid');
    return { domain: 'grid', count: rows.length, records: rows, honesty: universalTranslationGridHonesty() };
  }

  async createRecord(
    session: SessionContext,
    body: { kind: string; title: string; status?: string; summary?: string; ownerLabel?: string; content?: Record<string, unknown> },
  ) {
    const row = await this.store.create(session.organizationId, {
      domain: 'grid',
      kind: body.kind,
      title: body.title,
      status: body.status,
      summary: body.summary,
      ownerLabel: body.ownerLabel,
      content: body.content,
    });
    return { record: row, honesty: universalTranslationGridHonesty() };
  }
}
