import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { AieStoreService } from '../aie-store/aie-store.service';
import {
  aiLicensingPlatformCapabilities,
  aiLicensingPlatformHonesty,
  aiLicensingPlatformRoutesTo,
} from './ai-licensing-platform.catalog';

@Injectable()
export class AiLicensingPlatformService {
  constructor(private readonly store: AieStoreService) {}

  engine() {
    return {
      product: 'VerbaLab AI Licensing Platform',
      domain: 'licensing',
      capabilities: aiLicensingPlatformCapabilities(),
      routesTo: aiLicensingPlatformRoutesTo(),
      honesty: aiLicensingPlatformHonesty(),
      safety: {
        ...aiLicensingPlatformHonesty(),
        note: 'VL-376 License entitlement ledger for models/datasets/voice/translation — not legal counsel.',
      },
      docs: '/docs/AI_LICENSING_PLATFORM.md',
      note: 'VL-376 License entitlement ledger for models/datasets/voice/translation — not legal counsel.',
    };
  }

  products() { return this.engine(); }

  monitoring() {
    return {
      mode: 'domain',
      domain: 'licensing',
      capabilities: aiLicensingPlatformCapabilities().map((c) => ({ id: c.id, status: c.status })),
      honesty: aiLicensingPlatformHonesty(),
      note: 'AI Licensing Platform monitoring (VL-376).',
    };
  }

  routes() {
    return { routesTo: aiLicensingPlatformRoutesTo(), honesty: aiLicensingPlatformHonesty() };
  }

  async records(session: SessionContext) {
    await this.store.ensureSeeded(session.organizationId);
    const rows = await this.store.list(session.organizationId, 'licensing');
    return { domain: 'licensing', count: rows.length, records: rows, honesty: aiLicensingPlatformHonesty() };
  }

  async createRecord(
    session: SessionContext,
    body: { kind: string; title: string; status?: string; summary?: string; ownerLabel?: string; content?: Record<string, unknown> },
  ) {
    const row = await this.store.create(session.organizationId, {
      domain: 'licensing',
      kind: body.kind,
      title: body.title,
      status: body.status,
      summary: body.summary,
      ownerLabel: body.ownerLabel,
      content: body.content,
    });
    return { record: row, honesty: aiLicensingPlatformHonesty() };
  }
}
