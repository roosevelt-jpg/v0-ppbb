import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { DcivStoreService } from '../dciv-store/dciv-store.service';
import {
  nationalAiPlatformCapabilities,
  nationalAiPlatformHonesty,
  nationalAiPlatformRoutesTo,
} from './national-ai-platform.catalog';

@Injectable()
export class NationalAiPlatformService {
  constructor(private readonly store: DcivStoreService) {}

  engine() {
    return {
      product: 'VerbaLab National AI Platform',
      domain: 'national',
      capabilities: nationalAiPlatformCapabilities(),
      routesTo: nationalAiPlatformRoutesTo(),

      deploymentMode: 'demo_public_sector_only',
      productionGovernmentDeployment: false,
      productionCourtPoliceMilitary: false,
      productionCitizenIdentityAuth: false,
      authoritativeOutput: false,
      honesty: nationalAiPlatformHonesty(),
      safety: {
        ...nationalAiPlatformHonesty(),
        note: 'VL-385 Gov/public-sector demo platform. productionCourtPoliceMilitary=false; productionCitizenIdentityAuth=false.',
      },
      docs: '/docs/NATIONAL_AI_PLATFORM.md',
      note: 'VL-385 Gov/public-sector demo platform. productionCourtPoliceMilitary=false; productionCitizenIdentityAuth=false.',
    };
  }

  products() { return this.engine(); }

  monitoring() {
    return {
      mode: 'domain',
      domain: 'national',
      capabilities: nationalAiPlatformCapabilities().map((c) => ({ id: c.id, status: c.status })),
      honesty: nationalAiPlatformHonesty(),
      note: 'National AI Platform monitoring (VL-385).',
    };
  }

  routes() {
    return { routesTo: nationalAiPlatformRoutesTo(), honesty: nationalAiPlatformHonesty() };
  }

  async records(session: SessionContext) {
    await this.store.ensureSeeded(session.organizationId);
    const rows = await this.store.list(session.organizationId, 'national');
    return { domain: 'national', count: rows.length, records: rows, honesty: nationalAiPlatformHonesty() };
  }

  async createRecord(
    session: SessionContext,
    body: { kind: string; title: string; status?: string; summary?: string; ownerLabel?: string; content?: Record<string, unknown> },
  ) {
    const row = await this.store.create(session.organizationId, {
      domain: 'national',
      kind: body.kind,
      title: body.title,
      status: body.status,
      summary: body.summary,
      ownerLabel: body.ownerLabel,
      content: body.content,
    });
    return { record: row, honesty: nationalAiPlatformHonesty() };
  }
}
