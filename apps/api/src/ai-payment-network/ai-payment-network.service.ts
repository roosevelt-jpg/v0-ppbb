import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { AiInternetStoreService } from '../ai-internet-store/ai-internet-store.service';
import { ownAiStackSummary } from '../gateway/verbalab-own-ai';
import { aipaymentnetworkCapabilities, aipaymentnetworkCatalog } from './ai-payment-network.catalog';

@Injectable()
export class AiPaymentNetworkService {
  constructor(private readonly store: AiInternetStoreService) {}

  engine() {
    return {
      ...aipaymentnetworkCatalog(),
      capabilities: aipaymentnetworkCapabilities(),
      ownAi: ownAiStackSummary(),
      note: 'VL-401 AI Payment Network — AI Internet protocol software; runsGlobalAiInternet=false.',
    };
  }

  async overview(session: SessionContext) {
    const records = await this.store.list(session.organizationId, 'payments');
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
        self: '/ai-payment-network',
        aiInternet: '/ai-internet',
        credentialsReadiness: '/credentials-readiness',
      },
    };
  }

  async listRecords(session: SessionContext) {
    return {
      data: await this.store.list(session.organizationId, 'payments'),
    };
  }

  async createRecord(
    session: SessionContext,
    body: { kind: string; title: string; summary?: string; content?: Record<string, unknown> },
  ) {
    const row = await this.store.create(session.organizationId, {
      domain: 'payments',
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
      honesty: aipaymentnetworkCatalog().honesty,
      ownAi: ownAiStackSummary(),
    };
  }
}
