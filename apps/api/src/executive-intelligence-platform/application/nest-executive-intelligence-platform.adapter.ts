import { Injectable } from '@nestjs/common';
import { ExecutiveIntelligencePlatformService } from '../executive-intelligence-platform.service';
import {
  ExecutiveIntelligencePlatformCatalogPort,
  ExecutiveIntelligencePlatformEngineBundle,
  ExecutiveIntelligencePlatformProductRow,
} from './ports';

@Injectable()
export class NestExecutiveIntelligencePlatformCatalogAdapter implements ExecutiveIntelligencePlatformCatalogPort {
  constructor(private readonly service: ExecutiveIntelligencePlatformService) {}

  engine(): ExecutiveIntelligencePlatformEngineBundle {
    return this.service.engine();
  }

  listProducts(): ExecutiveIntelligencePlatformProductRow[] {
    const bundle = this.engine() as { products?: ExecutiveIntelligencePlatformProductRow[]; capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }> };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: '/executive-intelligence-platform',
        notes: c.notes ?? '',
      }));
    }
    return [{
      id: 'executive-intelligence-platform',
      name: 'Executive Intelligence Platform',
      status: 'shipped',
      api: 'GET /v1/executive-intelligence-platform/engine',
      console: '/executive-intelligence-platform',
      notes: 'shipped.',
    }];
  }
}
