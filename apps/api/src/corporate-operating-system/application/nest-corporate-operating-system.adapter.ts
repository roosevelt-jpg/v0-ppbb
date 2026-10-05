import { Injectable } from '@nestjs/common';
import { CorporateOperatingSystemService } from '../corporate-operating-system.service';
import {
  CorporateOperatingSystemCatalogPort,
  CorporateOperatingSystemEngineBundle,
  CorporateOperatingSystemProductRow,
} from './ports';

@Injectable()
export class NestCorporateOperatingSystemCatalogAdapter implements CorporateOperatingSystemCatalogPort {
  constructor(private readonly service: CorporateOperatingSystemService) {}

  engine(): CorporateOperatingSystemEngineBundle {
    return this.service.products();
  }

  listProducts(): CorporateOperatingSystemProductRow[] {
    const bundle = this.engine() as { products?: CorporateOperatingSystemProductRow[]; capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }> };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: '/corporate-operating-system',
        notes: c.notes ?? '',
      }));
    }
    return [{
      id: 'corporate-operating-system',
      name: 'Corporate Operating System',
      status: 'shipped',
      api: 'GET /v1/corporate-operating-system/products',
      console: '/corporate-operating-system',
      notes: 'shipped.',
    }];
  }
}
