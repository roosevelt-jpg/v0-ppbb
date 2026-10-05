import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { AiInternetStoreService } from '../ai-internet-store/ai-internet-store.service';
import { ownAiStackSummary } from '../gateway/verbalab-own-ai';
import { a2aprotocolCapabilities, a2aprotocolCatalog } from './a2a-protocol.catalog';

@Injectable()
export class A2aProtocolService {
  constructor(private readonly store: AiInternetStoreService) {}

  engine() {
    return {
      ...a2aprotocolCatalog(),
      capabilities: a2aprotocolCapabilities(),
      ownAi: ownAiStackSummary(),
      note: 'A2A Protocol — AI Internet protocol software; runsGlobalAiInternet=false.',
    };
  }

  async overview(session: SessionContext) {
    const records = await this.store.list(session.organizationId, 'a2a');
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
        self: '/a2a-protocol',
        aiInternet: '/ai-internet',
        credentialsReadiness: '/credentials-readiness',
      },
    };
  }

  async listRecords(session: SessionContext) {
    return {
      data: await this.store.list(session.organizationId, 'a2a'),
    };
  }

  async createRecord(
    session: SessionContext,
    body: { kind: string; title: string; summary?: string; content?: Record<string, unknown> },
  ) {
    const row = await this.store.create(session.organizationId, {
      domain: 'a2a',
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
      honesty: a2aprotocolCatalog().honesty,
      ownAi: ownAiStackSummary(),
    };
  }
}
