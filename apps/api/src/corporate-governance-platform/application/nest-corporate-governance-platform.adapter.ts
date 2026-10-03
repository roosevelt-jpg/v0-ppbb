import { Injectable } from '@nestjs/common';
import { CorporateGovernancePlatformService } from '../corporate-governance-platform.service';
import {
  CorporateGovernancePlatformCatalogPort,
  CorporateGovernancePlatformEngineBundle,
  CorporateGovernancePlatformProductRow,
} from './ports';

@Injectable()
export class NestCorporateGovernancePlatformCatalogAdapter implements CorporateGovernancePlatformCatalogPort {
  constructor(private readonly service: CorporateGovernancePlatformService) {}

  engine(): CorporateGovernancePlatformEngineBundle {
    return this.service.engine();
  }

  listProducts(): CorporateGovernancePlatformProductRow[] {
    const bundle = this.engine() as { products?: CorporateGovernancePlatformProductRow[]; capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }> };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: '/corporate-governance-platform',
        notes: c.notes ?? '',
      }));
    }
    return [{
      id: 'corporate-governance-platform',
      name: 'Corporate Governance Platform',
      status: 'shipped',
      api: 'GET /v1/corporate-governance-platform/engine',
      console: '/corporate-governance-platform',
      notes: 'VL-355 shipped.',
    }];
  }
}
