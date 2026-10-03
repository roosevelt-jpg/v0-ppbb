import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { DcivStoreService } from '../dciv-store/dciv-store.service';
import {
  smartCityPlatformCapabilities,
  smartCityPlatformHonesty,
  smartCityPlatformRoutesTo,
} from './smart-city-platform.catalog';

@Injectable()
export class SmartCityPlatformService {
  constructor(private readonly store: DcivStoreService) {}

  engine() {
    return {
      product: 'VerbaLab Smart City Platform',
      domain: 'city',
      capabilities: smartCityPlatformCapabilities(),
      routesTo: smartCityPlatformRoutesTo(),

      deploymentMode: 'demo_city_integration_only',
      productionEmergencyDispatch: false,
      authoritativeOutput: false,
      honesty: smartCityPlatformHonesty(),
      safety: {
        ...smartCityPlatformHonesty(),
        note: 'VL-386 City systems integration demo. productionEmergencyDispatch=false.',
      },
      docs: '/docs/SMART_CITY_PLATFORM.md',
      note: 'VL-386 City systems integration demo. productionEmergencyDispatch=false.',
    };
  }

  products() { return this.engine(); }

  monitoring() {
    return {
      mode: 'domain',
      domain: 'city',
      capabilities: smartCityPlatformCapabilities().map((c) => ({ id: c.id, status: c.status })),
      honesty: smartCityPlatformHonesty(),
      note: 'Smart City Platform monitoring (VL-386).',
    };
  }

  routes() {
    return { routesTo: smartCityPlatformRoutesTo(), honesty: smartCityPlatformHonesty() };
  }

  async records(session: SessionContext) {
    await this.store.ensureSeeded(session.organizationId);
    const rows = await this.store.list(session.organizationId, 'city');
    return { domain: 'city', count: rows.length, records: rows, honesty: smartCityPlatformHonesty() };
  }

  async createRecord(
    session: SessionContext,
    body: { kind: string; title: string; status?: string; summary?: string; ownerLabel?: string; content?: Record<string, unknown> },
  ) {
    const row = await this.store.create(session.organizationId, {
      domain: 'city',
      kind: body.kind,
      title: body.title,
      status: body.status,
      summary: body.summary,
      ownerLabel: body.ownerLabel,
      content: body.content,
    });
    return { record: row, honesty: smartCityPlatformHonesty() };
  }
}
