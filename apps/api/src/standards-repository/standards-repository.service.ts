import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { VgasStoreService } from '../vgas-store/vgas-store.service';
import {
  standardsRepositoryCapabilities,
  standardsRepositoryHonesty,
  standardsRepositoryRoutesTo,
} from './standards-repository.catalog';

@Injectable()
export class StandardsRepositoryService {
  constructor(private readonly store: VgasStoreService) {}

  engine() {
    return {
      product: 'VerbaLab Standards Repository',
      domain: 'repository',
      capabilities: standardsRepositoryCapabilities(),
      routesTo: standardsRepositoryRoutesTo(),
      honesty: standardsRepositoryHonesty(),
      safety: {
        ...standardsRepositoryHonesty(),
        note: 'Versioned standards content store.',
      },
      docs: '/docs/STANDARDS_REPOSITORY.md',
      note: 'Versioned standards content store.',
    };
  }

  products() { return this.engine(); }

  monitoring() {
    return {
      mode: 'domain',
      domain: 'repository',
      capabilities: standardsRepositoryCapabilities().map((c) => ({ id: c.id, status: c.status })),
      honesty: standardsRepositoryHonesty(),
      note: 'Standards Repository monitoring.',
    };
  }

  routes() {
    return { routesTo: standardsRepositoryRoutesTo(), honesty: standardsRepositoryHonesty() };
  }

  async records(session: SessionContext) {
    await this.store.ensureSeeded(session.organizationId);
    const rows = await this.store.list(session.organizationId, 'repository');
    return { domain: 'repository', count: rows.length, records: rows, honesty: standardsRepositoryHonesty() };
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
      domain: 'repository',
      kind: body.kind,
      title: body.title,
      status: body.status,
      summary: body.summary,
      ownerLabel: body.ownerLabel,
      verifyCode: body.verifyCode,
      content: body.content,
    });
    return { record: row, honesty: standardsRepositoryHonesty() };
  }
}
