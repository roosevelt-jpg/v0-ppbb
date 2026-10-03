import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { AieStoreService } from '../aie-store/aie-store.service';
import {
  globalCommunityPlatformCapabilities,
  globalCommunityPlatformHonesty,
  globalCommunityPlatformRoutesTo,
} from './global-community-platform.catalog';

@Injectable()
export class GlobalCommunityPlatformService {
  constructor(private readonly store: AieStoreService) {}

  engine() {
    return {
      product: 'VerbaLab Global Community Platform',
      domain: 'community',
      capabilities: globalCommunityPlatformCapabilities(),
      routesTo: globalCommunityPlatformRoutesTo(),
      honesty: globalCommunityPlatformHonesty(),
      safety: {
        ...globalCommunityPlatformHonesty(),
        note: 'Forums/events/hackathons/open-source community tooling.',
      },
      docs: '/docs/GLOBAL_COMMUNITY_PLATFORM.md',
      note: 'Forums/events/hackathons/open-source community tooling.',
    };
  }

  products() { return this.engine(); }

  monitoring() {
    return {
      mode: 'domain',
      domain: 'community',
      capabilities: globalCommunityPlatformCapabilities().map((c) => ({ id: c.id, status: c.status })),
      honesty: globalCommunityPlatformHonesty(),
      note: 'Global Community Platform monitoring.',
    };
  }

  routes() {
    return { routesTo: globalCommunityPlatformRoutesTo(), honesty: globalCommunityPlatformHonesty() };
  }

  async records(session: SessionContext) {
    await this.store.ensureSeeded(session.organizationId);
    const rows = await this.store.list(session.organizationId, 'community');
    return { domain: 'community', count: rows.length, records: rows, honesty: globalCommunityPlatformHonesty() };
  }

  async createRecord(
    session: SessionContext,
    body: { kind: string; title: string; status?: string; summary?: string; ownerLabel?: string; content?: Record<string, unknown> },
  ) {
    const row = await this.store.create(session.organizationId, {
      domain: 'community',
      kind: body.kind,
      title: body.title,
      status: body.status,
      summary: body.summary,
      ownerLabel: body.ownerLabel,
      content: body.content,
    });
    return { record: row, honesty: globalCommunityPlatformHonesty() };
  }
}
