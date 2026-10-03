import { Injectable } from '@nestjs/common';
import { CorporateRiskPlatformService } from '../corporate-risk-platform.service';
import {
  CorporateRiskPlatformCatalogPort,
  CorporateRiskPlatformEngineBundle,
  CorporateRiskPlatformProductRow,
} from './ports';

@Injectable()
export class NestCorporateRiskPlatformCatalogAdapter implements CorporateRiskPlatformCatalogPort {
  constructor(private readonly service: CorporateRiskPlatformService) {}

  engine(): CorporateRiskPlatformEngineBundle {
    return this.service.engine();
  }

  listProducts(): CorporateRiskPlatformProductRow[] {
    const bundle = this.engine() as { products?: CorporateRiskPlatformProductRow[]; capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }> };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: '/corporate-risk-platform',
        notes: c.notes ?? '',
      }));
    }
    return [{
      id: 'corporate-risk-platform',
      name: 'Corporate Risk Platform',
      status: 'shipped',
      api: 'GET /v1/corporate-risk-platform/engine',
      console: '/corporate-risk-platform',
      notes: 'shipped.',
    }];
  }
}
