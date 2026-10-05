import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { AieStoreService } from '../aie-store/aie-store.service';
import {
  aiTalentPlatformCapabilities,
  aiTalentPlatformHonesty,
  aiTalentPlatformRoutesTo,
} from './ai-talent-platform.catalog';

@Injectable()
export class AiTalentPlatformService {
  constructor(private readonly store: AieStoreService) {}

  engine() {
    return {
      product: 'VerbaLab AI Talent Platform',
      domain: 'talent',
      capabilities: aiTalentPlatformCapabilities(),
      routesTo: aiTalentPlatformRoutesTo(),
      honesty: aiTalentPlatformHonesty(),
      safety: {
        ...aiTalentPlatformHonesty(),
        note: 'Marketplace matching for linguists/voice artists/translators/annotators — contracts still human.',
      },
      docs: '/docs/AI_TALENT_PLATFORM.md',
      note: 'Marketplace matching for linguists/voice artists/translators/annotators — contracts still human.',
    };
  }

  products() { return this.engine(); }

  monitoring() {
    return {
      mode: 'domain',
      domain: 'talent',
      capabilities: aiTalentPlatformCapabilities().map((c) => ({ id: c.id, status: c.status })),
      honesty: aiTalentPlatformHonesty(),
      note: 'AI Talent Platform monitoring.',
    };
  }

  routes() {
    return { routesTo: aiTalentPlatformRoutesTo(), honesty: aiTalentPlatformHonesty() };
  }

  async records(session: SessionContext) {
    await this.store.ensureSeeded(session.organizationId);
    const rows = await this.store.list(session.organizationId, 'talent');
    return { domain: 'talent', count: rows.length, records: rows, honesty: aiTalentPlatformHonesty() };
  }

  async createRecord(
    session: SessionContext,
    body: { kind: string; title: string; status?: string; summary?: string; ownerLabel?: string; content?: Record<string, unknown> },
  ) {
    const row = await this.store.create(session.organizationId, {
      domain: 'talent',
      kind: body.kind,
      title: body.title,
      status: body.status,
      summary: body.summary,
      ownerLabel: body.ownerLabel,
      content: body.content,
    });
    return { record: row, honesty: aiTalentPlatformHonesty() };
  }
}
