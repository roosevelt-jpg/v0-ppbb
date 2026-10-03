import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { VgasStoreService } from '../vgas-store/vgas-store.service';
import {
  bestPracticesLibraryCapabilities,
  bestPracticesLibraryHonesty,
  bestPracticesLibraryRoutesTo,
} from './best-practices-library.catalog';

@Injectable()
export class BestPracticesLibraryService {
  constructor(private readonly store: VgasStoreService) {}

  engine() {
    return {
      product: 'VerbaLab Best Practices Library',
      domain: 'practices',
      capabilities: bestPracticesLibraryCapabilities(),
      routesTo: bestPracticesLibraryRoutesTo(),
      honesty: bestPracticesLibraryHonesty(),
      safety: {
        ...bestPracticesLibraryHonesty(),
        note: 'VL-368 Pattern catalog.',
      },
      docs: '/docs/BEST_PRACTICES_LIBRARY.md',
      note: 'VL-368 Pattern catalog.',
    };
  }

  products() { return this.engine(); }

  monitoring() {
    return {
      mode: 'domain',
      domain: 'practices',
      capabilities: bestPracticesLibraryCapabilities().map((c) => ({ id: c.id, status: c.status })),
      honesty: bestPracticesLibraryHonesty(),
      note: 'Best Practices Library monitoring (VL-368).',
    };
  }

  routes() {
    return { routesTo: bestPracticesLibraryRoutesTo(), honesty: bestPracticesLibraryHonesty() };
  }

  async records(session: SessionContext) {
    await this.store.ensureSeeded(session.organizationId);
    const rows = await this.store.list(session.organizationId, 'practices');
    return { domain: 'practices', count: rows.length, records: rows, honesty: bestPracticesLibraryHonesty() };
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
      domain: 'practices',
      kind: body.kind,
      title: body.title,
      status: body.status,
      summary: body.summary,
      ownerLabel: body.ownerLabel,
      verifyCode: body.verifyCode,
      content: body.content,
    });
    return { record: row, honesty: bestPracticesLibraryHonesty() };
  }
}
