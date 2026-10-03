import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { AiInternetStoreService } from '../ai-internet-store/ai-internet-store.service';
import { ownAiStackSummary } from '../gateway/verbalab-own-ai';
import { credentialsreadinessCapabilities, credentialsreadinessCatalog } from './credentials-readiness.catalog';

function present(keys: string[]) {
  return keys.some((k) => Boolean(process.env[k]?.trim()));
}

@Injectable()
export class CredentialsReadinessService {
  constructor(private readonly store: AiInternetStoreService) {}

  checklist() {
    return {
      clerk: {
        ready: present(['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'CLERK_SECRET_KEY']),
        env: ['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'CLERK_SECRET_KEY'],
      },
      stripe: {
        ready: present(['STRIPE_SECRET_KEY', 'STRIPE_PRICE_ID_PRO']),
        env: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_PRICE_ID_PRO'],
        note: 'Checkout/Portal wired; add keys later for live billing.',
      },
      verbalabModels: {
        ready:
          present(['VERBALAB_MODEL_BASE_URL', 'VERBALAB_MT_URL', 'VERBALAB_TTS_URL']) ||
          process.env.VERBALAB_OWN_AI_FIXTURE === '1',
        env: [
          'VERBALAB_MODEL_BASE_URL',
          'VERBALAB_MODEL_API_KEY',
          'VERBALAB_MT_URL',
          'VERBALAB_STT_URL',
          'VERBALAB_TTS_URL',
          'VERBALAB_CHAT_URL',
          'VERBALAB_EMBED_URL',
          'VERBALAB_OCR_URL',
          'VERBALAB_CLONE_URL',
        ],
        fixture: process.env.VERBALAB_OWN_AI_FIXTURE === '1',
      },
      fly: {
        ready: present(['FLY_API_TOKEN']),
        env: ['FLY_API_TOKEN'],
      },
      resend: {
        ready: present(['RESEND_API_KEY']),
        env: ['RESEND_API_KEY'],
      },
    };
  }

  engine() {
    const checklist = this.checklist();
    const values = Object.values(checklist) as Array<{ ready: boolean }>;
    const readyCount = values.filter((v) => v.ready).length;
    return {
      ...credentialsreadinessCatalog(),
      capabilities: credentialsreadinessCapabilities(),
      checklist,
      score: { ready: readyCount, total: values.length },
      ownAi: ownAiStackSummary(),
      note: 'VL-408 Credentials readiness — platform fully wired; add Stripe/Clerk/model keys at deploy.',
    };
  }

  async overview(session: SessionContext) {
    return {
      session: {
        organizationId: session.organizationId,
        workspaceId: session.workspaceId,
        role: session.role,
      },
      engine: this.engine(),
      summary: await this.store.summary(session.organizationId),
      links: { self: '/credentials-readiness', aiInternet: '/ai-internet', billing: '/billing' },
    };
  }

  async listRecords(session: SessionContext) {
    return { data: await this.store.list(session.organizationId, 'credentials') };
  }

  async createRecord(
    session: SessionContext,
    body: { kind: string; title: string; summary?: string; content?: Record<string, unknown> },
  ) {
    return {
      data: await this.store.create(session.organizationId, {
        domain: 'credentials',
        kind: body.kind,
        title: body.title,
        summary: body.summary,
        content: body.content,
        ownerLabel: session.userId ?? 'console',
      }),
    };
  }

  monitoring() {
    return { status: 'ready', checklist: this.checklist(), honesty: credentialsreadinessCatalog().honesty };
  }
}
