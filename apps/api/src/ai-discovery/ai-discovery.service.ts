import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { AiInternetStoreService } from '../ai-internet-store/ai-internet-store.service';
import { ownAiStackSummary } from '../gateway/verbalab-own-ai';
import { aidiscoveryCapabilities, aidiscoveryCatalog } from './ai-discovery.catalog';

@Injectable()
export class AiDiscoveryService {
  constructor(private readonly store: AiInternetStoreService) {}

  engine() {
    return {
      ...aidiscoveryCatalog(),
      capabilities: aidiscoveryCapabilities(),
      ownAi: ownAiStackSummary(),
      note: 'VL-397 AI Discovery — AI Internet protocol software; runsGlobalAiInternet=false.',
    };
  }

  async overview(session: SessionContext) {
    const records = await this.store.list(session.organizationId, 'discovery');
    const summary = await this.store.summary(session.organizationId);
    return {
      session: {
        organizationId: session.organizationId,
        workspaceId: session.workspaceId,
        role: session.role,
      },
      engine: this.engine(),
      records,
      summary,
      links: {
        self: '/ai-discovery',
        aiInternet: '/ai-internet',
        credentialsReadiness: '/credentials-readiness',
      },
    };
  }

  async listRecords(session: SessionContext) {
    return {
      data: await this.store.list(session.organizationId, 'discovery'),
    };
  }

  async createRecord(
    session: SessionContext,
    body: { kind: string; title: string; summary?: string; content?: Record<string, unknown> },
  ) {
    const row = await this.store.create(session.organizationId, {
      domain: 'discovery',
      kind: body.kind,
      title: body.title,
      summary: body.summary,
      content: body.content,
      ownerLabel: session.userId ?? 'console',
    });
    return { data: row };
  }

  monitoring() {
    return {
      status: 'ready',
      honesty: aidiscoveryCatalog().honesty,
      ownAi: ownAiStackSummary(),
    };
  }
}
